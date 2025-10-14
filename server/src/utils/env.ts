import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().optional().default(4000),
  DEV_ORIGIN: z.string().optional(),
  PRISMA_PROVIDER: z.enum(['sqlite', 'postgresql']).default('postgresql'),
  DATABASE_URL: z.string(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DEV_ORIGIN: process.env.DEV_ORIGIN,
  PRISMA_PROVIDER: process.env.PRISMA_PROVIDER,
  DATABASE_URL: process.env.DATABASE_URL,
});

export default env;
