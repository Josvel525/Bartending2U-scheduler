import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendSuccess } from '../utils/responses.js';
import { combineDateAndTime, parseDateOnly } from '../utils/dates.js';

const eventRouter = Router();

const eventStatusEnum = z.enum(['draft', 'scheduled', 'completed', 'canceled']);

const optionalString = z
  .union([z.string().trim().min(1), z.literal('')])
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const optionalTime = z
  .union([z.string().trim().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/), z.literal('')])
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const eventBodySchema = z.object({
  title: z.string().trim().min(1),
  date: z.string().trim().min(1),
  startTime: optionalTime,
  endTime: optionalTime,
  location: optionalString,
  clientName: optionalString,
  clientPhone: optionalString,
  notes: optionalString,
  status: eventStatusEnum.optional(),
  assignments: z
    .array(
      z.object({
        employeeId: z.string().uuid(),
        role: optionalString,
      })
    )
    .optional(),
});

const eventUpdateSchema = eventBodySchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

const listQuerySchema = z.object({
  status: eventStatusEnum.optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
});

type PrismaEvent = Awaited<ReturnType<typeof prisma.event.findFirst>>;
type AssignmentWithEmployee = {
  id: string;
  employeeId: string;
  role: string | null;
  assignedAt: Date;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string | null;
    status: string;
  } | null;
};

type PrismaEventWithAssignments = NonNullable<PrismaEvent> & {
  assignments?: AssignmentWithEmployee[];
};

function mapEventResponse(event: PrismaEvent): unknown {
  if (!event) {
    return null;
  }
  const withAssignments = event as PrismaEventWithAssignments;
  const assignments: AssignmentWithEmployee[] = withAssignments.assignments ?? [];
  return {
    id: event.id,
    title: event.title,
    date: event.date.toISOString(),
    startTime: event.startTime ? event.startTime.toISOString() : null,
    endTime: event.endTime ? event.endTime.toISOString() : null,
    location: event.location,
    clientName: event.clientName,
    clientPhone: event.clientPhone,
    notes: event.notes,
    status: event.status,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      employeeId: assignment.employeeId,
      role: assignment.role,
      assignedAt: assignment.assignedAt.toISOString(),
      employee: assignment.employee
        ? {
            id: assignment.employee.id,
            firstName: assignment.employee.firstName,
            lastName: assignment.employee.lastName,
            email: assignment.employee.email,
            phone: assignment.employee.phone,
            role: assignment.employee.role,
            status: assignment.employee.status,
          }
        : undefined,
    })),
  };
}

eventRouter.get('/', async (req, res, next) => {
  try {
    const parsed = listQuerySchema.parse({
      status: Array.isArray(req.query.status) ? req.query.status[0] : req.query.status,
      dateFrom: Array.isArray(req.query.dateFrom) ? req.query.dateFrom[0] : req.query.dateFrom,
      dateTo: Array.isArray(req.query.dateTo) ? req.query.dateTo[0] : req.query.dateTo,
    });

    const filters: Record<string, unknown> = {};

    if (parsed.status) {
      filters.status = parsed.status;
    }

    if (parsed.dateFrom) {
      const date = parseDateOnly(parsed.dateFrom);
      filters.date = { ...(filters.date as Record<string, Date> | undefined), gte: date };
    }

    if (parsed.dateTo) {
      const date = parseDateOnly(parsed.dateTo);
      filters.date = { ...(filters.date as Record<string, Date> | undefined), lte: date };
    }

    const events = await prisma.event.findMany({
      where: filters,
      include: { assignments: { include: { employee: true } } },
      orderBy: [{ date: 'asc' }, { title: 'asc' }],
    });

    sendSuccess(res, events.map(mapEventResponse));
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

eventRouter.post('/', async (req, res, next) => {
  try {
    const payload = eventBodySchema.parse(req.body);
    const date = parseDateOnly(payload.date);
    const startTime = combineDateAndTime(date, payload.startTime);
    const endTime = combineDateAndTime(date, payload.endTime);

    const assignments = payload.assignments
      ? Array.from(new Map(payload.assignments.map((assignment) => [assignment.employeeId, assignment])).values())
      : undefined;

    if (assignments?.length) {
      const employees = await prisma.employee.findMany({
        where: { id: { in: assignments.map((assignment) => assignment.employeeId) } },
        select: { id: true },
      });

      if (employees.length !== assignments.length) {
        const errorInvalid = new Error('One or more employees were not found');
        (errorInvalid as { status?: number; code?: string }).status = 400;
        (errorInvalid as { code?: string }).code = 'INVALID_EMPLOYEE';
        throw errorInvalid;
      }
    }

    const baseData = {
      title: payload.title,
      date,
      location: payload.location,
      clientName: payload.clientName,
      clientPhone: payload.clientPhone,
      notes: payload.notes,
      status: payload.status ?? 'draft',
    } satisfies Record<string, unknown>;

    const event = await prisma.event.create({
      data: {
        ...baseData,
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        assignments: assignments
          ? {
              create: assignments.map((assignment) => ({
                employeeId: assignment.employeeId,
                role: assignment.role,
              })),
            }
          : undefined,
      },
      include: { assignments: { include: { employee: true } } },
    });

    sendSuccess(res, mapEventResponse(event), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

eventRouter.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const payload = eventUpdateSchema.parse(req.body);

    const data: Record<string, unknown> = {};
    let cachedDate: Date | null = null;
    const ensureExistingDate = async () => {
      if (!cachedDate) {
        const existing = await prisma.event.findUnique({ where: { id }, select: { date: true } });
        if (!existing) {
          const errorNotFound = new Error('Event not found');
          (errorNotFound as { status?: number; code?: string }).status = 404;
          (errorNotFound as { code?: string }).code = 'NOT_FOUND';
          throw errorNotFound;
        }
        cachedDate = existing.date;
      }
      return cachedDate;
    };

    if (payload.title !== undefined) data.title = payload.title;
    if (payload.date !== undefined) {
      const date = parseDateOnly(payload.date);
      data.date = date;
      if (payload.startTime) {
        const computedStart = combineDateAndTime(date, payload.startTime);
        if (computedStart) {
          data.startTime = computedStart;
        }
      }
      if (payload.endTime) {
        const computedEnd = combineDateAndTime(date, payload.endTime);
        if (computedEnd) {
          data.endTime = computedEnd;
        }
      }
    } else {
      if (payload.startTime !== undefined) {
        const date = await ensureExistingDate();
        const computedStart = combineDateAndTime(date, payload.startTime ?? undefined);
        if (computedStart) {
          data.startTime = computedStart;
        }
      }
      if (payload.endTime !== undefined) {
        const date = await ensureExistingDate();
        const computedEnd = combineDateAndTime(date, payload.endTime ?? undefined);
        if (computedEnd) {
          data.endTime = computedEnd;
        }
      }
    }
    if (payload.location !== undefined) data.location = payload.location;
    if (payload.clientName !== undefined) data.clientName = payload.clientName;
    if (payload.clientPhone !== undefined) data.clientPhone = payload.clientPhone;
    if (payload.notes !== undefined) data.notes = payload.notes;
    if (payload.status !== undefined) data.status = payload.status;

    const event = await prisma.event.update({
      where: { id },
      data,
      include: { assignments: { include: { employee: true } } },
    });

    if (payload.assignments) {
      const uniqueAssignments = Array.from(
        new Map(payload.assignments.map((assignment) => [assignment.employeeId, assignment])).values(),
      );
      const operations = [prisma.assignment.deleteMany({ where: { eventId: id } })];
      if (uniqueAssignments.length) {
        const employees = await prisma.employee.findMany({
          where: { id: { in: uniqueAssignments.map((assignment) => assignment.employeeId) } },
          select: { id: true },
        });

        if (employees.length !== uniqueAssignments.length) {
          const errorInvalid = new Error('One or more employees were not found');
          (errorInvalid as { status?: number; code?: string }).status = 400;
          (errorInvalid as { code?: string }).code = 'INVALID_EMPLOYEE';
          throw errorInvalid;
        }

        operations.push(
          prisma.assignment.createMany({
            data: uniqueAssignments.map((assignment) => ({
              eventId: id,
              employeeId: assignment.employeeId,
              role: assignment.role,
            })),
            skipDuplicates: true,
          }),
        );
      }
      await prisma.$transaction(operations);
    }

    const updated = await prisma.event.findUnique({
      where: { id },
      include: { assignments: { include: { employee: true } } },
    });

    sendSuccess(res, mapEventResponse(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

eventRouter.post('/:id/assign', async (req, res, next) => {
  const { id } = req.params;
  const bodySchema = z.object({
    employeeId: z.string().uuid(),
    role: z.string().trim().optional(),
  });

  try {
    const payload = bodySchema.parse(req.body);
    const assignment = await prisma.assignment.create({
      data: {
        eventId: id,
        employeeId: payload.employeeId,
        role: payload.role,
      },
      include: { employee: true, event: false },
    });

    sendSuccess(res, assignment, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

eventRouter.delete('/:eventId/assign/:assignmentId', async (req, res, next) => {
  const { assignmentId } = req.params;

  try {
    await prisma.assignment.delete({ where: { id: assignmentId } });
    sendSuccess(res, { id: assignmentId });
  } catch (error) {
    next(error);
  }
});

export { eventRouter };
