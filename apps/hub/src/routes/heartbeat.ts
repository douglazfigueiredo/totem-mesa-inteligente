import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';

const HeartbeatRequest = z.object({
  clientTime: z.number().int().nonnegative().optional(),
});

const heartbeatRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/heartbeat',
    { preHandler: app.requireDevice },
    async (request) => {
      const body = HeartbeatRequest.parse(request.body ?? {});
      const serverTime = Date.now();
      return {
        deviceId: request.device!.id,
        serverTime,
        driftMs: body.clientTime !== undefined ? serverTime - body.clientTime : null,
      };
    },
  );
};

export default heartbeatRoutes;
