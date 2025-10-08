import express from 'express';
import cors from 'cors';
import employeesRouter from './routes/employees.js';
import env from './utils/env.js';

const app = express();

const allowedOrigins = new Set(
  [env.DEV_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean)
);

app.use(
  cors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || env.NODE_ENV === 'production') {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use((req, res, next) => {
  if (env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'healthy' } });
});

app.use('/api/employees', employeesRouter);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: { message: `Route not found: ${req.method} ${req.path}` } });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ ok: false, error: { message: 'Unexpected server error' } });
});

export default app;
