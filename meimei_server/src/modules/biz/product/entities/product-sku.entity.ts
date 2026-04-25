import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'

@Entity('biz_product_sku', { comment: '产品SKU规格表' })
@Index(['productId'])
@Index(['variantId'])
export class ProductSku extends BaseEntity {

  @ApiProperty({ description: 'SKU ID（主键）' })
  @PrimaryGeneratedColumn({ name: 'sku_id', comment: 'SKU ID（主键）' })
  skuId: number

  @ApiProperty({ description: '产品ID' })
  @Column({ name: 'product_id', comment: '产品ID', nullable: true })
  @IsOptional()
  @IsNumber()
  productId: number

  @ApiProperty({ description: '变体ID' })
  @Column({ name: 'variant_id', comment: '变体ID', nullable: true })
  @IsOptional()
  @IsNumber()
  variantId: number

  @ApiProperty({ description: 'SKU编码' })
  @Column({ name: 'sku', comment: 'SKU编码', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  sku: string

  @ApiProperty({ description: '尺码' })
  @Column({ name: 'size', comment: '尺码', length: 10, nullable: true })
  @IsOptional()
  @IsString()
  size: string
}
