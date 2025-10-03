import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendSuccess } from '../utils/responses.js';

const employeeRouter = Router();

const employeeInputSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(32).optional().or(z.literal('').transform(() => undefined)),
  role: z.string().trim().min(1).optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['active', 'inactive']).optional(),
});

const employeeUpdateSchema = employeeInputSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

employeeRouter.get('/', async (_req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    sendSuccess(res, employees);
  } catch (error) {
    next(error);
  }
});

employeeRouter.post('/', async (req, res, next) => {
  try {
    const result = employeeInputSchema.parse(req.body);
    const employee = await prisma.employee.create({ data: result });
    sendSuccess(res, employee, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.cause = 'VALIDATION_ERROR';
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

employeeRouter.put('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = employeeUpdateSchema.parse(req.body);
    const employee = await prisma.employee.update({ where: { id }, data: result });
    sendSuccess(res, employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.cause = 'VALIDATION_ERROR';
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

export { employeeRouter };
