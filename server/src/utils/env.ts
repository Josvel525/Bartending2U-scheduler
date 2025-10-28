import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().optional().default(4000),
  DEV_ORIGIN: z.string().optional(),
  PRISMA_PROVIDER: z.enum(['sqlite', 'postgresql']).default('postgresql'),
  DATABASE_URL: z.string().optional(),
});

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DEV_ORIGIN: process.env.DEV_ORIGIN,
  PRISMA_PROVIDER: process.env.PRISMA_PROVIDER,
  DATABASE_URL: process.env.DATABASE_URL,
});

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${parsedEnv.error.message}`);
}

const env = parsedEnv.data;

if (!env.DATABASE_URL && env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL must be provided in production environments.');
}

export { env };

export default env;
