import type { FastifyPluginAsync } from 'fastify';
import { CatalogSnapshot } from '@app/schemas';
import { NotFoundError } from '../lib/errors.js';

const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/catalog', { preHandler: app.requireDevice }, async (request, reply) => {
    const snapshot = app.repos.catalog.getSnapshot(request.device!.tenantId);
    if (!snapshot) {
      throw new NotFoundError('catalog not seeded — admin must POST /admin/catalog');
    }

    const ifNoneMatch = request.headers['if-none-match'];
    const etag = `"v${snapshot.version}"`;
    reply.header('etag', etag);
    reply.header('cache-control', 'private, max-age=30');

    if (ifNoneMatch === etag) {
      return reply.code(304).send();
    }
    return snapshot;
  });

  app.post('/admin/catalog', { preHandler: app.requireAdmin }, async (request, reply) => {
    const body = CatalogSnapshot.parse(request.body);
    const snapshot = app.repos.catalog.replace(body);
    return reply.code(200).send({
      version: snapshot.version,
      categoriesCount: snapshot.categories.length,
      productsCount: snapshot.products.length,
      pulledAt: Date.now(),
    });
  });

  app.get('/catalog/version', { preHandler: app.requireDevice }, async (request) => {
    const version = app.repos.catalog.getVersion(request.device!.tenantId);
    return { version };
  });
};

export default catalogRoutes;
