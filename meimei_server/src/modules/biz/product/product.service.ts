import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { Product } from './entities/product.entity'
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto/req-product.dto'
import { PaginatedDto } from 'src/common/dto/paginated.dto'
import { ApiException } from 'src/common/exceptions/api.exception'

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * 创建产品
   */
  async create(createProductDto: CreateProductDto): Promise<void> {
    const existing = await this.productRepository.findOne({
      where: { skuId: Number(createProductDto.skuId) },
    })
    if (existing) {
      throw new ApiException('产品ID已存在')
    }
    const product = this.productRepository.create({ ...createProductDto })
    await this.productRepository.save(product)
  }

  /**
   * 分页查询产品列表
   */
  async findAll(queryDto: QueryProductDto): Promise<PaginatedDto<Product>> {
    const { pageNum = 1, pageSize = 10, productId, skuId, productName, brand, category, collection, status } = queryDto

    const where: any = {}
    if (productId) {
      where.productId = productId
    }
    if (skuId) {
      where.skuId = skuId
    }
    if (productName) {
      where.productName = Like(`%${productName}%`)
    }
    if (brand) {
      where.brand = brand
    }
    if (category) {
      where.category = category
    }
    if (collection) {
      where.collection = collection
    }
    if (status !== undefined && status !== null) {
      where.status = status
    }

    const [rows, total] = await this.productRepository.findAndCount({
      where,
      order: { skuId: 'DESC' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    })

    return {
      rows,
      total,
    }
  }

  /**
   * 根据SKU ID查询产品
   */
  async findOne(skuId: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { skuId } })
    if (!product) {
      throw new ApiException('产品不存在')
    }
    return product
  }

  /**
   * 根据productId查询产品
   */
  async findByProductId(productId: string): Promise<Product> {
    return await this.productRepository.findOne({ where: { productId: +productId } })
  }

  /**
   * 更新产品
   */
  async update(skuId: number, updateProductDto: UpdateProductDto): Promise<void> {
    const product = await this.findOne(skuId)
    Object.assign(product, updateProductDto)
    await this.productRepository.save(product)
  }

  /**
   * 删除产品
   */
  async remove(skuIds: string): Promise<void> {
    const skuIdArray = skuIds.split(',').map((id) => Number(id))
    await this.productRepository.delete(skuIdArray)
  }

  /**
   * 批量导入产品
   */
  async batchCreate(products: CreateProductDto[]): Promise<void> {
    const createdProducts = this.productRepository.create(products)
    await this.productRepository.save(createdProducts, { chunk: 100 })
  }

  /**
   * 公开接口：查询上架产品列表（用于前端展示）
   */
  async findPublicList(queryDto: QueryProductDto): Promise<PaginatedDto<Product>> {
    // 强制只查询上架状态的产品
    queryDto.status = 1
    return this.findAll(queryDto)
  }
}
