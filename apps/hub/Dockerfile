ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ \
  && corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/hub/package.json apps/hub/
COPY packages/schemas/package.json packages/schemas/
COPY packages/types/package.json packages/types/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo ./
COPY tsconfig.base.json turbo.json ./
COPY apps/hub apps/hub
COPY packages/schemas packages/schemas
COPY packages/types packages/types
RUN pnpm --filter @app/schemas build \
 && pnpm --filter @app/types build \
 && pnpm --filter @app/hub build

FROM base AS deploy
COPY --from=build /repo ./
RUN pnpm deploy --filter @app/hub --prod /deploy

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache tini wget \
 && mkdir -p /data \
 && chown -R node:node /data
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PATH=/data/hub.db

COPY --from=deploy --chown=node:node /deploy ./

EXPOSE 4000
USER node
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
