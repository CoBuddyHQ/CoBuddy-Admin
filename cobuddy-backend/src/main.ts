import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { configureHttpServer } from './config/http.config';

export async function createApplication() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  const configService = app.get(ConfigService);
  const environment = configService.get<string>('NODE_ENV');
  app.use(helmet());
  configureHttpServer(
    app.getHttpAdapter().getInstance(),
    configService.get<string[]>('TRUST_PROXY') ?? [],
  );
  app.use(cookieParser());
  app.enableCors({
    origin: configService
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Correlation-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Correlation-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/' || req.path === '/favicon.ico') {
      return res.status(200).json({ status: 'CoBuddy API running', health: '/api/health' });
    }
    next();
  });
  app.setGlobalPrefix('api');
  // The admin API inventory is intentionally unavailable on production instances.
  if (environment !== 'production' && environment !== 'staging') {
    const config = new DocumentBuilder()
      .setTitle('CoBuddy Admin API')
      .setDescription('Admin API for CoBuddy')
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addSecurityRequirements('access-token')
      .build();
    SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, config), {
      customSiteTitle: 'CoBuddy Admin API',
      swaggerOptions: { persistAuthorization: false },
    });
  }
  app.enableShutdownHooks();
  return app;
}

async function bootstrap() {
  const app = await createApplication();
  const port = app.get(ConfigService).get<number>('PORT') || 4000;
  await app.listen(port);
  console.log(`CoBuddy backend listening on port ${port}; health: /api/health`);
}

if (require.main === module) {
  void bootstrap().catch((error: unknown) => {
    console.error('Backend startup failed:', error);
    process.exitCode = 1;
  });
}
