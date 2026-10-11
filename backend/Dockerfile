FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY backend/package.json backend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile --filter backend...

FROM deps AS build
COPY . .
RUN pnpm --filter backend db:generate
RUN pnpm --filter backend build

FROM base AS production
ENV NODE_ENV=production
RUN groupadd --system wps && useradd --system --gid wps wps
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/ecosystem.config.cjs ./ecosystem.config.cjs
RUN npm install -g pm2
USER wps
EXPOSE 3001
CMD ["pm2-runtime", "ecosystem.config.cjs"]

FROM base AS development
ENV NODE_ENV=development
CMD ["pnpm", "--filter", "backend", "dev"]
