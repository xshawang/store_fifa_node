import {
  Controller,
  Post,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Keep } from 'src/common/decorators/keep.decorator'
import { Public } from 'src/common/decorators/public.decorator'
import * as crypto from 'crypto';
import { FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaymentOrderEntity } from '../entities/payment-order.entity'
import { PaymentChannelEntity } from '../entities/payment-channel.entity'
import { Order } from '../../order/entities/order.entity'
import { Request, Response } from 'express'
/**
 * 支付回调控制器
 * 处理第三方支付平台的回调通知
 */
@ApiTags('Payment Notify')
@Controller('/payment/notify')
export class NotifyController {
  private readonly logger = new Logger(NotifyController.name);

  constructor(
    @InjectRepository(PaymentOrderEntity)
    private readonly paymentOrderRepo: Repository<PaymentOrderEntity>,
    
    @InjectRepository(PaymentChannelEntity)
    private readonly paymentChannelRepo: Repository<PaymentChannelEntity>,
    
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

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
   * LPAY 支付回调
   * POST /payment/notify/lpay
   */
  @Post('lpay')
  @UseInterceptors(AnyFilesInterceptor())
  @Public()
  @Keep()
  @ApiOperation({ summary: 'LPAY支付回调' })
  async handleLPayNotify(@Req() request: Request, @Res() res: Response) {
    const data = request.body as any;
    this.logger.log(`收到LPAY回调: ${JSON.stringify(data)}`);

    try {
      // 1. 获取回调参数
      const {
        order_no,           // 平台单号
        merchant_order_no,  // 商户订单号（我们的订单号）
        status,             // 支付状态: 0-未支付 1-支付成功 2-支付失败 3-退款
        amount,             // 订单金额
        pay_date,           // 支付时间
        error_msg,          // 错误信息
        sign,               // 签名
      } = data;

      if (!merchant_order_no) {
        this.logger.error('LPAY回调缺少商户订单号');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(HttpStatus.BAD_REQUEST).send('Missing merchant_order_no');
      }

      this.logger.log(`LPAY回调 - 商户订单号: ${merchant_order_no}, 状态: ${status}`);

      // 2. 从数据库查询 L_PAY 渠道配置，获取 platform_secret 用于签名验证
      const channel = await this.paymentChannelRepo.findOne({
        where: { channelCode: 'L_PAY' },
      });

      if (!channel) {
        this.logger.error('未找到 L_PAY 支付通道配置');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Channel not found');
      }

      // 3. 验证签名（sign 参数不参与签名）
      const signData = { ...data };
      delete signData.sign;  // 移除 sign 参数
      
      const expectedSign = this.generateSign(signData, channel.platformSecret);
      this.logger.log(`LPAY回调 - 签名: ${expectedSign}`);
      if (sign !== expectedSign) {
        this.logger.error(`LPAY回调签名验证失败 - 期望: ${expectedSign}, 实际: ${sign}`);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(HttpStatus.BAD_REQUEST).send('Invalid sign');
      }

      this.logger.log('LPAY回调签名验证成功');

      // 4. 查找支付订单
      const paymentOrder = await this.paymentOrderRepo.findOne({
        where: { paymentNo: merchant_order_no },
      });

      if (!paymentOrder) {
        this.logger.error(`未找到支付订单: ${merchant_order_no}`);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(HttpStatus.NOT_FOUND).send('Payment order not found');
      }

      // 5. 根据 status 更新支付订单状态
      // LPAY状态: 0-未支付 1-支付成功 2-支付失败 3-退款
      // 支付表状态: 0-待支付 1-支付中 2-支付成功 3-支付失败 4-已取消 5-已退款
      let newPaymentStatus: number;
      let newOrderStatus: number | undefined;
      let newPaymentStatusValue: number | undefined;

      switch (status) {
        case '0':  // 未支付
          newPaymentStatus = 0;  // 待支付
          break;
        
        case '1':  // 支付成功
          newPaymentStatus = 2;  // 支付成功
          newOrderStatus = 1;    // 订单状态：已支付
          newPaymentStatusValue = 2;  // 订单支付状态：已支付
          break;
        
        case '2':  // 支付失败
          newPaymentStatus = 3;  // 支付失败
          newOrderStatus = 4;    // 订单状态：已取消
           newPaymentStatusValue = 3;  // 订单支付状态：支付失败
          break;
        
        case '3':  // 退款
          newPaymentStatus = 5;  // 已退款
          newOrderStatus = 6;    // 订单状态：已退款（如果有的话）
          newPaymentStatusValue = 4;  // 订单支付状态：已退款
          break;
        
        default:
          this.logger.warn(`未知的 LPAY 状态: ${status}`);
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.send('success');
      }

      // 6. 更新支付订单表
      paymentOrder.status = newPaymentStatus;
      paymentOrder.notifyData = data;
      paymentOrder.responseData = { ...paymentOrder.responseData, callback_data: data };
      
      if (status === '1' && pay_date) {
        paymentOrder.paidTime = new Date(pay_date);
      }
      
      if (status === '2' && error_msg) {
        paymentOrder.errorMsg = error_msg;
      }

      await this.paymentOrderRepo.save(paymentOrder);
      this.logger.log(`支付订单状态已更新: ${merchant_order_no}, 状态: ${newPaymentStatus}`);

      // 7. 同步更新 biz_order 表（仅支付成功和支付失败）
      if (newOrderStatus !== undefined) {
        const order = await this.orderRepo.findOne({
          where: { orderNo: paymentOrder.orderNo },
        });

        if (order) {
          if(0 != order.orderStatus){
             this.logger.log(`订单状态 已经处理，不再更新: ${paymentOrder.orderNo}, 订单状态: ${order.orderStatus}, 支付状态: ${newPaymentStatusValue}`);
             res.setHeader('Content-Type', 'text/plain; charset=utf-8');
             return res.send('success');
          }
          order.orderStatus = newOrderStatus;
          order.paymentMethod='L_PAY_PIX'
          order.paymentTransactionId = data.order_no||'';
          if (newPaymentStatusValue !== undefined) {
            order.paymentStatus = newPaymentStatusValue;
          }
          
          if (status === '1' && pay_date) {
            order.paidAt = new Date(pay_date);
            order.paidAmount = order.totalAmount;  // 已支付金额 = 订单总金额
          }

          await this.orderRepo.save(order);
          this.logger.log(`订单状态已同步: ${merchant_order_no}, 订单状态: ${newOrderStatus}, 支付状态: ${newPaymentStatusValue}`);
        } else {
          this.logger.warn(`未找到业务订单: ${merchant_order_no}`);
        }
      }

      // 8. 返回成功响应
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send('success');
    } catch (error) {
      this.logger.error(`处理LPAY回调失败: ${error.message}`, error.stack);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal error');
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

  private generateSign(params: Record<string, any>, secret: string): string {
      // 1. 过滤空参数
      const filteredParams: Record<string, any> = {};
      for (const key in params) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          filteredParams[key] = params[key];
        }
      }
  
      // 2. 参数按字母排序（ASCII码）
      const sortedKeys = Object.keys(filteredParams).sort();
  
      // 3. 拼接字符串：key=value&key=value&secret
      const signStr = sortedKeys
        .map((key) => `${key}=${filteredParams[key]}`)
        .join('&') + `&${secret}`;
  
      this.logger.debug(`LPAY签名字符串: ${signStr}`);
  
      // 4. MD5加密并转大写
      return crypto
        .createHash('md5')
        .update(signStr)
        .digest('hex')
        .toUpperCase();
    }
}
