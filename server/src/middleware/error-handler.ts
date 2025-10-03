import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/responses.js';

type AppError = Error & {
  status?: number;
  code?: string;
  details?: unknown;
};

export function errorHandler(error: AppError, _req: Request, res: Response, _next: NextFunction): void {
  let status = error.status ?? 500;
  let code = error.code ?? (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');

  if (typeof error.code === 'string' && error.code.startsWith('P20')) {
    switch (error.code) {
      case 'P2002':
        status = 409;
        code = 'CONFLICT';
        break;
      case 'P2025':
        status = 404;
        code = 'NOT_FOUND';
        break;
      default:
        status = 400;
        code = 'PRISMA_ERROR';
        break;
    }
  }

  sendError(
    res,
    {
      code,
      message: error.message || 'Unexpected error',
      details: error.details,
    },
    status,
  );
}
