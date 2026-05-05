import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 票务订单创建DTO
 */
export class CreateTicketsDto {
  @ApiProperty({ description: '名' })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  'first-name': string;

  @ApiProperty({ description: '姓' })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  'last-name': string;

  @ApiProperty({ description: '邮箱' })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  email: string;

  @ApiProperty({ description: '电话' })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  phone: string;

  @ApiProperty({ description: '公司', required: false })
  @Transform(({ value }) => value?.trim())
    @IsOptional()
  company?: string;

  @ApiProperty({ description: '地址' })
  @Transform(({ value }) => value?.trim())
    @IsOptional()
  address: string;

  @ApiProperty({ description: '地址2', required: false })
  @Transform(({ value }) => value?.trim())
    @IsOptional()
  address2?: string;

  @ApiProperty({ description: '城市' })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({ description: '州/省' })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  state: string;

  @ApiProperty({ description: '邮编' })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  zip: string;

  @ApiProperty({ description: '国家' })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  country: string;

  @ApiProperty({ description: '备注说明', required: false })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  instructions?: string;

  @ApiProperty({ description: '支付方式', required: false })
    @IsOptional()
  @Transform(({ value }) => value?.trim())
  paymentmethod?: string;

  @ApiProperty({ description: '支付方式选择', required: false })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  paymentmethod_select?: string;

  @ApiProperty({ description: '折扣总金额', required: false })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value) || 0)
  discount_total_price?: number = 0;

  @ApiProperty({ description: '订单摘要(JSON数组字符串,每5个元素为一个物品)', required: false })
    @IsOptional()
  fifaShowOrderSummary: string;

  @ApiProperty({ description: '订单物品图片(JSON数组字符串)', required: false })
  @IsOptional()
  fifaShowOrderSummaryImgs?: string;

  @ApiProperty({ description: '用户ID', required: true })
  @IsOptional()
  uid: string;
}
