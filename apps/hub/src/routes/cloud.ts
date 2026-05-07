import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { ConflictError, ValidationError } from '../lib/errors.js';

const PairBody = z.object({
  code: z.string().regex(/^\d{6}$/, 'code deve ter 6 dígitos'),
  cloudBaseUrl: z.string().url().optional(),
  hubName: z.string().trim().min(1).max(80).optional(),
});

const PairResponse = z.object({
  apiKey: z.string().min(32),
  tenantId: z.string().uuid(),
  tenantSlug: z.string(),
  tenantNome: z.string(),
  hubId: z.string().uuid(),
  hubNome: z.string(),
  pairedAt: z.number().int(),
});

const cloudRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/cloud/status', { preHandler: app.requireAdmin }, async () => {
    const link = app.repos.cloudLink.get();
    if (!link) return { paired: false };
    return {
      paired: true,
      cloudBaseUrl: link.cloudBaseUrl,
      tenantId: link.tenantId,
      tenantNome: link.tenantNome,
      hubId: link.hubId,
      hubNome: link.hubNome,
      pairedAt: link.pairedAt,
      lastSyncAt: link.lastSyncAt,
      lastSyncVersion: link.lastSyncVersion,
    };
  });

  app.post('/admin/cloud/pair', { preHandler: app.requireAdmin }, async (request) => {
    const parsed = PairBody.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('payload inválido', parsed.error.issues);
    }
    const existing = app.repos.cloudLink.get();
    if (existing) {
      throw new ConflictError('hub já está pareado — execute unpair primeiro');
    }

    const cloudBaseUrl =
      parsed.data.cloudBaseUrl ?? process.env.CLOUD_BASE_URL;
    if (!cloudBaseUrl) {
      throw new ValidationError('cloudBaseUrl ausente e CLOUD_BASE_URL não setado', {});
    }

    const url = new URL('/api/hub/pair', cloudBaseUrl).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        code: parsed.data.code,
        hubName: parsed.data.hubName,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      app.log.warn({ status: res.status, body: text }, 'cloud pair rejected');
      throw new ConflictError(`cloud retornou ${res.status}: ${text || 'erro'}`);
    }

    const payload = await res.json();
    const ok = PairResponse.safeParse(payload);
    if (!ok.success) {
      app.log.error({ issues: ok.error.issues }, 'cloud pair response inválido');
      throw new ValidationError('resposta do cloud inválida', ok.error.issues);
    }

    const link = app.repos.cloudLink.set({
      cloudBaseUrl,
      tenantId: ok.data.tenantId,
      tenantNome: ok.data.tenantNome,
      hubId: ok.data.hubId,
      hubNome: ok.data.hubNome,
      apiKey: ok.data.apiKey,
    });

    app.log.info(
      { tenantId: link.tenantId, hubId: link.hubId, cloudBaseUrl: link.cloudBaseUrl },
      'hub pareado com cloud',
    );

    return {
      paired: true,
      tenantId: link.tenantId,
      tenantNome: link.tenantNome,
      hubId: link.hubId,
      hubNome: link.hubNome,
      pairedAt: link.pairedAt,
    };
  });

  app.post('/admin/cloud/unpair', { preHandler: app.requireAdmin }, async () => {
    app.repos.cloudLink.clear();
    app.log.info('hub despareado do cloud');
    return { paired: false };
  });
};

export default cloudRoutes;
