import { ProblemReport, ReportStatus, EKCStatus, SwipeAction, SwipeType, getUserLevelInfo, CATEGORY_METADATA } from '../../types';
import { dbRepository } from '../db/repository';
import { CATEGORY_WEIGHTS } from './feedService';
import { ekc109Service, EKC109_ESCALATION_THRESHOLD } from './ekc109Service';
import { SwipeRequestDto, SwipeResponseDto, EKC109DispatchPayload } from '../types';

export class SwipeService {
  /**
   * Processes a swipe action on a problem report:
   * 1. Records SwipeAction in database
   * 2. Adjusts problem importance & criticality
   * 3. Escalates to EKC 109 as «Горячий инцидент» if rightSwipes >= 50
   * 4. Awards +15 XP (+25 XP for volunteer offer) and calculates level-up
   */
  public async processSwipe(dto: SwipeRequestDto): Promise<SwipeResponseDto> {
    const { userId, problemId, swipeType } = dto;

    // 1. Retrieve problem from database
    const problem = dbRepository.getProblemById(problemId);
    if (!problem) {
      throw new Error(`Проблема с ID "${problemId}" не найдена в базе данных.`);
    }

    // 2. Retrieve user
    const user = dbRepository.getUserById(userId);
    if (!user) {
      throw new Error(`Пользователь с ID "${userId}" не найден.`);
    }

    // 3. Prevent duplicate swipe
    const swipedIds = dbRepository.getSwipedProblemIdsByUser(userId);
    if (swipedIds.has(problemId)) {
      throw new Error(`Вы уже проголосовали по заявке "${problemId}". Повторный свайп отклонен.`);
    }

    // 4. Calculate local resident weight
    const isLocalUser = user.district === problem.district;
    const swipeWeight = isLocalUser ? 1.5 : 1.0;

    // 5. Update Problem counters
    const isRightSwipe = swipeType === SwipeType.RIGHT_IMPORTANT || swipeType === SwipeType.UP_VOLUNTEER;
    const isVolunteer = swipeType === SwipeType.UP_VOLUNTEER;
    const isLeftSwipe = swipeType === SwipeType.LEFT_IRRELEVANT;

    if (isRightSwipe) {
      problem.swipeRightCount += 1;
    }
    if (isVolunteer) {
      problem.swipeUpCount += 1;
    }
    if (isLeftSwipe) {
      problem.swipeLeftCount += 1;
    }
    problem.totalViews += 1;

    // 6. Recalculate Criticality Index (Scale 1.00 - 10.00)
    const right = problem.swipeRightCount;
    const left = problem.swipeLeftCount;
    const total = right + left;
    const catWeight = CATEGORY_WEIGHTS[problem.category] || 1.0;

    const approvalRatio = total > 0 ? (right + 1) / (total + 2) : 0.5;
    const volumeMultiplier = Math.min(2.0, Math.log10(1 + right) * 0.8 + 0.5);
    const calculatedCrit = Number(
      Math.min(10.0, Math.max(1.0, (approvalRatio * 6.0 + volumeMultiplier * 2.0) * (catWeight / 1.15))).toFixed(2)
    );
    problem.criticalityIndex = calculatedCrit;

    // 7. Check 50-Swipe Escalation Threshold to ЕКЦ 109 («Горячий инцидент»)
    let escalationTriggered = false;
    let ekcDispatch: EKC109DispatchPayload | null = null;

    const shouldEscalate =
      problem.swipeRightCount >= EKC109_ESCALATION_THRESHOLD &&
      (problem.status === ReportStatus.NEW || problem.status === ReportStatus.VERIFIED || problem.ekc109Status === EKCStatus.PENDING_SYNC);

    if (shouldEscalate) {
      escalationTriggered = true;
      problem.status = ReportStatus.SENT_TO_109;
      problem.ekc109Status = EKCStatus.IN_WORK_109;

      const ticket = ekc109Service.generateTicket(problem);
      problem.ekc109TicketId = ticket.ticketId;
      problem.ekc109SyncedAt = new Date().toISOString();
      problem.ekc109ResponseText = ticket.responseText;
      ekcDispatch = ticket.payload;
    }

    problem.updatedAt = new Date().toISOString();

    // 8. Record SwipeAction
    const recordedSwipe = dbRepository.recordSwipe({
      userId,
      problemId,
      swipeType,
      weight: swipeWeight,
      isLocalUser,
    });

    // 9. Gamification & XP calculation (+15 XP base, +25 XP for volunteer action)
    const previousLevel = user.level;
    const earnedXp = isVolunteer ? 25 : 15;
    user.xp += earnedXp;
    user.swipesCount += 1;

    const levelInfo = getUserLevelInfo(user.xp);
    user.level = levelInfo.level;
    user.updatedAt = new Date().toISOString();

    const leveledUp = user.level > previousLevel;

    // 10. Construct response message
    let message = `Голос зафиксирован (+${earnedXp} XP).`;
    if (escalationTriggered) {
      message = `🔥 Достигнут порог 50 свайпов! Статус изменен на «Горячий инцидент», заявка автоматически передана в ЕКЦ 109 (Тикет #${problem.ekc109TicketId}).`;
    } else if (leveledUp) {
      message = `🎉 Поздравляем! Вы достигли уровня ${user.level} («${levelInfo.titleRu}»)! Начислено +${earnedXp} XP.`;
    }

    return {
      success: true,
      message,
      data: {
        swipe: recordedSwipe,
        problem: {
          id: problem.id,
          title: problem.title,
          status: problem.status,
          isHotIncident: problem.swipeRightCount >= EKC109_ESCALATION_THRESHOLD,
          criticalityIndex: problem.criticalityIndex,
          swipeRightCount: problem.swipeRightCount,
          swipeLeftCount: problem.swipeLeftCount,
          swipeUpCount: problem.swipeUpCount,
          totalViews: problem.totalViews,
          ekc109TicketId: problem.ekc109TicketId,
          ekc109Status: problem.ekc109Status,
          ekc109Dispatch: ekcDispatch,
        },
        user: {
          id: user.id,
          fullName: user.fullName,
          xp: user.xp,
          earnedXp,
          level: user.level,
          levelTitleRu: levelInfo.titleRu,
          levelTitleKz: levelInfo.titleKz,
          xpToNextLevel: levelInfo.xpToNextLevel,
          progressPercent: levelInfo.progressPercent,
          leveledUp,
          swipesCount: user.swipesCount,
          streakDays: user.streakDays,
        },
        escalation: {
          thresholdReached: problem.swipeRightCount >= EKC109_ESCALATION_THRESHOLD,
          currentRightSwipes: problem.swipeRightCount,
          thresholdTarget: EKC109_ESCALATION_THRESHOLD,
          reason: escalationTriggered
            ? `Превышен порог ${EKC109_ESCALATION_THRESHOLD} голосов горожан. Отправлено в ЕКЦ 109.`
            : `До эскалации в ЕКЦ 109 осталось ${Math.max(0, EKC109_ESCALATION_THRESHOLD - problem.swipeRightCount)} свайпов вправо.`,
        },
      },
    };
  }
}

export const swipeService = new SwipeService();
