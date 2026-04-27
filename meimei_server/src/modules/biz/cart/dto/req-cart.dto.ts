import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Type, Expose } from 'class-transformer'
import { PaginationDto } from 'src/common/dto/pagination.dto'

export class CreateCartDto {

  @ApiProperty({ description: '产品ID（variant id）', required: true })
  @IsOptional()
  id: number

  @ApiProperty({ description: '产品ID（product-id）', required: true })
  @IsOptional()
  productId: number

  @ApiProperty({ description: '尺码（Size-1）', required: true })
  @IsOptional()
  size1: string

  @ApiProperty({ description: '表单类型', default: 'product' })
  @IsOptional()
  @IsString()
  formType?: string

  @ApiProperty({ description: 'UTF-8 编码标记', default: '✓' })
  @IsOptional()
  @IsString()
  utf8?: string

  @ApiProperty({ description: 'section ID' })
  @IsOptional()
  @IsString()
  sectionId?: string

  @ApiProperty({ description: 'sections' })
  @IsOptional()
  @IsString()
  sections?: string

  @ApiProperty({ description: 'sections URL' })
  @IsOptional()
  @IsString()
  sectionsUrl?: string

  @ApiProperty({ description: '数量', default: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number
}

export class UpdateCartDto {
  @ApiProperty({ description: '购物车ID', required: true })
  @IsNumber()
  @Type(() => Number)
  cartId: number

  @ApiProperty({ description: '数量' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number
}

export class QueryCartDto extends PaginationDto {
  @ApiProperty({ description: '用户标识' })
  @IsOptional()
  @IsString()
  userId?: string

  @ApiProperty({ description: '产品ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productId?: number

  @ApiProperty({ description: '状态：0-已删除 1-正常' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number
}

export class ChangeCartDto {
  @ApiProperty({ description: '购物车行号(从1开始)', required: true })
  @IsOptional()
  line: string | number

  @ApiProperty({ description: '数量', required: true })
  @IsOptional()
  quantity: number

  @ApiProperty({ description: 'sections' })
  @IsOptional()
  sections: string[]

  @ApiProperty({ description: 'sections URL' })
  @IsOptional()
  @IsString()
  sectionsUrl?: string
}

export class CheckoutDto {
  @ApiProperty({ description: 'checkout token' })
  @IsOptional()
  @IsString()
  token?: string
}

/**
 * 支付表单 DTO
 */
export class CheckoutPayDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsOptional()
  @IsString()
  email?: string

  @ApiProperty({ description: '国家代码 (如: US, CN)' })
  @IsOptional()
  @IsString()
  countryCode?: string

  @ApiProperty({ description: '名字' })
  @IsOptional()
  @IsString()
  firstName?: string

  @ApiProperty({ description: '姓氏' })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiProperty({ description: '地址行1' })
  @IsOptional()
  @IsString()
  address1?: string

  @ApiProperty({ description: '地址行2' })
  @IsOptional()
  @IsString()
  address2?: string

  @ApiProperty({ description: '城市' })
  @IsOptional()
  @IsString()
  city?: string

  @ApiProperty({ description: '国家' })
  @IsOptional()
  @IsString()
  country?: string

  @ApiProperty({ description: '区域/地区' })
  @IsOptional()
  @IsString()
  zone?: string

  @ApiProperty({ description: '地址级别1' })
  @IsOptional()
  @IsString()
  addressLevel1?: string

  @ApiProperty({ description: '省份/州' })
  @IsOptional()
  @IsString()
  province?: string

  @ApiProperty({ description: '邮政编码' })
  @IsOptional()
  @IsString()
  postalCode?: string

  @ApiProperty({ description: '电话号码' })
  @IsOptional()
  @IsString()
  phone2?: string

  @ApiProperty({ description: '信用卡号' })
  @IsOptional()
  @IsString()
  number?: string
  @ApiProperty({ description: '有效期' })
  @IsOptional()
  @IsString()
  expiry?: string

  @ApiProperty({ description: '验证码' })
  @IsOptional()
  @IsString()
  verification_value?: string

  @ApiProperty({ description: '信用卡对应的持卡人' })
  @IsOptional()
  @IsString()
  name: string

  @ApiProperty({ description: '订单号' })
  @IsOptional()
  @IsString()
  v?: string
  // 允许其他表单数据
  [key: string]: any
}
