import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { OrderModule } from '../order/order.module';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Order, OrderItem]),
    OrderModule,
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
