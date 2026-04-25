import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { ProductSku } from './entities/product-sku.entity'
import { ProductService } from './product.service'
import { ProductSkuService } from './product-sku.service'
import { ProductController, PublicGoodsController } from './product.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductSku])],
  controllers: [ProductController, PublicGoodsController],
  providers: [ProductService, ProductSkuService],
  exports: [ProductService, ProductSkuService],
})
export class ProductModule {}
