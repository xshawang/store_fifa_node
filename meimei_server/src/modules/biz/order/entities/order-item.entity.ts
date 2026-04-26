import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity('biz_order_item', { comment: '订单明细表' })
@Index(['orderId'])
@Index(['orderNo'])
@Index(['skuId'])
export class OrderItem extends BaseEntity {

  @ApiProperty({ description: '明细ID（主键）' })
  @PrimaryGeneratedColumn({ name: 'item_id', comment: '明细ID（主键）' })
  itemId: number

  @ApiProperty({ description: '订单ID' })
  @Column({ name: 'order_id', comment: '订单ID' })
  orderId: number

  @ApiProperty({ description: '订单编号' })
  @Column({ name: 'order_no', comment: '订单编号', length: 50 })
  orderNo: string

  @ApiProperty({ description: '产品ID' })
  @Column({ name: 'product_id', comment: '产品ID', nullable: true })
  productId: number

  @ApiProperty({ description: 'SKU ID' })
  @Column({ name: 'sku_id', comment: 'SKU ID' })
  skuId: number

  @ApiProperty({ description: '变体ID' })
  @Column({ name: 'variant_id', comment: '变体ID', length: 50, nullable: true })
  variantId: string

  @ApiProperty({ description: '产品名称' })
  @Column({ name: 'product_name', comment: '产品名称', length: 500 })
  productName: string

  @ApiProperty({ description: '变体名称（如：尺码、颜色）' })
  @Column({ name: 'variant_name', comment: '变体名称', length: 500, nullable: true })
  variantName: string

  @ApiProperty({ description: '产品图片URL' })
  @Column({ name: 'product_image', comment: '产品图片URL', length: 500, nullable: true })
  productImage: string

  @ApiProperty({ description: '产品详情页URL' })
  @Column({ name: 'product_url', comment: '产品详情页URL', length: 500, nullable: true })
  productUrl: string

  @ApiProperty({ description: 'SKU编码' })
  @Column({ name: 'sku_code', comment: 'SKU编码', length: 100, nullable: true })
  skuCode: string

  @ApiProperty({ description: '尺码' })
  @Column({ name: 'size', comment: '尺码', length: 100, nullable: true })
  size: string

  @ApiProperty({ description: '颜色' })
  @Column({ name: 'color', comment: '颜色', length: 100, nullable: true })
  color: string

  @ApiProperty({ description: '原价（分）' })
  @Column({ name: 'original_price', comment: '原价（分）', type: 'bigint' })
  originalPrice: number

  @ApiProperty({ description: '售价（分）' })
  @Column({ name: 'sale_price', comment: '售价（分）', type: 'bigint' })
  salePrice: number

  @ApiProperty({ description: '购买数量' })
  @Column({ name: 'quantity', comment: '购买数量', default: 1 })
  quantity: number

  @ApiProperty({ description: '小计金额（分）' })
  @Column({ name: 'subtotal_amount', comment: '小计金额（分）', type: 'bigint' })
  subtotalAmount: number

  @ApiProperty({ description: '折扣金额（分）' })
  @Column({ name: 'discount_amount', comment: '折扣金额（分）', type: 'bigint', default: 0 })
  discountAmount: number

  @ApiProperty({ description: '税费（分）' })
  @Column({ name: 'tax_amount', comment: '税费（分）', type: 'bigint', default: 0 })
  taxAmount: number

  @ApiProperty({ description: '总金额（分）' })
  @Column({ name: 'total_amount', comment: '总金额（分）', type: 'bigint' })
  totalAmount: number

  @ApiProperty({ description: '履行状态：0-未发货 1-部分发货 2-已发货 3-已收货' })
  @Column({ name: 'fulfillment_status', comment: '履行状态：0-未发货 1-部分发货 2-已发货 3-已收货', default: 0 })
  fulfillmentStatus: number
}
