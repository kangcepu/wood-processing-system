FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY frontend/package.json frontend/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile --filter frontend...

FROM deps AS build
COPY . .
RUN pnpm --filter frontend build

FROM base AS production
ENV NODE_ENV=production
RUN groupadd --system wps && useradd --system --gid wps wps
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./frontend/.next/static
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/ecosystem.config.cjs ./frontend/ecosystem.config.cjs
RUN npm install -g pm2
USER wps
EXPOSE 3000
WORKDIR /app/frontend
CMD ["pm2-runtime", "ecosystem.config.cjs"]

FROM base AS development
ENV NODE_ENV=development
CMD ["pnpm", "--filter", "frontend", "dev"]
