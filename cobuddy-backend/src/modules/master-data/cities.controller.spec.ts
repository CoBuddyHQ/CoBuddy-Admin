import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { PrismaService } from '@/prisma/prisma.module';
import { CitiesController } from './cities.controller';
import { MasterDataService } from './master-data.service';

describe('Cities query validation', () => {
  let app: INestApplication;
  const city = { id: 'city-1', name: { en: 'Test city' }, areas: [] };
  const service = { findAllPaginated: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CitiesController],
      providers: [
        { provide: MasterDataService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  beforeEach(() => {
    service.findAllPaginated.mockReset();
    service.findAllPaginated.mockResolvedValue({
      data: [city],
      meta: {
        page: 1,
        pageSize: 200,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('accepts the frontend cities request and includes areas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/master-data/cities?page=1&pageSize=200&include=areas')
      .expect(200);

    expect(service.findAllPaginated).toHaveBeenCalledWith(
      'city',
      expect.objectContaining({ page: 1, pageSize: 200 }),
      { areas: true },
    );
    expect(response.body).toMatchObject({
      success: true,
      data: [city],
      meta: { page: 1, pageSize: 200 },
    });
  });

  it('keeps pagination defaults and does not include areas unless requested', async () => {
    await request(app.getHttpServer()).get('/api/master-data/cities').expect(200);
    expect(service.findAllPaginated).toHaveBeenCalledWith(
      'city',
      expect.objectContaining({ page: 1, pageSize: 20 }),
      undefined,
    );
  });

  it.each([
    'include=unknown',
    'include=areas&unexpected=true',
    'include=areas&pageSize=201',
    'include=areas&page=0',
    'include=areas&pageSize=invalid',
  ])('rejects invalid queries: %s', async (query) => {
    await request(app.getHttpServer())
      .get('/api/master-data/cities?' + query)
      .expect(400);
    expect(service.findAllPaginated).not.toHaveBeenCalled();
  });
});
