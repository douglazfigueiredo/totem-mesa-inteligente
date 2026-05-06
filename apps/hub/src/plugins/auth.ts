import { timingSafeEqual } from 'node:crypto';
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { DeviceRow } from '../repositories/device.repo.js';
import type { DeviceRole } from '@app/schemas';
import { UnauthorizedError } from '../lib/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    device?: DeviceRow;
  }
  interface FastifyInstance {
    requireDevice: preHandlerHookHandler;
    requireRole: (roles: DeviceRole[]) => preHandlerHookHandler;
    requireAdmin: preHandlerHookHandler;
  }
}

const constantEq = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
};

export type AuthOptions = {
  adminSecret?: string;
};

const authPlugin: FastifyPluginAsync<AuthOptions> = async (app, opts) => {
  const adminSecret = opts.adminSecret ?? process.env.ADMIN_SECRET ?? '';

  app.decorateRequest('device', undefined);

  const authenticate = async (request: FastifyRequest): Promise<DeviceRow> => {
    const apiKey = request.headers['x-device-api-key'];
    if (typeof apiKey !== 'string' || apiKey.length < 10) {
      throw new UnauthorizedError('missing or invalid x-device-api-key');
    }
    const device = app.repos.devices.findByApiKey(apiKey);
    if (!device) {
      throw new UnauthorizedError('device not found or deactivated');
    }
    request.device = device;
    app.repos.devices.updateLastSeen(device.id);
    return device;
  };

  const requireDevice: preHandlerHookHandler = async (request) => {
    await authenticate(request);
  };

  const requireRole = (roles: DeviceRole[]): preHandlerHookHandler => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const device = await authenticate(request);
      if (!roles.includes(device.role)) {
        return reply.code(403).send({
          code: 'forbidden',
          message: `endpoint requer role ${roles.join('|')}, device tem role ${device.role}`,
        });
      }
    };
  };

  const requireAdmin: preHandlerHookHandler = async (request, _reply) => {
    if (!adminSecret) {
      throw new UnauthorizedError('admin endpoints disabled (ADMIN_SECRET unset)');
    }
    const provided = request.headers['x-admin-secret'];
    if (typeof provided !== 'string' || !constantEq(provided, adminSecret)) {
      throw new UnauthorizedError('invalid admin secret');
    }
  };

  app.decorate('requireDevice', requireDevice);
  app.decorate('requireRole', requireRole);
  app.decorate('requireAdmin', requireAdmin);
};

export default fp(authPlugin, { name: 'auth' });
