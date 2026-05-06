import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { UnauthorizedError } from '../lib/errors.js';

const PinLoginRequest = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'PIN deve ter 4-6 digitos'),
});

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/pin', { preHandler: app.requireDevice }, async (request) => {
    const body = PinLoginRequest.parse(request.body);
    const employee = app.repos.employees.findByPin(request.device!.tenantId, body.pin);
    if (!employee) {
      throw new UnauthorizedError('PIN invalido');
    }
    return {
      employee: {
        id: employee.id,
        nome: employee.nome,
        roles: employee.roles,
      },
    };
  });
};

export default authRoutes;
