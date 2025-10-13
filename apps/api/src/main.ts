/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:4201',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  // Serve Angular static files from dist/apps/dashboard/browser when deployed together
  try {
    const clientPath = join(__dirname, '../../dashboard/browser');
    const server = app.getHttpAdapter().getInstance();
    // Static files
    server.use(require('express').static(clientPath));
    // SPA fallback: for non-API routes, return index.html
    server.get('*', (req: any, res: any, next: any) => {
      if (req.path.startsWith(`/${globalPrefix}`)) return next();
      res.sendFile(join(clientPath, 'index.html'));
    });
  } catch (e) {
    Logger.warn(`Static file serving not initialized: ${e?.message ?? e}`);
  }
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
