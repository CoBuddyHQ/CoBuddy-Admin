import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OperationsApiService } from './operations-api.service';
import { MatchmakingConfigDto } from './dto/matchmaking-config.dto';

describe('Matchmaking configuration', () => {
  const config = {
    maxSearchRadiusKm: 12,
    priorityAlgorithm: 'NEW_COMPANION_BOOST' as const,
    allowCrossCityBooking: true,
    minRatingThreshold: 0,
  };

  it('persists all settings and reads them through a new service instance', async () => {
    let stored: any = null;
    const prisma = {
      appConfig: {
        findUnique: jest.fn(async () => stored),
        upsert: jest.fn(async ({ create, update }: any) => {
          stored = stored ? { ...stored, ...update } : create;
          return stored;
        }),
      },
    };
    const first = new OperationsApiService(prisma as any);
    expect((await first.getMatchmakingConfig()).data).toEqual({
      maxSearchRadiusKm: 25,
      priorityAlgorithm: 'RATING_BASED',
      allowCrossCityBooking: false,
      minRatingThreshold: 3.5,
    });
    await first.updateMatchmakingConfig(config);
    expect((await new OperationsApiService(prisma as any).getMatchmakingConfig()).data).toEqual(
      config,
    );
    expect(prisma.appConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { configKey: 'operations.matchmaking' } }),
    );
  });

  it('allows zero rating thresholds and every priority supported by the frontend', async () => {
    for (const priorityAlgorithm of ['RATING_BASED', 'DISTANCE_BASED', 'NEW_COMPANION_BOOST']) {
      expect(
        await validate(plainToInstance(MatchmakingConfigDto, { ...config, priorityAlgorithm })),
      ).toEqual([]);
    }
  });

  it.each([
    { maxSearchRadiusKm: -1 },
    { maxSearchRadiusKm: 501 },
    { maxSearchRadiusKm: NaN },
    { priorityAlgorithm: 'BALANCED' },
    { allowCrossCityBooking: 'false' },
    { minRatingThreshold: 5.1 },
    { minRatingThreshold: -1 },
  ])('rejects invalid input %j', async (invalid) => {
    expect(
      (await validate(plainToInstance(MatchmakingConfigDto, { ...config, ...invalid }))).length,
    ).toBeGreaterThan(0);
  });

  it('requires every field on a full configuration replacement', async () => {
    expect(
      (await validate(new MatchmakingConfigDto())).map((error) => error.property).sort(),
    ).toEqual(Object.keys(config).sort());
  });
});
