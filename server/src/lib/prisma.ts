import { PrismaClient } from '@prisma/client';
import env from '../utils/env.js';
import { createMockPrismaClient, MockPrismaClient } from './mockPrisma.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const mockFlag = String(process.env.MOCK_PRISMA || '').toLowerCase();
const explicitMock = mockFlag === 'true' || mockFlag === '1' || mockFlag === 'yes';
const placeholderDatabaseUrls = new Set([
  'postgresql://username:password@localhost:5432/database',
  'postgresql://postgres:postgres@localhost:5432/bartending2u',
]);
const hasRealDatabaseUrl = Boolean(env.DATABASE_URL && !placeholderDatabaseUrls.has(env.DATABASE_URL));
const isProduction = env.NODE_ENV === 'production';
const shouldUseMock =
  explicitMock ||
  (!hasRealDatabaseUrl && !isProduction);

if (!hasRealDatabaseUrl && isProduction && !explicitMock) {
  throw new Error('DATABASE_URL must be set in production or enable MOCK_PRISMA.');
}

const prismaClient: PrismaClient | MockPrismaClient = shouldUseMock
  ? createMockPrismaClient()
  : globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (!shouldUseMock && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient as PrismaClient;
}

export const prisma = prismaClient as unknown as PrismaClient;

export default prisma;
