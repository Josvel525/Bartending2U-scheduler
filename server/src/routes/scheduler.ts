import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendSuccess } from '../utils/responses.js';
import { combineDateAndTime, parseDateOnly } from '../utils/dates.js';

const schedulerRouter = Router();

const eventStatusEnum = z.enum(['draft', 'scheduled', 'completed', 'canceled']);

const optionalString = z
  .union([z.string().trim().min(1), z.literal('')])
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const optionalTime = z
  .union([z.string().trim().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/), z.literal('')])
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const schedulerPayloadSchema = z.object({
  formKey: z.string().min(3),
  payload: z.object({
    event: z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1),
      date: z.string().min(1),
      startTime: optionalTime,
      endTime: optionalTime,
      location: optionalString,
      clientName: optionalString,
      clientPhone: optionalString,
      notes: optionalString,
      status: eventStatusEnum.optional(),
    }),
    assignments: z
      .array(
        z.object({
          employeeId: z.string().uuid(),
          role: optionalString,
        }),
      )
      .optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

const saveDraftSchema = schedulerPayloadSchema.extend({
  formVersion: z.string().optional(),
  eventId: z.string().uuid().optional(),
  createdBy: z.string().optional(),
});

const saveQuerySchema = z.object({
  formKey: z.string().min(3),
});

schedulerRouter.post('/save', async (req, res, next) => {
  try {
    const payload = saveDraftSchema.parse(req.body);

    const draft = await prisma.savedItem.upsert({
      where: {
        formKey_kind: {
          formKey: payload.formKey,
          kind: 'scheduler_draft',
        },
      },
      create: {
        formKey: payload.formKey,
        kind: 'scheduler_draft',
        payload: payload.payload,
        formVersion: payload.formVersion,
        createdBy: payload.createdBy,
        eventId: payload.eventId,
      },
      update: {
        payload: payload.payload,
        formVersion: payload.formVersion,
        eventId: payload.eventId,
        createdBy: payload.createdBy ?? undefined,
      },
    });

    sendSuccess(res, draft, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

schedulerRouter.get('/saved', async (req, res, next) => {
  try {
    const { formKey } = saveQuerySchema.parse({
      formKey: Array.isArray(req.query.formKey) ? req.query.formKey[0] : req.query.formKey,
    });

    const draft = await prisma.savedItem.findUnique({
      where: {
        formKey_kind: {
          formKey,
          kind: 'scheduler_draft',
        },
      },
    });

    if (draft && typeof draft.payload === 'object' && draft.payload !== null && 'finalized' in draft.payload) {
      sendSuccess(res, null);
      return;
    }

    sendSuccess(res, draft);
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

schedulerRouter.delete('/saved/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.savedItem.delete({ where: { id } });
    sendSuccess(res, { id });
  } catch (error) {
    next(error);
  }
});

schedulerRouter.post('/submit', async (req, res, next) => {
  try {
    const { formKey, payload } = schedulerPayloadSchema.parse(req.body);

    const eventData = payload.event;
    const date = parseDateOnly(eventData.date);
    const startTime = combineDateAndTime(date, eventData.startTime);
    const endTime = combineDateAndTime(date, eventData.endTime);

    const result = await prisma.$transaction(async (tx) => {
      const draft = await tx.savedItem.findUnique({
        where: {
          formKey_kind: {
            formKey,
            kind: 'scheduler_draft',
          },
        },
      });

      const event = eventData.id
        ? await tx.event.update({
            where: { id: eventData.id },
            data: {
              title: eventData.title,
              date,
              startTime,
              endTime,
              location: eventData.location,
              clientName: eventData.clientName,
              clientPhone: eventData.clientPhone,
              notes: eventData.notes,
              status: 'scheduled',
            },
            include: { assignments: true },
          })
        : await tx.event.create({
            data: {
              title: eventData.title,
              date,
              startTime,
              endTime,
              location: eventData.location,
              clientName: eventData.clientName,
              clientPhone: eventData.clientPhone,
              notes: eventData.notes,
              status: 'scheduled',
            },
            include: { assignments: true },
          });

      if (payload.assignments) {
        const uniqueAssignments = Array.from(
          new Map(
            payload.assignments.map((assignment) => [assignment.employeeId, assignment]),
          ).values(),
        );

        await tx.assignment.deleteMany({ where: { eventId: event.id } });
        if (uniqueAssignments.length) {
          const employees = await tx.employee.findMany({
            where: { id: { in: uniqueAssignments.map((assignment) => assignment.employeeId) } },
            select: { id: true },
          });

          if (employees.length !== uniqueAssignments.length) {
            const error = new Error('One or more employees were not found');
            (error as { status?: number; code?: string }).status = 400;
            (error as { code?: string }).code = 'INVALID_EMPLOYEE';
            throw error;
          }

          await tx.assignment.createMany({
            data: uniqueAssignments.map((assignment) => ({
              eventId: event.id,
              employeeId: assignment.employeeId,
              role: assignment.role,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (draft) {
        await tx.savedItem.update({
          where: { id: draft.id },
          data: {
            eventId: event.id,
            payload: { ...payload, finalized: true },
          },
        });
      }

      return event;
    });

    const event = await prisma.event.findUnique({
      where: { id: result.id },
      include: { assignments: { include: { employee: true } } },
    });

    sendSuccess(res, event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      (error as unknown as { status?: number; code?: string }).status = 400;
      (error as unknown as { status?: number; code?: string }).code = 'VALIDATION_ERROR';
      (error as unknown as { details?: unknown }).details = error.flatten();
    }
    next(error);
  }
});

export { schedulerRouter };
