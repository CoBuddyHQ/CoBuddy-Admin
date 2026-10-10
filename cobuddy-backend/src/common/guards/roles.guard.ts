import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

// Keep the existing guard name for controller compatibility; authorization has one policy.
@Injectable()
export class RolesGuard extends PermissionsGuard {
  constructor(reflector: Reflector) {
    super(reflector);
  }
}
