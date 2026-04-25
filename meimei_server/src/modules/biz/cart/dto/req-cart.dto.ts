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
