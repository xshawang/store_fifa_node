import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Order, OrderItem]),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
