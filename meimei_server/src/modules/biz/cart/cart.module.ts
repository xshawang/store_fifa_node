import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Cart } from './entities/cart.entity'
import { ProductSku } from '../product/entities/product-sku.entity'
import { CartService } from './cart.service'
import { CartController, PublicCartController } from './cart.controller'
import { CookieService } from './cart-cookie.service'
import { ProductModule } from '../product/product.module'
import { ProductSkuService } from '../product/product-sku.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, ProductSku]),
    ProductModule,
  ],
  controllers: [CartController, PublicCartController],
  providers: [CartService, CookieService, ProductSkuService],
  exports: [CartService],
})
export class CartModule {}
