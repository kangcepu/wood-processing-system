# Wood Processing System

Monorepo untuk Wood Processing System (WPS), terdiri dari aplikasi web Next.js,
API NestJS, dan package bersama untuk kontrak data, komponen UI, ESLint, serta
TypeScript.

## Prasyarat

- Node.js 22 atau lebih baru
- pnpm 9 atau lebih baru
- Docker dan Docker Compose untuk PostgreSQL, MinIO, dan Redis

Versi pnpm yang dikunci oleh proyek tercantum di `package.json`.

## Menjalankan secara lokal

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d postgres minio minio-init
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Frontend tersedia di `http://localhost:3000` dan API di
`http://localhost:3001/api/v1`.

Jangan gunakan nilai contoh untuk secret di luar environment development. Script
`infra/scripts/generate-secrets.sh` dapat dipakai untuk membuat nilai secret baru.

## Perintah utama

```bash
pnpm lint          # pemeriksaan lint seluruh workspace
pnpm typecheck     # pemeriksaan tipe TypeScript
pnpm test          # unit test
pnpm build         # production build
pnpm test:e2e      # end-to-end test
```

## Struktur monorepo

- `frontend/` — aplikasi Next.js
- `backend/` — API NestJS dan schema/migration Prisma
- `packages/contracts/` — schema dan tipe data bersama
- `packages/ui/` — komponen UI bersama
- `packages/eslint-config/` — konfigurasi ESLint bersama
- `packages/typescript-config/` — konfigurasi TypeScript bersama
- `infra/` — script operasional

