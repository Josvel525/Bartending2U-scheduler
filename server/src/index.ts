import app from './app.js';
import env from './utils/env.js';
import prisma from './lib/prisma.js';

async function main() {
  try {
    await prisma.$connect();
    const server = app.listen(env.PORT, () => {
      console.log(`API server ready on port ${env.PORT}`);
    });

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`Received ${signal}. Closing server.`);
        server.close(async () => {
          await prisma.$disconnect();
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

main();
