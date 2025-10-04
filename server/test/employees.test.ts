import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/employees/:id', () => {
  it('returns 404 for unknown employee id', async () => {
    const response = await request(app).get('/api/employees/not-real');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ ok: false });
  });
});
