ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ \
  && corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/hub/package.json apps/hub/
COPY packages/schemas/package.json packages/schemas/
COPY packages/types/package.json packages/types/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/hub/node_modules ./apps/hub/node_modules
COPY --from=deps /repo/packages/schemas/node_modules ./packages/schemas/node_modules
COPY --from=deps /repo/packages/types/node_modules ./packages/types/node_modules
COPY . .
RUN pnpm --filter @app/schemas --filter @app/types --filter @app/hub build

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache tini && corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /repo/apps/hub/dist ./dist
COPY --from=build /repo/apps/hub/package.json ./package.json
COPY --from=build /repo/apps/hub/node_modules ./node_modules
COPY --from=build /repo/packages ./packages

EXPOSE 4000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
