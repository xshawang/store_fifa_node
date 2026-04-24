import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Excel } from 'src/modules/common/excel/excel.decorator'
import { ExcelTypeEnum } from 'src/modules/common/excel/excel.enum'

@Entity('biz_product', { comment: '产品信息表' })
@Index(['brand'])
@Index(['category'])
@Index(['collection'])
export class Product extends BaseEntity {

  @ApiProperty({ description: 'SKU ID（主键）' })
  @PrimaryGeneratedColumn({ name: 'sku_id', comment: 'SKU ID（主键）'})
  skuId: number


  @ApiProperty({ description: '产品ID（原始）' })
  @Column({ name: 'product_id', comment: '产品ID'})
  @Excel({ name: '产品ID', sort: 1 })
  productId: number

  @ApiProperty({ description: '产品名称' })
  @Column({ name: 'product_name', comment: '产品名称', length: 500 })
  @IsOptional()
  @IsString()
  @Excel({ name: '产品名称', sort: 2 })
  productName: string

  @ApiProperty({ description: '产品句柄' })
  @Column({ name: 'handle', comment: '产品句柄', length: 200, nullable: true })
  handle: string

  @ApiProperty({ description: '产品URL' })
  @Column({ name: 'product_url', comment: '产品URL', length: 500, nullable: true })
  productUrl: string

  @ApiProperty({ description: '价格' })
  @Column({ name: 'price', comment: '价格', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Excel({ name: '价格', sort: 3 })
  price: number

  @ApiProperty({ description: '原价' })
  @Column({ name: 'compare_at_price', comment: '原价', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  compareAtPrice: number

  @ApiProperty({ description: '货币' })
  @Column({ name: 'currency', comment: '货币', length: 10, default: 'USD' })
  currency: string

  @ApiProperty({ description: '品牌' })
  @Column({ name: 'brand', comment: '品牌', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Excel({ name: '品牌', sort: 4 })
  brand: string

  @ApiProperty({ description: '类别' })
  @Column({ name: 'category', comment: '类别', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Excel({ name: '类别', sort: 5 })
  category: string

  @ApiProperty({ description: '产品类型' })
  @Column({ name: 'product_type', comment: '产品类型', length: 100, nullable: true })
  productType: string

  @ApiProperty({ description: '性别' })
  @Column({ name: 'gender', comment: '性别', length: 50, nullable: true })
  gender: string

  @ApiProperty({ description: '国家' })
  @Column({ name: 'nation', comment: '国家', length: 100, nullable: true })
  nation: string

  @ApiProperty({ description: '赛事' })
  @Column({ name: 'tournament', comment: '赛事', length: 100, nullable: true })
  tournament: string

  @ApiProperty({ description: '颜色' })
  @Column({ name: 'colour', comment: '颜色', length: 100, nullable: true })
  colour: string

  @ApiProperty({ description: '尺码' })
  @Column({ name: 'size', comment: '尺码', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Excel({ name: '尺码', sort: 6 })
  size: string

  @ApiProperty({ description: 'SKU' })
  @Column({ name: 'sku', comment: 'SKU', length: 100, nullable: true })
  sku: string



  @ApiProperty({ description: '变体ID' })
  @Column({ name: 'variant_id', comment: '变体ID', length: 50, nullable: true })
  variantId: string

  @ApiProperty({ description: '条形码' })
  @Column({ name: 'barcode', comment: '条形码', length: 50, nullable: true })
  barcode: string

  @ApiProperty({ description: '图片URL' })
  @Column({ name: 'image_url', comment: '图片URL', length: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @Excel({ name: '图片URL', sort: 7 })
  imageUrl: string

  @ApiProperty({ description: '描述' })
  @Column({ name: 'description', comment: '描述', type: 'text', nullable: true })
  description: string

  @ApiProperty({ description: '库存状态' })
  @Column({ name: 'availability', comment: '库存状态', length: 50, nullable: true })
  availability: string

  @ApiProperty({ description: '集合' })
  @Column({ name: 'collection', comment: '集合', length: 200, nullable: true })
  @IsOptional()
  @IsString()
  @Excel({ name: '集合', sort: 8 })
  collection: string

  @ApiProperty({ description: '状态：0-下架 1-上架' })
  @Column({ name: 'status', comment: '状态：0-下架 1-上架', default: 1 })
  status: number
}
