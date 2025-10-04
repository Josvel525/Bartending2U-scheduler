import type { Request, Response } from 'express';
import { sendError } from '../utils/responses.js';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, { code: 'NOT_FOUND', message: 'Resource not found' }, 404);
}
