import { ServiceUnavailableException } from '@nestjs/common';
import { ModerationService } from './moderation.service';

describe('Unconfigured flagged chat integration', () => {
  const service = new ModerationService({} as any);
  it('never presents fabricated chat records or transcripts as real evidence', async () => {
    await expect(service.listFlaggedChats({ page: 1, pageSize: 20 } as any)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(service.getFlaggedChat('chat-1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
  it('does not report a decision as saved when no storage integration exists', async () => {
    await expect(
      service.decideFlaggedChat('chat-1', { action: 'DISMISS' } as any, {} as any),
    ).rejects.toThrow('No decision was saved');
  });
});
