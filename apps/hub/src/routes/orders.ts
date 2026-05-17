import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { Bps, EventId, OrderId, OrderItem, TableId, applyBps } from '@app/schemas';
import { newEventId, newOrderItemId } from '../lib/ids.js';
import { ValidationError } from '../lib/errors.js';

const CreateOrderItem = OrderItem.omit({ id: true });

const CreateOrderRequest = z.object({
  tableId: TableId,
  items: z.array(CreateOrderItem).min(1).max(50),
  taxaServicoBps: Bps.optional(),
  obs: z.string().max(500).optional(),
});

const ordersRoutes: FastifyPluginAsync = async (app) => {
  app.post('/orders', { preHandler: app.requireRole(['totem']) }, async (request, reply) => {
    const body = CreateOrderRequest.parse(request.body);
    const eventIdHeader = request.headers['x-event-id'];
    const eventId = typeof eventIdHeader === 'string' ? EventId.parse(eventIdHeader) : newEventId();

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

    const taxaServicoBps = body.taxaServicoBps ?? 1000;

    // Cada item carrega seu destino (cozinha/garcom). Pedidos mistos viram
    // 2 sub-pedidos independentes: um cozinha (com timer/preparo) e outro
    // garçom (nasce 'pronto', pode ser entregue imediatamente).
    const buckets: { destino: 'cozinha' | 'garcom'; items: typeof itemsWithIds }[] = [];
    const kitchenItems = itemsWithIds.filter((i) => i.destino === 'cozinha');
    const garcomItems = itemsWithIds.filter((i) => i.destino === 'garcom');
    if (kitchenItems.length > 0) buckets.push({ destino: 'cozinha', items: kitchenItems });
    if (garcomItems.length > 0) buckets.push({ destino: 'garcom', items: garcomItems });

    const created = buckets.map((bucket) => {
      const subtotalCents = bucket.items.reduce((s, i) => s + i.totalPriceCents, 0);
      const taxaServicoCents = applyBps(subtotalCents, taxaServicoBps);
      const totalCents = subtotalCents + taxaServicoCents;
      const order = app.repos.orders.create({
        tenantId: request.device!.tenantId,
        tableId: body.tableId,
        destino: bucket.destino,
        initialStatus: bucket.destino === 'garcom' ? 'pronto' : 'criado',
        items: bucket.items,
        subtotalCents,
        taxaServicoBps,
        taxaServicoCents,
        totalCents,
        obs: body.obs,
      });
      app.publishAndEnqueue('order:created', order.tenantId, { order });
      return order;
    });

    // Primário pra resposta/track: cozinha quando existe (carrega timer),
    // senão o de garçom. Cliente acompanha esse no /track; o outro aparece
    // em ActiveOrders quando relevante.
    const primary = created.find((o) => o.destino === 'cozinha') ?? created[0];

    app.repos.idempotency.record({
      eventId,
      type: 'order:create',
      deviceId: request.device!.id,
      result: primary,
    });

    return reply.code(201).send(primary);
  });

  app.get('/orders/:id', { preHandler: app.requireDevice }, async (request) => {
    const { id } = z.object({ id: OrderId }).parse(request.params);
    return app.repos.orders.getByIdOrThrow(id);
  });

  app.post(
    '/orders/:id/cancel',
    { preHandler: app.requireRole(['totem', 'admin']) },
    async (request) => {
      const { id } = z.object({ id: OrderId }).parse(request.params);
      const { reason } = z.object({ reason: z.string().min(1).max(200) }).parse(request.body);
      const cancelled = app.repos.orders.cancel(id, reason);
      app.publishAndEnqueue('order:cancel', cancelled.tenantId, {
        orderId: cancelled.id,
        reason,
      });
      return cancelled;
    },
  );

  app.post(
    '/orders/:id/deliver',
    { preHandler: app.requireRole(['waiter', 'admin']) },
    async (request) => {
      const { id } = z.object({ id: OrderId }).parse(request.params);
      const { employeeId } = z
        .object({ employeeId: z.string().min(1) })
        .parse(request.body);
      const current = app.repos.orders.getByIdOrThrow(id);
      if (current.status === 'entregue') return current;
      if (current.status === 'cancelado') {
        throw new ValidationError('cannot deliver cancelled order', { id });
      }
      const delivered = app.repos.orders.updateStatus(id, 'entregue');
      const deliveredAt = Date.now();
      app.publishAndEnqueue('order:delivered', delivered.tenantId, {
        orderId: delivered.id,
        deliveredBy: employeeId as never,
        deliveredAt,
      });
      return delivered;
    },
  );
};

export default ordersRoutes;
