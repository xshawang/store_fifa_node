import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 支付订单查询DTO
 */
export class QueryPaymentOrderDto {
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

  @ApiProperty({ description: '支付编号', required: false })
  @IsOptional()
  @IsString()
  paymentNo?: string

  @ApiProperty({ description: '支付开始时间', required: false })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiProperty({ description: '支付截止时间', required: false })
  @IsOptional()
  @IsString()
  endTime?: string

  @ApiProperty({ description: '状态：0-待支付 1-支付中 2-支付成功 3-支付失败 4-已取消 5-已退款', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number
}

/**
 * 支付渠道查询DTO
 */
export class QueryPaymentChannelDto {
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

  @ApiProperty({ description: '渠道编码', required: false })
  @IsOptional()
  @IsString()
  channelCode?: string

  @ApiProperty({ description: '渠道名称', required: false })
  @IsOptional()
  @IsString()
  channelName?: string

  @ApiProperty({ description: '渠道类型', required: false })
  @IsOptional()
  @IsString()
  channelType?: string

  @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isActive?: number
}

/**
 * 创建支付渠道DTO
 */
export class CreatePaymentChannelDto {
  @ApiProperty({ description: '渠道编码' })
  @IsString()
  channelCode: string

  @ApiProperty({ description: '渠道名称' })
  @IsString()
  channelName: string

  @ApiProperty({ description: '渠道类型：CREDIT_CARD, QRIS, ALIPAY等' })
  @IsString()
  channelType: string

  @ApiProperty({ description: '平台密钥' })
  @IsString()
  platformKey: string

  @ApiProperty({ description: '平台秘钥' })
  @IsString()
  platformSecret: string

  @ApiProperty({ description: '站点编码', required: false })
  @IsOptional()
  @IsString()
  siteCode?: string

  @ApiProperty({ description: 'API基础URL' })
  @IsString()
  apiBaseUrl: string

  @ApiProperty({ description: 'API版本', required: false })
  @IsOptional()
  @IsString()
  apiVersion?: string

  @ApiProperty({ description: '通知URL' })
  @IsString()
  notifyUrl: string

  @ApiProperty({ description: '支持的货币', required: false })
  @IsOptional()
  supportedCurrencies?: string[]

  @ApiProperty({ description: '支持的支付方式', required: false })
  @IsOptional()
  supportedMethods?: string[]

  @ApiProperty({ description: '最小金额', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number

  @ApiProperty({ description: '最大金额', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number

  @ApiProperty({ description: '费率', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  feeRate?: number

  @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isActive?: number

  @ApiProperty({ description: '优先级', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority?: number

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number

  @ApiProperty({ description: '配置信息', required: false })
  @IsOptional()
  config?: any

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string
}

/**
 * 更新支付渠道DTO
 */
export class UpdatePaymentChannelDto extends CreatePaymentChannelDto {
  @ApiProperty({ description: 'ID' })
  @Type(() => Number)
  @IsNumber()
  id: number
}
