import 'dotenv/config';

type Env = {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  FRONTEND_ORIGIN?: string;
  ENABLE_CORS: boolean;
};

const nodeEnv = (process.env.NODE_ENV as Env['NODE_ENV']) || 'development';
const port = Number(process.env.PORT) || 4000;
const enableCors = process.env.ENABLE_CORS ? process.env.ENABLE_CORS === 'true' : nodeEnv !== 'production';

export const env: Env = {
  NODE_ENV: nodeEnv,
  PORT: port,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  ENABLE_CORS: enableCors,
};

if (!process.env.DATABASE_URL) {
  const defaultDbUrl = nodeEnv === 'production'
    ? undefined
    : 'file:../dev.db';

  if (defaultDbUrl) {
    process.env.DATABASE_URL = defaultDbUrl;
    process.env.DATABASE_PROVIDER = 'sqlite';
  }
}

if (!process.env.DATABASE_PROVIDER) {
  process.env.DATABASE_PROVIDER = process.env.NODE_ENV === 'production' ? 'postgresql' : 'sqlite';
}
