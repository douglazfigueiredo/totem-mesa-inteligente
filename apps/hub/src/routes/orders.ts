import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import {
  Bps,
  EventId,
  OrderId,
  OrderItem,
  TableId,
  applyBps,
  type ItemDestino,
  type OrderDestino,
} from '@app/schemas';
import { newEventId, newOrderItemId } from '../lib/ids.js';
import { ValidationError } from '../lib/errors.js';

const CreateOrderItem = OrderItem.omit({ id: true });

const CreateOrderRequest = z.object({
  tableId: TableId,
  items: z.array(CreateOrderItem).min(1).max(50),
  taxaServicoBps: Bps.optional(),
  obs: z.string().max(500).optional(),
});

const computeDestino = (items: { destino: ItemDestino }[]): OrderDestino => {
  const set = new Set(items.map((i) => i.destino));
  if (set.size > 1) return 'ambos';
  return [...set][0] === 'garcom' ? 'garcom' : 'cozinha';
};

const ordersRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/orders',
    { preHandler: app.requireRole(['totem']) },
    async (request, reply) => {
      const body = CreateOrderRequest.parse(request.body);
      const eventIdHeader = request.headers['x-event-id'];
      const eventId =
        typeof eventIdHeader === 'string'
          ? EventId.parse(eventIdHeader)
          : newEventId();

      const cached = app.repos.idempotency.get(eventId);
      if (cached?.resultJson) {
        request.log.info({ eventId }, 'replay from idempotency cache');
        return reply.code(200).send(JSON.parse(cached.resultJson));
      }

      const itemsWithIds = body.items.map((it) => {
        const expectedTotal = it.unitPriceCents * it.qty;
        if (it.totalPriceCents !== expectedTotal) {
          throw new ValidationError('totalPriceCents nao bate com unitPriceCents * qty', {
            expected: expectedTotal,
            received: it.totalPriceCents,
          });
        }
        return { ...it, id: newOrderItemId() };
      });

      const subtotalCents = itemsWithIds.reduce((s, i) => s + i.totalPriceCents, 0);
      const taxaServicoBps = body.taxaServicoBps ?? 1000;
      const taxaServicoCents = applyBps(subtotalCents, taxaServicoBps);
      const totalCents = subtotalCents + taxaServicoCents;

      const order = app.repos.orders.create({
        tenantId: request.device!.tenantId,
        tableId: body.tableId,
        destino: computeDestino(itemsWithIds),
        items: itemsWithIds,
        subtotalCents,
        taxaServicoBps,
        taxaServicoCents,
        totalCents,
        obs: body.obs,
      });

      app.publishAndEnqueue('order:created', order.tenantId, { order });

      app.repos.idempotency.record({
        eventId,
        type: 'order:create',
        deviceId: request.device!.id,
        result: order,
      });

      return reply.code(201).send(order);
    },
  );

  app.get(
    '/orders/:id',
    { preHandler: app.requireDevice },
    async (request) => {
      const { id } = z.object({ id: OrderId }).parse(request.params);
      return app.repos.orders.getByIdOrThrow(id);
    },
  );

  app.post(
    '/orders/:id/cancel',
    { preHandler: app.requireRole(['totem', 'admin']) },
    async (request) => {
      const { id } = z.object({ id: OrderId }).parse(request.params);
      const { reason } = z
        .object({ reason: z.string().min(1).max(200) })
        .parse(request.body);
      const cancelled = app.repos.orders.cancel(id, reason);
      app.publishAndEnqueue('order:cancel', cancelled.tenantId, {
        orderId: cancelled.id,
        reason,
      });
      return cancelled;
    },
  );
};

export default ordersRoutes;
