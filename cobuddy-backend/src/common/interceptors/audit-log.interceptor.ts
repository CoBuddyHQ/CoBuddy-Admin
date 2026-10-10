import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, mergeMap } from 'rxjs';
import { AUDIT_LOG_META, AuditMeta } from '@/common/decorators/audit-log.decorator';
import { PrismaService } from '@/prisma/prisma.module';

// Apply to request bodies AND before/after snapshots. Never persist authentication material.
export function redactAuditValue(value: unknown): any {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(redactAuditValue);
  if (typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      /password|secret|token|authorization|cookie|otp|api.?key|cvv|card.?number/i.test(key)
        ? '[REDACTED]'
        : redactAuditValue(child),
    ]),
  );
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async oldValueLookup(meta: AuditMeta, req: any): Promise<any> {
    if (!meta.captureDiff || !meta.resourceType) return null;
    const id = meta.resourceIdParam
      ? req.params[meta.resourceIdParam]
      : req.params.id || req.body?.id;
    if (!id) return null;
    const map: Record<string, any> = {
      StaffEmployee: this.prisma.staffEmployee,
      Customer: this.prisma.customer,
      Companion: this.prisma.companion,
    };
    const client = map[meta.resourceType];
    if (!client) return null;
    try {
      return redactAuditValue(await client.findUnique({ where: { id } }));
    } catch {
      return null;
    }
  }

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.get<AuditMeta>(AUDIT_LOG_META, ctx.getHandler());
    if (!meta) return next.handle();
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    // Read the before-image before invoking a mutation, then await the audit write.
    return new Observable((subscriber) => {
      let subscription: { unsubscribe(): void } | undefined;
      void this.oldValueLookup(meta, req)
        .then((old) => {
          if (subscriber.closed) return;
          subscription = next
            .handle()
            .pipe(
              mergeMap(async (result) => {
                try {
                  const id =
                    (meta.resourceIdParam ? req.params[meta.resourceIdParam] : req.params.id) ||
                    result?.data?.id ||
                    result?.id ||
                    req.body?.id;
                  const nextValue = result?.data || result;
                  await this.prisma.auditLog.create({
                    data: {
                      adminId: user?.sub || result?.data?.user?.id || 'system',
                      adminName: user?.name || 'system',
                      action: meta.action,
                      moduleAffected: meta.module,
                      ipAddress: req.ip || req.socket?.remoteAddress || null,
                      userAgent: req.headers['user-agent'] || null,
                      resourceType: meta.resourceType || null,
                      resourceId: id || null,
                      details: JSON.stringify(redactAuditValue(req.body))?.slice(0, 5000) || null,
                      ...(meta.captureDiff
                        ? {
                            oldValues: old ?? undefined,
                            newValues:
                              nextValue &&
                              typeof nextValue === 'object' &&
                              !Array.isArray(nextValue)
                                ? redactAuditValue(nextValue)
                                : undefined,
                          }
                        : {}),
                    },
                  });
                } catch {
                  // Do not turn a committed mutation into a retryable error or log its sensitive payload.
                  this.logger.error('Audit log persistence failed');
                }
                return result;
              }),
            )
            .subscribe(subscriber);
        })
        .catch((error) => subscriber.error(error));
      return () => subscription?.unsubscribe();
    });
  }
}
