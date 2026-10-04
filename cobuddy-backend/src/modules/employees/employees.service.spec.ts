import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { StaffRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateRolesDto } from './dto/update-roles.dto';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('synthetic-hash') }));

describe('Employee administration', () => {
  const hr = { sub: 'hr-1', roles: [StaffRole.HR_ADMIN] } as any;
  const admin = { sub: 'admin-1', roles: [StaffRole.SUPER_ADMIN] } as any;
  let db: any;
  let service: EmployeesService;

  beforeEach(() => {
    db = {
      staffEmployee: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'target',
          roles: [StaffRole.SUPPORT_AGENT],
          email: 'target@example.test',
        }),
        update: jest.fn().mockResolvedValue({ id: 'target' }),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn(async ({ data }: any) => data),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'target' }),
      },
      staffSession: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    db.$transaction = jest.fn((work) => work(db));
    service = new EmployeesService(db, { send: jest.fn().mockResolvedValue('SENT') } as any);
  });

  it('prevents HR from promoting an employee to super admin', async () => {
    await expect(
      service.updateRoles('target', { roles: [StaffRole.SUPER_ADMIN] }, hr),
    ).rejects.toThrow(ForbiddenException);
    expect(db.staffEmployee.update).not.toHaveBeenCalled();
  });

  it('prevents HR from taking over a super admin through profile email changes', async () => {
    db.staffEmployee.findUnique.mockResolvedValue({
      roles: [StaffRole.SUPER_ADMIN],
      email: 'target@example.test',
    });
    await expect(service.update('target', { email: 'changed@example.test' }, hr)).rejects.toThrow(
      ForbiddenException,
    );
    expect(db.staffEmployee.update).not.toHaveBeenCalled();
  });

  it('selects only public employee fields in update responses', async () => {
    await service.update('target', { name: 'Updated name' }, admin);
    const select = db.staffEmployee.update.mock.calls[0][0].select;
    expect(select).toBeDefined();
    expect(select.passwordHash).toBeUndefined();
    expect(select.twoFactorSecret).toBeUndefined();
    expect(select.inviteToken).toBeUndefined();
    expect(select.name).toBe(true);
  });

  it('rejects empty role arrays in validation and the service', async () => {
    expect((await validate(plainToInstance(UpdateRolesDto, { roles: [] }))).length).toBeGreaterThan(
      0,
    );
    await expect(service.updateRoles('target', { roles: [] }, admin)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('requires a city assignment for city operations managers', async () => {
    await expect(
      service.updateRoles(
        'target',
        { roles: [StaffRole.CITY_OPS_MANAGER], cityScopeIds: [] },
        admin,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('prevents self suspension and self demotion', async () => {
    db.staffEmployee.findUnique.mockResolvedValue({ roles: [StaffRole.SUPER_ADMIN] });
    await expect(service.updateStatus(admin.sub, { status: 'SUSPENDED' }, admin)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.updateRoles(admin.sub, { roles: [StaffRole.MODERATOR] }, admin),
    ).rejects.toThrow(BadRequestException);
    expect(db.staffEmployee.update).not.toHaveBeenCalled();
  });

  it('protects the last active accepted super admin under serializable isolation', async () => {
    db.staffEmployee.findUnique.mockResolvedValue({ roles: [StaffRole.SUPER_ADMIN] });
    db.staffEmployee.count.mockResolvedValue(0);
    await expect(service.updateStatus('target', { status: 'SUSPENDED' }, admin)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.updateRoles('target', { roles: [StaffRole.MODERATOR] }, admin),
    ).rejects.toThrow(BadRequestException);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(db.staffEmployee.count).toHaveBeenCalledWith({
      where: {
        id: { not: 'target' },
        roles: { has: 'SUPER_ADMIN' },
        status: 'ACTIVE',
        inviteStatus: 'ACCEPTED',
      },
    });
    expect(db.staffEmployee.update).not.toHaveBeenCalled();
  });

  it('revokes sessions inside the same suspension transaction', async () => {
    await service.updateStatus('target', { status: 'SUSPENDED' }, admin);
    expect(db.staffSession.deleteMany).toHaveBeenCalledWith({ where: { employeeId: 'target' } });
  });

  it('generates independent employee IDs without consulting the latest row', async () => {
    db.staffEmployee.findUnique.mockResolvedValue(null);
    const dto = {
      name: 'Test',
      email: 'test@example.test',
      designation: 'Support',
      department: 'ENGINEERING',
      roles: [StaffRole.SUPPORT_AGENT],
    } as any;
    const [a, b] = await Promise.all([
      service.create({ ...dto }, admin),
      service.create({ ...dto }, admin),
    ]);
    expect(a.data.employeeId).toMatch(/^EMP-[0-9a-f-]{36}$/);
    expect(a.data.employeeId).not.toBe(b.data.employeeId);
  });

  it('claims an invitation once across concurrent requests', async () => {
    db.staffEmployee.findUnique.mockResolvedValue({
      id: 'target',
      inviteStatus: 'PENDING',
      inviteExpiresAt: new Date(Date.now() + 60000),
    });
    let claimed = false;
    db.staffEmployee.updateMany.mockImplementation(async () => {
      if (claimed) return { count: 0 };
      claimed = true;
      return { count: 1 };
    });
    const dto = { token: 'fixture-token', password: 'fixture-password' };
    const results = await Promise.allSettled([
      service.acceptInvite(dto, 'target'),
      service.acceptInvite(dto, 'target'),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({
      reason: expect.any(ConflictException),
    });
    expect(db.staffEmployee.updateMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({
        id: 'target',
        inviteToken: dto.token,
        inviteStatus: 'PENDING',
        status: 'ACTIVE',
        inviteExpiresAt: { gt: expect.any(Date) },
      }),
    );
  });

  it('rejects a revoked token and mismatched URL employee', async () => {
    db.staffEmployee.findUnique.mockResolvedValue({
      id: 'target',
      inviteStatus: 'PENDING',
      inviteExpiresAt: new Date(Date.now() + 60000),
    });
    const dto = { token: 'fixture-token', password: 'fixture-password' };
    await expect(service.acceptInvite(dto, 'other')).rejects.toThrow(BadRequestException);
    db.staffEmployee.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.acceptInvite(dto, 'target')).rejects.toThrow(ConflictException);
  });
});
