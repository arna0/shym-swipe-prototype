// Static demo mode (GitHub Pages has no server).
// Runs the real API controllers in the browser against the same in-memory
// repository the Express server uses, by intercepting fetch('/api/...').
import { feedController } from '../server/controllers/feedController';
import { swipeController } from '../server/controllers/swipeController';
import { problemController } from '../server/controllers/problemController';
import { aiController } from '../server/controllers/aiController';
import { gamificationController } from '../server/controllers/gamificationController';
import { seedController } from '../server/controllers/seedController';

type Handler = (req: any, res: any) => unknown;
type Route = { method: string; pattern: RegExp; keys: string[]; handler: Handler };

const routes: Route[] = [];
function add(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    '^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$'
  );
  routes.push({ method, pattern, keys, handler });
}

add('GET', '/health', (_req, res) =>
  res.json({ status: 'ok', service: 'Shymkent Swipe (static demo, in-browser API)', timestamp: new Date().toISOString() })
);
add('GET', '/feed', (q, s) => feedController.getFeed(q, s));
add('POST', '/swipe', (q, s) => swipeController.handleSwipe(q, s));
add('POST', '/problems', (q, s) => problemController.createProblem(q, s));
add('GET', '/problems', (q, s) => problemController.getProblems(q, s));
add('PATCH', '/problems/:id/status', (q, s) => problemController.updateStatus(q, s));
add('POST', '/feed/reset', (q, s) => feedController.resetUserSwipes(q, s));
add('POST', '/ai/analyze-complaint', (q, s) => aiController.analyzeComplaint(q, s));
add('GET', '/gamification/leaderboard', (q, s) => gamificationController.getLeaderboard(q, s));
add('POST', '/gamification/claim-streak', (q, s) => gamificationController.claimDailyStreak(q, s));
add('POST', '/demo/seed', (q, s) => seedController.seedDemoData(q, s));

export function installMockApi() {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(rawUrl, window.location.href);
    const match = url.origin === window.location.origin ? url.pathname.match(/\/api(\/.*)$/) : null;
    if (!match) return realFetch(input, init);

    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const path = match[1].replace(/\/+$/, '') || '/';
    let body: unknown = {};
    const rawBody = init?.body ?? (input instanceof Request ? await input.clone().text() : undefined);
    if (typeof rawBody === 'string' && rawBody.length) {
      try { body = JSON.parse(rawBody); } catch { body = {}; }
    }

    for (const r of routes) {
      if (r.method !== method) continue;
      const m = path.match(r.pattern);
      if (!m) continue;
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      const req = { method, body, params, query: Object.fromEntries(url.searchParams.entries()), headers: {} };

      let status = 200;
      let payload: unknown = null;
      const res = {
        status(code: number) { status = code; return res; },
        json(data: unknown) { payload = data; return res; },
        send(data: unknown) { payload = data; return res; },
      };
      try {
        await r.handler(req, res);
      } catch (e: any) {
        status = 500;
        payload = { success: false, error: 'INTERNAL_ERROR', message: e?.message || String(e) };
      }
      await new Promise((ok) => setTimeout(ok, 120)); // feel like a network call
      return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: false, error: 'NOT_FOUND', message: `No demo route for ${method} ${path}` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  console.info('[Shymkent Swipe] Static demo: API runs in the browser, data resets on reload.');
}
