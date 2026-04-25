import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductSku } from './entities/product-sku.entity'
import { ApiException } from 'src/common/exceptions/api.exception'

@Injectable()
export class ProductSkuService {
  constructor(
    @InjectRepository(ProductSku)
    private readonly productSkuRepository: Repository<ProductSku>,
  ) {}

  /**
   * 根据sku_id查询SKU信息
   */
  async findOne(skuId: number): Promise<ProductSku | null> {
    return await this.productSkuRepository.findOne({ where: { skuId } })
  }

  /**
   * 根据product_id查询所有SKU
   */
  async findByProductId(productId: number): Promise<ProductSku[]> {
    return await this.productSkuRepository.find({ where: { productId } })
  }

  /**
   * 创建或更新SKU
   * 如果sku_id不存在则创建，存在则更新size字段（如果为空）
   */
  async createOrUpdate(skuId: number, productId: number, variantId: number, sku: string, size?: string): Promise<ProductSku> {
    // 查询是否已存在
    let productSku = await this.findOne(skuId)

    if (productSku) {
      // 如果存在，检查size是否有值
      if (!productSku.size && size) {
        productSku.size = size
        await this.productSkuRepository.save(productSku)
      }
    } else {
      // 如果不存在，创建新记录
      productSku = this.productSkuRepository.create({
        skuId,
        productId,
        variantId,
        sku,
        size,
      })
      await this.productSkuRepository.save(productSku)
    }

    return productSku
  }

  /**
   * 批量创建SKU
   */
  async createMany(productSkus: Partial<ProductSku>[]): Promise<ProductSku[]> {
    const entities = this.productSkuRepository.create(productSkus)
    return await this.productSkuRepository.save(entities)
  }
}
