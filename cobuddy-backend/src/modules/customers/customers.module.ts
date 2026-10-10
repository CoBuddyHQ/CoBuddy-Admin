import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { BookingHistoryService } from './services/booking-history.service';
import { TransactionHistoryService } from './services/transaction-history.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, BookingHistoryService, TransactionHistoryService],
  exports: [CustomersService],
})
export class CustomersModule {}
