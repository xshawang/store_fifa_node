import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './entities/order.entity'
import { OrderItem } from './entities/order-item.entity'
import { Cart } from '../cart/entities/cart.entity'
import { OrderService } from './order.service'
import { OrderController } from './order.controller'
import { CartModule } from '../cart/cart.module'
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart]),
    forwardRef(() => CartModule),
    CacheModule.register(),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
