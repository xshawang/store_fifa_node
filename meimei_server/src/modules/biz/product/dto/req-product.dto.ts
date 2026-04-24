import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationDto } from 'src/common/dto/pagination.dto'

export class CreateProductDto {

  @ApiProperty({ description: 'SKU ID' })
  @IsOptional()
  skuId: number

  @ApiProperty({ description: '产品ID', required: true })
  productId: number

  @ApiProperty({ description: '产品名称', required: true })
  @IsString()
  productName: string

  @ApiProperty({ description: '产品句柄' })
  @IsOptional()
  @IsString()
  handle: string

  @ApiProperty({ description: '产品URL' })
  @IsOptional()
  @IsString()
  productUrl: string

  @ApiProperty({ description: '价格' })
  @IsOptional()
  price: number

  @ApiProperty({ description: '原价' })
  @IsOptional()
  compareAtPrice: number



  @ApiProperty({ description: '品牌' })
  @IsOptional()
  @IsString()
  brand: string

  @ApiProperty({ description: '类别' })
  @IsOptional()
  @IsString()
  category: string

  @ApiProperty({ description: '产品类型' })
  @IsOptional()
  @IsString()
  productType: string

  @ApiProperty({ description: '性别' })
  @IsOptional()
  @IsString()
  gender: string

  @ApiProperty({ description: '国家' })
  @IsOptional()
  @IsString()
  nation: string

  @ApiProperty({ description: '赛事' })
  @IsOptional()
  @IsString()
  tournament: string

  @ApiProperty({ description: '颜色' })
  @IsOptional()
  @IsString()
  colour: string

  @ApiProperty({ description: '尺码' })
  @IsOptional()
  @IsString()
  size: string

  @ApiProperty({ description: 'SKU' })
  @IsOptional()
  @IsString()
  sku: string



  @ApiProperty({ description: '变体ID' })
  @IsOptional()
  @IsString()
  variantId: string

  @ApiProperty({ description: '条形码' })
  @IsOptional()
  @IsString()
  barcode: string

  @ApiProperty({ description: '图片URL' })
  @IsOptional()
  @IsString()
  imageUrl: string

  @ApiProperty({ description: '描述' })
  @IsOptional()
  @IsString()
  description: string

  @ApiProperty({ description: '库存状态' })
  @IsOptional()
  @IsString()
  availability: string

  @ApiProperty({ description: '集合' })
  @IsOptional()
  @IsString()
  collection: string

  @ApiProperty({ description: '状态：0-下架 1-上架', default: 1 })
  @IsOptional()
  @IsNumber()
  status: number

  @ApiProperty({ description: '创建人' })
  @IsOptional()
  @IsString()
  createBy: string

  @ApiProperty({ description: '更新人' })
  @IsOptional()
  @IsString()
  updateBy: string
}

export class UpdateProductDto extends CreateProductDto {
}

export class QueryProductDto extends PaginationDto {
  @ApiProperty({ description: '产品ID' })
  @IsOptional()
  @IsString()
  productId?: string

  @ApiProperty({ description: 'SKU ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skuId?: number

  @ApiProperty({ description: '产品名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  productName?: string

  @ApiProperty({ description: '品牌' })
  @IsOptional()
  @IsString()
  brand?: string

  @ApiProperty({ description: '类别' })
  @IsOptional()
  @IsString()
  category?: string

  @ApiProperty({ description: '集合' })
  @IsOptional()
  @IsString()
  collection?: string

  @ApiProperty({ description: '状态：0-下架 1-上架' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number
}
