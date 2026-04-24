import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Cart } from './entities/cart.entity'
import { CartService } from './cart.service'
import { CartController, PublicCartController } from './cart.controller'
import { CookieService } from './cart-cookie.service'
import { ProductModule } from '../product/product.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart]),
    ProductModule,
  ],
  controllers: [CartController, PublicCartController],
  providers: [CartService, CookieService],
  exports: [CartService],
})
export class CartModule {}
