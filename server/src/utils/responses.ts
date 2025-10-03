import type { Response } from 'express';

type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type ErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

type ErrorResponse = {
  ok: false;
  error: ErrorPayload;
};

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const payload: SuccessResponse<T> = { ok: true, data };
  res.status(status).json(payload);
}

export function sendError(res: Response, error: ErrorPayload, status = 400): void {
  const payload: ErrorResponse = { ok: false, error };
  res.status(status).json(payload);
}

export { type SuccessResponse, type ErrorResponse, type ErrorPayload };
