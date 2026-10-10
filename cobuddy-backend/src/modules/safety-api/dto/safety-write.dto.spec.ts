import { BadRequestException, ValidationPipe } from '@nestjs/common';
import {
  AdvanceEmergencyDto,
  UpdateAgeEscalationDto,
  UpdateGeofenceDto,
  UpdateIncidentDto,
  UpdateSosDto,
} from './safety-write.dto';

describe('Safety request validation', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });
  it.each([
    UpdateSosDto,
    UpdateIncidentDto,
    UpdateGeofenceDto,
    UpdateAgeEscalationDto,
    AdvanceEmergencyDto,
  ])('rejects unknown status and extra fields for %p', async (metatype) => {
    await expect(
      pipe.transform({ status: 'INVALID', unexpected: true }, { type: 'body', metatype }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it.each([null, 42, true, ' ', 'x'.repeat(2001)])('rejects invalid note %p', async (note) => {
    await expect(
      pipe.transform({ status: 'ACKNOWLEDGED', note }, { type: 'body', metatype: UpdateSosDto }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('accepts acknowledgment without a note but requires emergency action detail', async () => {
    await expect(
      pipe.transform({ status: 'ACKNOWLEDGED' }, { type: 'body', metatype: UpdateSosDto }),
    ).resolves.toBeInstanceOf(UpdateSosDto);
    await expect(
      pipe.transform({ status: 'RESOLVED' }, { type: 'body', metatype: AdvanceEmergencyDto }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
