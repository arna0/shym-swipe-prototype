import { ProblemReport, ProblemCategory, District, EKCStatus } from '../../types';
import { EKC109DispatchPayload } from '../types';

export const EKC109_ESCALATION_THRESHOLD = 50; // 50 свайпов вправо для автоматической эскалации

export interface DepartmentRouting {
  department: string;
  contractor: string;
  defaultSlaHours: number;
}

export const DISTRICT_DEPARTMENT_ROUTING: Record<ProblemCategory, DepartmentRouting> = {
  [ProblemCategory.ZHKH]: {
    department: 'Управление энергетики и развития инфраструктуры г. Шымкент',
    contractor: 'ГКП «Су ресурстары-Маркетинг» / ГКП «Қуатжылуорталық-3»',
    defaultSlaHours: 24,
  },
  [ProblemCategory.SAFETY]: {
    department: 'Ситуационный центр 109 & Департамент полиции г. Шымкент',
    contractor: 'ТОО «Оңтүстік Жарық Транзит» / Аварийная служба 109',
    defaultSlaHours: 12,
  },
  [ProblemCategory.ROADS]: {
    department: 'Управление пассажирского транспорта и автомобильных дорог г. Шымкент',
    contractor: 'ТОО «ШымкентДорСтрой» / РемДорСервис',
    defaultSlaHours: 48,
  },
  [ProblemCategory.ECOLOGY]: {
    department: 'Департамент экологии & Управление комфортной городской среды',
    contractor: 'ТОО «ЛТД Тұрмыс» / Эко-патруль Шымкента',
    defaultSlaHours: 24,
  },
  [ProblemCategory.TRANSPORT]: {
    department: 'Управление пассажирского транспорта г. Шымкент',
    contractor: 'ТОО «Shymkent Bus» / ТОО «Т-Pass Шымкент»',
    defaultSlaHours: 48,
  },
  [ProblemCategory.ACCESSIBILITY]: {
    department: 'Управление занятости и социальной защиты г. Шымкент',
    contractor: 'Районный отдел инклюзивной инфраструктуры',
    defaultSlaHours: 72,
  },
  [ProblemCategory.LANDSCAPING]: {
    department: 'Аппарат акима района (Шымкент)',
    contractor: 'ГКП «Жасыл қала» / Районные подрядные организации',
    defaultSlaHours: 48,
  },
};

export class EKC109IntegrationService {
  /**
   * Generates an official simulated dispatch ticket to Shymkent Contact Center 109
   */
  public generateTicket(problem: ProblemReport): {
    ticketId: string;
    payload: EKC109DispatchPayload;
    responseText: string;
  } {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `EKC-109-${dateStr}-${randomSuffix}`;

    const routing = DISTRICT_DEPARTMENT_ROUTING[problem.category] || {
      department: 'Единый контакт-центр 109 аппарата акима г. Шымкент',
      contractor: 'Дежурная аварийная служба района',
      defaultSlaHours: 24,
    };

    const isUrgent = problem.category === ProblemCategory.ZHKH || problem.category === ProblemCategory.SAFETY;
    const slaHours = isUrgent ? Math.min(12, routing.defaultSlaHours) : routing.defaultSlaHours;

    const payload: EKC109DispatchPayload = {
      ticketId,
      sourceSystem: 'SHYMKENT_SWIPE_OPEN_API',
      status: EKCStatus.IN_WORK_109,
      priority: isUrgent ? 'CRITICAL_HOT_INCIDENT' : 'HIGH',
      assignedDepartment: routing.department,
      contractor: routing.contractor,
      estimatedSlaHours: slaHours,
      dispatchedAt: new Date().toISOString(),
      problemSummary: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        category: problem.category,
        district: problem.district,
        address: problem.address,
        coordinates: {
          latitude: problem.latitude,
          longitude: problem.longitude,
        },
        osmPlaceId: problem.osmPlaceId,
        photoUrls: problem.photoUrls,
      },
      communityValidation: {
        thresholdPassed: EKC109_ESCALATION_THRESHOLD,
        totalRightSwipes: problem.swipeRightCount,
        totalLeftSwipes: problem.swipeLeftCount,
        totalVolunteerOffers: problem.swipeUpCount,
        criticalityScore: problem.criticalityIndex,
        localCitizenRatioPercent: 88,
      },
    };

    const responseText = `Заявка зарегистрирована в ЕКЦ 109 г. Шымкент под номером #${ticketId}. Статус: «Горячий инцидент» (превышен порог 50 свайпов горожан). Ответственный исполнитель: ${routing.contractor}. Нормативный срок устранения (SLA): ${slaHours} часов.`;

    return {
      ticketId,
      payload,
      responseText,
    };
  }
}

export const ekc109Service = new EKC109IntegrationService();
