import {
  Controller,
  Post,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
  Req,
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
   * PIX_PAY 支付回调
   * POST /api/payment/notify/pixpay
   */
  @Post('pixpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PIX_PAY支付回调' })
  async handlePIXPayNotify(@Body() data: any, @Req() request: any) {
    this.logger.log(`收到PIX_PAY回调: ${JSON.stringify(data)}`);

    try {
      // 获取客户端 IP
      const clientIP = request.ip || request.headers['x-forwarded-for'] || request.connection?.remoteAddress;
      
      // IP 白名单验证
      if (!this.isIPAllowed(clientIP)) {
        this.logger.error(`PIX_PAY回调IP不在白名单: ${clientIP}`);
        return {
          code: -1,
          msg: 'IP not allowed',
        };
      }

      // TODO: 验证签名
      // TODO: 更新支付订单状态
      // TODO: 更新业务订单状态

      return {
        code: 0,
        msg: 'Success',
      };
    } catch (error) {
      this.logger.error(`处理PIX_PAY回调失败: ${error.message}`, error.stack);
      return {
        code: -1,
        msg: error.message,
      };
    }
  }

  /**
   * 验证 IP 是否在白名单中
   */
  private isIPAllowed(ip: string): boolean {
    if (!ip) {
      return false;
    }
    
    // 处理可能的 IPv6 映射格式
    const cleanIP = ip.replace(/^::ffff:/, '');
    
    const allowedIPs = [
      '54.233.234.196',
      '18.229.23.62',
      '56.125.86.62',
      '18.229.182.144',
      '56.125.155.115',
    ];
    
    return allowedIPs.includes(cleanIP);
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
        case 'pixpay':
          return this.handlePIXPayNotify(data, {});
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
