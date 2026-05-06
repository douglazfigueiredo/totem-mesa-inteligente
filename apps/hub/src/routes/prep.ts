import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { EmployeeId, EventId, OrderId, PreparoId } from '@app/schemas';
import { newEventId } from '../lib/ids.js';

const PrepStartRequest = z.object({
  orderId: OrderId,
  employeeId: EmployeeId,
  durationSec: z.number().int().positive().max(60 * 60 * 4),
});

const prepRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/prep/start',
    { preHandler: app.requireRole(['kds']) },
    async (request, reply) => {
      const body = PrepStartRequest.parse(request.body);
      const eventIdHeader = request.headers['x-event-id'];
      const eventId =
        typeof eventIdHeader === 'string'
          ? EventId.parse(eventIdHeader)
          : newEventId();

      const cached = app.repos.idempotency.get(eventId);
      if (cached?.resultJson) {
        return reply.code(200).send(JSON.parse(cached.resultJson));
      }

      const order = app.repos.orders.getByIdOrThrow(body.orderId);
      const preparo = app.repos.preparos.start({
        orderId: body.orderId,
        employeeId: body.employeeId,
        durationSec: body.durationSec,
      });

      app.repos.orders.updateStatus(body.orderId, 'preparando');

      app.publishAndEnqueue('prep:started', order.tenantId, {
        preparo,
        serverTime: preparo.startedAt,
      });

      app.repos.idempotency.record({
        eventId,
        type: 'prep:start',
        deviceId: request.device!.id,
        result: preparo,
      });

      return reply.code(201).send(preparo);
    },
  );

  app.post(
    '/prep/:id/ready',
    { preHandler: app.requireRole(['kds', 'admin']) },
    async (request) => {
      const { id } = z.object({ id: PreparoId }).parse(request.params);
      const ready = app.repos.preparos.markReady(id);
      const order = app.repos.orders.getByIdOrThrow(ready.orderId);
      app.repos.orders.updateStatus(ready.orderId, 'pronto');
      app.publishAndEnqueue('prep:ready', order.tenantId, {
        orderId: ready.orderId,
        preparoId: ready.id,
        readyAt: ready.readyAt!,
      });
      return ready;
    },
  );
};

export default prepRoutes;
