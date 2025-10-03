import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { apiRouter } from './routes/api.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

if (env.ENABLE_CORS && env.FRONTEND_ORIGIN) {
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
} else if (env.ENABLE_CORS) {
  app.use(cors());
}

app.use(express.json({ limit: '1mb' }));
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
