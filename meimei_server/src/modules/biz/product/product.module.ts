import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { ProductService } from './product.service'
import { ProductController, PublicGoodsController } from './product.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController, PublicGoodsController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
