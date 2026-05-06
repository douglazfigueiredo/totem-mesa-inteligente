import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { DeviceRole, TableId } from '@app/schemas';
import { generateApiKey } from '../repositories/device.repo.js';

const PairRequest = z.object({
  code: z.string().regex(/^\d{6}$/, 'codigo deve ter 6 digitos'),
  nome: z.string().min(1).max(80),
  tableId: TableId.optional(),
});

const CreatePairingCodeRequest = z.object({
  role: DeviceRole,
  ttlMs: z.number().int().positive().optional(),
});

const devicesRoutes: FastifyPluginAsync = async (app) => {
  app.post('/devices/pair', async (request, reply) => {
    const body = PairRequest.parse(request.body);
    const pairing = app.repos.pairing.consume(body.code);

    if (pairing.role === 'totem' && !body.tableId) {
      return reply.code(422).send({
        code: 'validation',
        message: 'totem requer tableId no pareamento',
      });
    }

    const apiKey = generateApiKey();
    const device = app.repos.devices.create({
      tenantId: pairing.tenantId,
      role: pairing.role,
      nome: body.nome,
      apiKey,
      tableId: body.tableId,
    });

    return reply.code(201).send({
      device: {
        id: device.id,
        tenantId: device.tenantId,
        role: device.role,
        nome: device.nome,
        tableId: device.tableId,
        pairedAt: device.pairedAt,
      },
      apiKey,
    });
  });

  app.post('/admin/pairing-codes', { preHandler: app.requireAdmin }, async (request) => {
    const body = CreatePairingCodeRequest.parse(request.body);
    const tenantId = app.tenantId;
    const created = app.repos.pairing.create({
      tenantId,
      role: body.role,
      ttlMs: body.ttlMs,
    });
    return {
      code: created.code,
      role: created.role,
      expiresAt: created.expiresAt,
    };
  });

  app.get('/pairing/tables', async () => {
    const tables = app.repos.tables.list(app.tenantId);
    return {
      tables: tables.map((t) => ({
        id: t.id,
        numero: t.numero,
        capacidade: t.capacidade,
      })),
    };
  });
};

export default devicesRoutes;
