import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { EventId, TableId } from '@app/schemas';

const StateSyncRequest = z.object({
  tableId: TableId,
  lastEventId: EventId.optional(),
});

const stateRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/state/sync',
    { preHandler: app.requireRole(['totem', 'kds', 'waiter']) },
    async (request) => {
      const body = StateSyncRequest.parse(request.body);
      const tenantId = request.device!.tenantId;

      const activeOrders = app.repos.orders.listActiveByTable(body.tableId);
      const activePreparos = activeOrders
        .map((o) => app.repos.preparos.getByOrderId(o.id))
        .filter((p): p is NonNullable<typeof p> => p !== null);
      const pendingWaiterCalls = app.repos.waiter
        .listPending(tenantId)
        .filter((c) => c.tableId === body.tableId);

      return {
        tableId: body.tableId,
        serverTime: Date.now(),
        activeOrders,
        activePreparos,
        pendingWaiterCalls,
        orderStatuses: activeOrders.map((o) => ({ orderId: o.id, status: o.status })),
      };
    },
  );
};

export default stateRoutes;
