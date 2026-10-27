import { InternalSyncService } from './internal-sync.service';

describe('authoritative booking synchronization', () => {
  it('does not reopen a completed booking after an old start event', async () => {
    const prisma = { booking: { findUnique: jest.fn().mockResolvedValue({ id: 'booking', status: 'COMPLETED' }), update: jest.fn() } };
    await expect(new InternalSyncService(prisma as any).syncBooking({ bookingId: 'booking', status: 'active' })).resolves.toMatchObject({ ignored: true, status: 'COMPLETED' });
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
  it('does not fabricate identities, city or payment state for an incomplete new booking', async () => {
    const prisma = { booking: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() } };
    await expect(new InternalSyncService(prisma as any).syncBooking({ bookingId: 'new', status: 'pending' })).rejects.toThrow('mapping is required');
    expect(prisma.booking.upsert).not.toHaveBeenCalled();
  });
  it('rejects unknown source states instead of mapping them to pending', async () => {
    await expect(new InternalSyncService({} as any).syncBooking({ bookingId: 'booking', status: 'unknown' })).rejects.toThrow('Unsupported source booking status');
  });
});
