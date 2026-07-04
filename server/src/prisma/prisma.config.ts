import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';

/**
 * Nest-side Prisma client configuration.
 * Schema and datasource provider live in `prisma/schema.prisma`.
 */
export function getPrismaClientOptions(
  configService: ConfigService,
): Prisma.PrismaClientOptions {
  return {
    datasources: {
      db: {
        url: configService.getOrThrow<string>('DATABASE_URL'),
      },
    },
    log:
      configService.get<string>('NODE_ENV') === 'production'
        ? ['error']
        : ['warn', 'error'],
  };
}
