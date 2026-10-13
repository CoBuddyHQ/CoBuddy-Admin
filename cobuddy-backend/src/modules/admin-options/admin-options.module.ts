import { Module } from '@nestjs/common';
import { WorkflowOptionsController } from './options.controller';

@Module({ controllers: [WorkflowOptionsController] })
export class AdminOptionsModule {}
