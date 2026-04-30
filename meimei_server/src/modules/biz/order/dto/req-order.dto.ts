import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 订单查询DTO
 */
export class QueryOrderDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageNum?: number

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number

  @ApiProperty({ description: '订单编号', required: false })
  @IsOptional()
  @IsString()
  orderNo?: string

  @ApiProperty({ description: '创建开始时间', required: false })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiProperty({ description: '创建截止时间', required: false })
  @IsOptional()
  @IsString()
  endTime?: string
}

/**
 * 订单项DTO
 */
export class OrderItemDto {
  @ApiProperty({ description: '订单项ID' })
  itemId: number

  @ApiProperty({ description: '产品名称' })
  productName: string

  @ApiProperty({ description: '产品图片' })
  productImage: string

  @ApiProperty({ description: '规格编号' })
  skuCode: string

  @ApiProperty({ description: '尺码' })
  size: string

  @ApiProperty({ description: '数量' })
  quantity: number

  @ApiProperty({ description: '售价' })
  salePrice: number

  @ApiProperty({ description: '小计金额' })
  subtotalAmount: number
}

/**
 * 支付信息DTO
 */
export class PaymentInfoDto {
  @ApiProperty({ description: '支付编号' })
  paymentNo: string

  @ApiProperty({ description: '订单编号' })
  orderNo: string

  @ApiProperty({ description: '支付金额' })
  amount: number

  @ApiProperty({ description: '货币' })
  currency: string

  @ApiProperty({ description: '支付状态: 0-待支付 1-支付中 2-支付成功 3-支付失败 4-已取消 5-已退款' })
  status: number

  @ApiProperty({ description: '支付渠道' })
  paymentChannel: string

  @ApiProperty({ description: '支付方式' })
  paymentMethod: string

  @ApiProperty({ description: '第三方支付编号' })
  thirdPaymentNo: string

  @ApiProperty({ description: '支付URL' })
  payUrl: string

  @ApiProperty({ description: '创建时间' })
  createdAt: Date

  @ApiProperty({ description: '支付时间' })
  paidTime: Date
}
