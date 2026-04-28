import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity('biz_order', { comment: '订单主表' })
@Index(['userId'])
@Index(['orderNo'])
@Index(['orderStatus'])
@Index(['paymentStatus'])
export class Order extends BaseEntity {

  @ApiProperty({ description: '订单ID（主键）' })
  @PrimaryGeneratedColumn({ name: 'order_id', comment: '订单ID（主键）' })
  orderId: number

  @ApiProperty({ description: '订单编号（唯一，业务使用）' })
  @Column({ name: 'order_no', comment: '订单编号（唯一，业务使用）', length: 50, unique: true })
  orderNo: string

  @ApiProperty({ description: '用户标识（从cookie _shopify_y提取）' })
  @Column({ name: 'user_id', comment: '用户标识', length: 500 })
  userId: string

  @ApiProperty({ description: '购物车标识（从cookie cart提取）' })
  @Column({ name: 'token', comment: '购物车标识', length: 500 })
  token: string

  @ApiProperty({ description: '订单状态：0-待支付 1-已支付 2-已发货 3-已完成 4-已取消 5-退款中 6-已退款' })
  @Column({ name: 'order_status', comment: '订单状态：0-待支付 1-已支付 2-已发货 3-已完成 4-已取消 5-退款中 6-已退款', default: 0 })
  orderStatus: number

  @ApiProperty({ description: '支付状态：0-未支付 1-支付中 2-已支付 3-支付失败 4-已退款' })
  @Column({ name: 'payment_status', comment: '支付状态：0-未支付 1-支付中 2-已支付 3-支付失败 4-已退款', default: 0 })
  paymentStatus: number

  @ApiProperty({ description: '商品小计（分）' })
  @Column({ name: 'subtotal_amount', comment: '商品小计（分）', type: 'bigint', default: 0 })
  subtotalAmount: number

  @ApiProperty({ description: '配送费用（分）' })
  @Column({ name: 'shipping_amount', comment: '配送费用（分）', type: 'bigint', default: 0 })
  shippingAmount: number

  @ApiProperty({ description: '税费（分）' })
  @Column({ name: 'tax_amount', comment: '税费（分）', type: 'bigint', default: 0 })
  taxAmount: number

  @ApiProperty({ description: '折扣金额（分）' })
  @Column({ name: 'discount_amount', comment: '折扣金额（分）', type: 'bigint', default: 0 })
  discountAmount: number

  @ApiProperty({ description: '订单总金额（分）' })
  @Column({ name: 'total_amount', comment: '订单总金额（分）', type: 'bigint' })
  totalAmount: number

  @ApiProperty({ description: '已支付金额（分）' })
  @Column({ name: 'paid_amount', comment: '已支付金额（分）', type: 'bigint', default: 0 })
  paidAmount: number

  @ApiProperty({ description: '货币代码（USD, CNY等）' })
  @Column({ name: 'currency', comment: '货币代码', length: 10, default: 'USD' })
  currency: string

  @ApiProperty({ description: '邮箱地址' })
  @Column({ name: 'email', comment: '邮箱地址', length: 200, nullable: true })
  email: string

  @ApiProperty({ description: '国家代码（US, CN等）' })
  @Column({ name: 'country_code', comment: '国家代码', length: 10, nullable: true })
  countryCode: string

  @ApiProperty({ description: '收货人名字' })
  @Column({ name: 'first_name', comment: '收货人名字', length: 100, nullable: true })
  firstName: string

  @ApiProperty({ description: '收货人姓氏' })
  @Column({ name: 'last_name', comment: '收货人姓氏', length: 100, nullable: true })
  lastName: string

  @ApiProperty({ description: '收货人全名' })
  @Column({ name: 'full_name', comment: '收货人全名', length: 200, nullable: true })
  fullName: string

  @ApiProperty({ description: '联系电话' })
  @Column({ name: 'phone', comment: '联系电话', length: 50, nullable: true })
  phone: string

  @ApiProperty({ description: '地址行1' })
  @Column({ name: 'address1', comment: '地址行1', length: 500, nullable: true })
  address1: string

  @ApiProperty({ description: '地址行2' })
  @Column({ name: 'address2', comment: '地址行2', length: 500, nullable: true })
  address2: string

  @ApiProperty({ description: '城市' })
  @Column({ name: 'city', comment: '城市', length: 100, nullable: true })
  city: string

  @ApiProperty({ description: '省份/州' })
  @Column({ name: 'province', comment: '省份/州', length: 100, nullable: true })
  province: string

  @ApiProperty({ description: '邮政编码' })
  @Column({ name: 'postal_code', comment: '邮政编码', length: 20, nullable: true })
  postalCode: string

  @ApiProperty({ description: '国家' })
  @Column({ name: 'country', comment: '国家', length: 100, nullable: true })
  country: string

  @ApiProperty({ description: '区域/地区' })
  @Column({ name: 'zone', comment: '区域/地区', length: 100, nullable: true })
  zone: string

  @ApiProperty({ description: '支付方式' })
  @Column({ name: 'payment_method', comment: '支付方式', length: 50, nullable: true })
  paymentMethod: string

  @ApiProperty({ description: '折扣码' })
  @Column({ name: 'discount_code', comment: '折扣码', length: 50, nullable: true })
  discountCode: string

  @ApiProperty({ description: '客户备注' })
  @Column({ name: 'customer_note', comment: '客户备注', type: 'text', nullable: true })
  customerNote: string

  @ApiProperty({ description: '支付时间' })
  @Column({ name: 'paid_at', comment: '支付时间', nullable: true })
  paidAt: Date

  @ApiProperty({ description: '下单IP地址' })
  @Column({ name: 'ip_address', comment: '下单IP地址', length: 50, nullable: true })
  ipAddress: string

  @ApiProperty({ description: '是否删除：0-否 1-是' })
  @Column({ name: 'is_deleted', comment: '是否删除：0-否 1-是', default: 0 })
  isDeleted: number

  @ApiProperty({ description: '支付交易ID' })
  @Column({ name: 'payment_transaction_id', comment: '支付交易ID', length: 100, nullable: true })
  paymentTransactionId: string


}

