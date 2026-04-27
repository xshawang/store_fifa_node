import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建支付订单DTO
 * 调用方只需提供基本支付信息，通道信息由 PaymentService 自动附加
 */
export class CreatePaymentDto {
  @ApiProperty({ description: '订单号' })
  @IsNotEmpty({ message: '订单号不能为空' })
  @IsString()
  orderNo: string;

  @ApiProperty({ description: '支付金额' })
  @IsNotEmpty({ message: '支付金额不能为空' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: '货币代码', example: 'USD' })
  @IsNotEmpty({ message: '货币代码不能为空' })
  @IsString()
  currency: string;

  @ApiProperty({ description: '支付方式', example: 'CREDIT_CARD, MASTERCARD, VISA' })
  @IsNotEmpty({ message: '支付方式不能为空' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  // 信用卡信息（可选，由支付通道使用）
  @ApiProperty({ description: '信用卡号', required: false })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiProperty({ description: '信用卡有效期', required: false })
  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @ApiProperty({ description: '信用卡CVV', required: false })
  @IsOptional()
  @IsString()
  cardCvv?: string;

  @ApiProperty({ description: '持卡人姓名', required: false })
  @IsOptional()
  @IsString()
  cardHolderName?: string;

  // PIX 支付特有字段
  @ApiProperty({ description: 'CPF（巴西税号）', required: false })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ description: '用户邮箱', required: false })
  @IsOptional()
  @IsString()
  email?: string;
}
