import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_META = 'audit_log_meta';

export interface AuditMeta {
  action: string;
  module: string;
  captureDiff?: boolean;
  resourceIdParam?: string;
  resourceType?: string;
}

export const AuditLog = (meta: AuditMeta) => SetMetadata(AUDIT_LOG_META, meta);
