import { PrismaClient } from '@prisma/client';
import { createMockPrismaClient, MockPrismaClient } from './mockPrisma.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const mockFlag = String(process.env.MOCK_PRISMA || '').toLowerCase();
const shouldUseMock = mockFlag === 'true' || mockFlag === '1' || mockFlag === 'yes';

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
