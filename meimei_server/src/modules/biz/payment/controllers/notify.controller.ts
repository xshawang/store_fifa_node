import {
  Controller,
  Post,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * 支付回调控制器
 * 处理第三方支付平台的回调通知
 */
@ApiTags('Payment Notify')
@Controller('api/payment/notify')
export class NotifyController {
  private readonly logger = new Logger(NotifyController.name);

  /**
   * X支付回调
   * POST /api/payment/notify/xpay
   */
  @Post('xpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'X支付回调' })
  async handleXPayNotify(@Body() data: any) {
    this.logger.log(`收到X支付回调: ${JSON.stringify(data)}`);

    try {
      // TODO: 验证签名
      // TODO: 更新支付订单状态
      // TODO: 更新业务订单状态

      return {
        code: 0,
        msg: 'Success',
      };
    } catch (error) {
      this.logger.error(`处理X支付回调失败: ${error.message}`, error.stack);
      return {
        code: -1,
        msg: error.message,
      };
    }
  }

  /**
   * 通用回调处理
   * POST /api/payment/notify/:channel
   */
  @Post(':channel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '通用支付回调' })
  async handleNotify(@Param('channel') channel: string, @Body() data: any) {
    this.logger.log(`收到${channel}支付回调`);

    try {
      // 根据通道处理回调
      switch (channel) {
        case 'xpay':
          return this.handleXPayNotify(data);
        default:
          this.logger.warn(`未知的支付通道: ${channel}`);
          return {
            code: -1,
            msg: 'Unknown channel',
          };
      }
    } catch (error) {
      this.logger.error(`处理回调失败: ${error.message}`, error.stack);
      return {
        code: -1,
        msg: error.message,
      };
    }
  }
}
