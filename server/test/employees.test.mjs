import assert from 'node:assert/strict';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const appModule = await import(resolve(__dirname, '../dist/app.js'));
const prismaModule = await import(resolve(__dirname, '../dist/lib/prisma.js'));

const app = appModule.default;
const prisma = prismaModule.default || prismaModule.prisma;

async function startServer() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('Unable to determine server address');
  }
  return { server, port: address.port };
}

async function run() {
  await prisma.$connect();
  const { server, port } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/employees/not-real`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.ok, false);
    console.log('PASS  GET /api/employees/:id returns 404 for unknown id');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error('FAIL  GET /api/employees/:id returns 404 for unknown id');
  console.error(error);
  process.exitCode = 1;
});
