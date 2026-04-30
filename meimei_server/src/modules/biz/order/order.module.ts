import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './entities/order.entity'
import { OrderItem } from './entities/order-item.entity'
import { Cart } from '../cart/entities/cart.entity'
import { PaymentOrderEntity } from '../payment/entities/payment-order.entity'
import { OrderService } from './order.service'
import { OrderController } from './order.controller'
import { CheckoutTemplateService } from './checkout-template.service'
import { FacebookEventService } from './facebook-event.service'
import { CartModule } from '../cart/cart.module'
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, PaymentOrderEntity]),
    forwardRef(() => CartModule),
    CacheModule.register(),
  ],
  controllers: [OrderController],
  providers: [OrderService, CheckoutTemplateService, FacebookEventService],
  exports: [OrderService, CheckoutTemplateService, FacebookEventService],
})
export class OrderModule {}
