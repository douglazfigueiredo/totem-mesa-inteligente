import { test, expect } from './fixtures';

test('GET /api/health retorna 200 com db.ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body.status).toBe('ok');
  expect(body.service).toBe('cloud');
  expect(body.db.ok).toBe(true);
  expect(typeof body.db.latencyMs).toBe('number');
});
