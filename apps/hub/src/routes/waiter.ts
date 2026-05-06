import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { EmployeeId, TableId, WaiterCallId, WaiterCallReason } from '@app/schemas';

const CreateWaiterCallRequest = z.object({
  tableId: TableId,
  reason: WaiterCallReason,
  obs: z.string().max(200).optional(),
});

const ResolveWaiterCallRequest = z.object({
  employeeId: EmployeeId,
});

const waiterRoutes: FastifyPluginAsync = async (app) => {
  app.post('/waiter/calls', { preHandler: app.requireRole(['totem']) }, async (request, reply) => {
    const body = CreateWaiterCallRequest.parse(request.body);
    const call = app.repos.waiter.create({
      tenantId: request.device!.tenantId,
      tableId: body.tableId,
      reason: body.reason,
      obs: body.obs,
    });
    app.publishAndEnqueue('waiter:call', call.tenantId, {
      tableId: call.tableId,
      reason: call.reason,
      obs: call.obs,
      callId: call.id,
      createdAt: call.createdAt,
    });
    return reply.code(201).send(call);
  });

  app.post(
    '/waiter/calls/:id/ack',
    { preHandler: app.requireRole(['waiter', 'admin']) },
    async (request) => {
      const { id } = z.object({ id: WaiterCallId }).parse(request.params);
      const body = ResolveWaiterCallRequest.parse(request.body);
      const call = app.repos.waiter.ack(id, body.employeeId);
      app.publishAndEnqueue('waiter:ack', call.tenantId, {
        callId: call.id,
        employeeId: body.employeeId,
      });
      return call;
    },
  );

  app.post(
    '/waiter/calls/:id/resolve',
    { preHandler: app.requireRole(['waiter', 'admin']) },
    async (request) => {
      const { id } = z.object({ id: WaiterCallId }).parse(request.params);
      const body = ResolveWaiterCallRequest.parse(request.body);
      const call = app.repos.waiter.resolve(id, body.employeeId);
      app.publishAndEnqueue('waiter:resolved', call.tenantId, {
        callId: call.id,
        employeeId: body.employeeId,
      });
      return call;
    },
  );
};

export default waiterRoutes;
