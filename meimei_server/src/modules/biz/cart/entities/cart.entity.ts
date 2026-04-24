import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'

@Entity('biz_cart', { comment: '购物车表' })
@Index(['userId'])
@Index(['productId'])
@Index(['variantId'])
export class Cart extends BaseEntity {

  @ApiProperty({ description: '购物车ID（主键）' })
  @PrimaryGeneratedColumn({ name: 'cart_id', comment: '购物车ID（主键）'})
  cartId: number

  @ApiProperty({ description: '购物车标识（从cookie中提取）' })
  @Column({ name: 'token', comment: '购物车标识', length: 500 })
  @IsString()
  token: string
  
  @ApiProperty({ description: '用户标识（从cookie中提取）' })
  @Column({ name: 'user_id', comment: '用户标识', length: 500 })
  @IsString()
  userId: string

  @ApiProperty({ description: '产品ID' })
  @Column({ name: 'product_id', comment: '产品ID'})
  @IsNumber()
  productId: number

  @ApiProperty({ description: 'SKU ID' })
  @Column({ name: 'sku_id', comment: 'SKU ID', length: 50, nullable: true })
  @IsOptional()
  skuId: number
  
  @ApiProperty({ description: '变体ID' })
  @Column({ name: 'variant_id', comment: '变体ID', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  variantId: string

  @ApiProperty({ description: '尺码' })
  @Column({ name: 'size', comment: '尺码', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  size: string

  @ApiProperty({ description: '表单类型' })
  @Column({ name: 'form_type', comment: '表单类型', length: 50, default: 'product' })
  @IsOptional()
  @IsString()
  formType: string

  @ApiProperty({ description: '数量' })
  @Column({ name: 'quantity', comment: '数量', default: 1 })
  @IsOptional()
  @IsNumber()
  quantity: number

  @ApiProperty({ description: 'section ID' })
  @Column({ name: 'section_id', comment: 'section ID', length: 200, nullable: true })
  @IsOptional()
  @IsString()
  sectionId: string

  @ApiProperty({ description: 'sections' })
  @Column({ name: 'sections', comment: 'sections', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  sections: string

  @ApiProperty({ description: 'sections URL' })
  @Column({ name: 'sections_url', comment: 'sections URL', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  sectionsUrl: string

  @ApiProperty({ description: '产品名称' })
  @Column({ name: 'product_name', comment: '产品名称', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  productName: string

  @ApiProperty({ description: '产品价格' })
  @Column({ name: 'price', comment: '产品价格', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  price: number

  @ApiProperty({ description: '产品URL' })
  @Column({ name: 'product_url', comment: '产品URL', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  productUrl: string

  @ApiProperty({ description: '状态：0-已删除 1-正常' })
  @Column({ name: 'status', comment: '状态：0-已删除 1-正常', default: 1 })
  status: number
}
