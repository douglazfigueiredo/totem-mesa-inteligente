import fp from 'fastify-plugin';
import type { FastifyError, FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { DomainError } from '../lib/errors.js';

const errorHandler: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((err: FastifyError, request, reply) => {
    if (err instanceof ZodError) {
      request.log.warn({ issues: err.issues }, 'validation failed');
      return reply.code(422).send({
        code: 'validation',
        message: 'invalid request',
        issues: err.issues,
      });
    }

    if (err instanceof DomainError) {
      request.log.warn({ code: err.code, msg: err.message }, 'domain error');
      const body: Record<string, unknown> = { code: err.code, message: err.message };
      if ('issues' in err && err.issues !== undefined) {
        body.issues = err.issues;
      }
      return reply.code(err.httpStatus).send(body);
    }

    if (err.statusCode && err.statusCode < 500) {
      return reply.code(err.statusCode).send({ code: 'client_error', message: err.message });
    }

    request.log.error({ err }, 'unhandled error');
    return reply.code(500).send({ code: 'internal', message: 'internal server error' });
  });
};

export default fp(errorHandler, { name: 'error-handler' });
