# Spellbound Arena — Server

NestJS API with **PostgreSQL** and **Prisma**.

## Quick start

```bash
# From repository root
npm run docker:db
cp server/.env.example server/.env
npm install
npm run db:migrate --prefix server   # after adding models to schema.prisma
npm run start:server
```

## Prisma

| File | Role |
|------|------|
| `prisma/schema.prisma` | Schema, migrations, DB provider (`postgresql`) |
| `src/prisma/prisma.config.ts` | Runtime client options (`DATABASE_URL`, logging) |
| `src/prisma/prisma.service.ts` | Nest provider — connects on app start |
| `src/prisma/prisma.module.ts` | Registers Prisma globally in Nest |

`main.ts` is required: NestJS has no built-in auto-start — something must call `NestFactory.create(AppModule)`.

| Command | Description |
|---------|-------------|
| `npm run docker:db` | Start Postgres in Docker |
| `npm run docker:db:down` | Stop Postgres |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:studio` | Prisma Studio |

## Environment

See `server/.env.example` — `DATABASE_URL` and `PORT`.
