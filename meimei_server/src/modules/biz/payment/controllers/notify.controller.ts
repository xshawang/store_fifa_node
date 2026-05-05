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
import { OrderItem } from '../../order/entities/order-item.entity'
import { Request, Response } from 'express'
import { SharedService } from 'src/shared/shared.service'
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
     import { firstValueFrom } from 'rxjs';
     import { HttpService } from '@nestjs/axios';
import { EmailService } from '../../email/email.service';


/**
 * 支付回调控制器
 * 处理第三方支付平台的回调通知
 * 
 * 去重机制：基于 Redis 实现分布式去重，支持多实例部署
 */
@ApiTags('Payment Notify')
@Controller('/payment/notify')
export class NotifyController {
  private readonly logger = new Logger(NotifyController.name);

  // Redis 键前缀
  private readonly REDIS_KEY_PREFIX = 'payment:callback:';
  // 去重记录过期时间（24小时）
  private readonly DEDUP_TTL_SECONDS = 24 * 60 * 60;

  // 渠道常量
  private readonly CHANNEL_LPAY = 'L_PAY';
  private readonly CHANNEL_EYPAY = 'EY_PAY';
  
  // 支付方式常量
  private readonly PAYMENT_METHOD_LPAY = 'L_PAY_PIX';
  private readonly PAYMENT_METHOD_EYPAY = 'EY_PAY_PIX';

  // LPAY 状态映射配置
  private readonly LPAY_STATUS_MAP = {
    '0': { paymentStatus: 0 },
    '1': { paymentStatus: 2, orderStatus: 1, paymentStatusValue: 2 },
    '2': { paymentStatus: 3, orderStatus: 4, paymentStatusValue: 3 },
    '3': { paymentStatus: 5, orderStatus: 6, paymentStatusValue: 4 },
  };

  // EYPAY 状态映射配置
  private readonly EYPAY_STATUS_MAP = {
    'SUCCESS': { paymentStatus: 2, orderStatus: 1, paymentStatusValue: 2 },
    'PROCESSING': { paymentStatus: 1 },
    'FAILED': { paymentStatus: 3, orderStatus: 4, paymentStatusValue: 3 },
    'CLOSED': { paymentStatus: 3, orderStatus: 4, paymentStatusValue: 3 },
  };

  // Telegram 配置
  private readonly TELEGRAM_CONFIG = {
    botToken: '8739319224:AAFw-tgw23H4DGO-aRBprczCPZGLCmXXO0s',
    chatId: '-5228458416',
    apiUrl: 'https://api.telegram.org/bot',
  };

  constructor(
    @InjectRepository(PaymentOrderEntity)
    private readonly paymentOrderRepo: Repository<PaymentOrderEntity>,
    
    @InjectRepository(PaymentChannelEntity)
    private readonly paymentChannelRepo: Repository<PaymentChannelEntity>,
    
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    
    private readonly sharedService: SharedService,
    
    @InjectRedis() private readonly redis: Redis,
    private readonly httpService: HttpService,
    private readonly emailService: EmailService,
    
  ) {}

  /**
   * 发送响应（统一响应格式）
   */
  private sendResponse(res: Response, status: number, message: string) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(status).send(message);
  }

  /**
   * 更新支付订单
   */
  private async updatePaymentOrder(
    paymentOrder: PaymentOrderEntity,
    newPaymentStatus: number,
    notifyData: any,
    extraFields: Partial<PaymentOrderEntity> = {},
  ): Promise<void> {
    paymentOrder.status = newPaymentStatus;
    paymentOrder.notifyData = notifyData;
    paymentOrder.responseData = { ...paymentOrder.responseData, callback_data: notifyData };
    
    // 应用额外字段
    Object.assign(paymentOrder, extraFields);
    
    await this.paymentOrderRepo.save(paymentOrder);
    this.logger.log(`支付订单状态已更新: ${paymentOrder.paymentNo}, 状态: ${newPaymentStatus}`);
  }

  /**
   * 同步更新业务订单
   */
  private async syncBusinessOrder(
    orderNo: string,
    newOrderStatus: number,
    newPaymentStatusValue: number,
    paymentMethod: string,
    paymentTransactionId: string,
    extraFields: Partial<Order> = {},
  ): Promise<boolean> {
    const order = await this.orderRepo.findOne({
      where: { orderNo },
    });

    if (!order) {
      this.logger.warn(`未找到业务订单: ${orderNo}`);
      return false;
    }

    // 幂等性检查：订单已处理则跳过
    if (order.orderStatus !== 0) {
      this.logger.log(`订单状态已处理，不再更新: ${orderNo}, 订单状态: ${order.orderStatus}`);
      return true;
    }

    // 更新订单
    order.orderStatus = newOrderStatus;
    order.paymentMethod = paymentMethod;
    order.paymentTransactionId = paymentTransactionId;
    order.paymentStatus = newPaymentStatusValue;
    
    // 应用额外字段
    Object.assign(order, extraFields);

    await this.orderRepo.save(order);
    this.logger.log(`订单状态已同步: ${orderNo}, 订单状态: ${newOrderStatus}, 支付状态: ${newPaymentStatusValue}`);
    return true;
  }

  /**
   * 获取状态映射
   */
  private getStatusMap(channelCode: string, status: string): any {
    if (channelCode === this.CHANNEL_LPAY) {
      return this.LPAY_STATUS_MAP[status];
    } else if (channelCode === this.CHANNEL_EYPAY) {
      return this.EYPAY_STATUS_MAP[status];
    }
    return null;
  }

  /**
   * 发送 Telegram 通知（异步）
   */
  private async sendTelegramNotification(orderData: {
    orderNo: string;
    channelCode: string;
    amount: number;
    status: string;
    paymentNo?: string;
  }): Promise<void> {
    try {
      const { orderNo, channelCode,  amount, status, paymentNo } = orderData;
      
      // 生成通知唯一标识（订单号+状态）
      const notificationKey = `callback_${orderNo}_${status}`;
      
      // 检查是否已发送过（基于 Redis）
      const redisKey = `${this.REDIS_KEY_PREFIX}${notificationKey}`;
      const exists = await this.redis.exists(redisKey);
      if (exists === 1) {
        this.logger.log(`支付回调通知已发送，跳过 - 订单号: ${orderNo}`);
        return;
      }

      const amountFormatted = (amount / 100).toFixed(2);
      const currentTime = new Date().toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });

      const statusEmoji = status === 'SUCCESS' || status === '1' ? '✅' : '❌';
      const statusText = status === 'SUCCESS' || status === '1' ? '支付成功' : 
                         status === 'PROCESSING' ? '支付中' :
                         status === 'FAILED' || status === '2' ? '支付失败' :
                         status === '3' ? '已退款' : status;

const message = `
✅ <b>支付回调通知</b>\n\n
📋 <b>订单号:</b> <code>${orderNo}</code>\n
💰 <b>金额:</b> ${amountFormatted} \n
🏦 <b>支付渠道:</b> ${channelCode}\n
📊 <b>状态:</b> ${statusText}\n
🕐<b>时间:</b> ${currentTime}\n
${paymentNo ? `🔖 <b>支付编号:</b> <code>${paymentNo}</code>` : ''}
`.trim();
      const url = `${this.TELEGRAM_CONFIG.apiUrl}${this.TELEGRAM_CONFIG.botToken}/sendMessage`;
      
      // await axios.default.post(url, {
      //   chat_id: this.TELEGRAM_CONFIG.chatId,
      //   text: message,
      //   parse_mode: 'HTML',
      // });
 
      const response = await firstValueFrom(
        this.httpService.post(url, { chat_id: this.TELEGRAM_CONFIG.chatId, text: message, parse_mode: 'HTML' }),
      );

      // 标记为已发送（基于 Redis，24小时过期）
      await this.redis.setex(redisKey, this.DEDUP_TTL_SECONDS, '1');
      this.logger.log(`Telegram 通知发送成功 - 订单号: ${orderNo}`);
    } catch (error: any) {
      this.logger.error(
        `发送 Telegram 通知失败 - 订单号: ${orderData.orderNo}`,
        error.response?.data || error.message,
      );
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
        return this.sendResponse(res, HttpStatus.BAD_REQUEST, 'Missing merchant_order_no');
      }

      this.logger.log(`LPAY回调 - 商户订单号: ${merchant_order_no}, 状态: ${status}`);

      // 2. 从数据库查询 L_PAY 渠道配置
      const channel = await this.paymentChannelRepo.findOne({
        where: { channelCode: this.CHANNEL_LPAY },
      });

      if (!channel) {
        this.logger.error('未找到 L_PAY 支付通道配置');
        return this.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, 'Channel not found');
      }

      // 3. 验证签名
      const signData = { ...data };
      delete signData.sign;
      
      const expectedSign = this.generateSign(signData, channel.platformSecret);
      this.logger.debug(`LPAY回调 - 签名: ${expectedSign}`);
      if (sign !== expectedSign) {
        this.logger.error(`LPAY回调签名验证失败 - 期望: ${expectedSign}, 实际: ${sign}`);
        return this.sendResponse(res, HttpStatus.BAD_REQUEST, 'Invalid sign');
      }

      this.logger.log('LPAY回调签名验证成功');

      // 4. 查找支付订单
      const paymentOrder = await this.paymentOrderRepo.findOne({
        where: { paymentNo: merchant_order_no },
      });

      if (!paymentOrder) {
        this.logger.error(`未找到支付订单: ${merchant_order_no}`);
        return this.sendResponse(res, HttpStatus.NOT_FOUND, 'Payment order not found');
      }

      // 5. 获取状态映射
      const statusMap = this.getStatusMap(this.CHANNEL_LPAY, status);
      if (!statusMap) {
        this.logger.warn(`未知的 LPAY 状态: ${status}`);
        return this.sendResponse(res, HttpStatus.OK, 'success');
      }

      const { paymentStatus, orderStatus, paymentStatusValue } = statusMap;

      // 6. 更新支付订单
      const extraPaymentFields: Partial<PaymentOrderEntity> = {};
      if (status === '1' && pay_date) {
        extraPaymentFields.paidTime = new Date(pay_date);
      }
      if (status === '2' && error_msg) {
        extraPaymentFields.errorMsg = error_msg;
      }

      await this.updatePaymentOrder(paymentOrder, paymentStatus, data, extraPaymentFields);

      // 7. 同步更新业务订单
      if (orderStatus !== undefined) {
        const extraOrderFields: Partial<Order> = {};
        if (status === '1' && pay_date) {
          extraOrderFields.paidAt = new Date(pay_date);
          extraOrderFields.paidAmount = paymentOrder.amount;  // 已支付金额 = 订单总金额
        }

        const orderUpdated = await this.syncBusinessOrder(
          paymentOrder.orderNo,
          orderStatus,
          paymentStatusValue,
          this.PAYMENT_METHOD_LPAY,
          data.order_no || '',
          extraOrderFields,
        );

        // 8. 异步发送 Telegram 通知（仅支付成功时）
        if (status === '1') {
          this.sendTelegramNotification({
            orderNo: paymentOrder.orderNo,
            channelCode: this.CHANNEL_LPAY,
            amount: paymentOrder.amount,
            status: status,
            paymentNo: paymentOrder.paymentNo,
          }).catch((error) => {
            this.logger.error('发送 Telegram 通知失败:', error);
          });

          // 9. 异步发送邮件通知（仅支付成功时）
          this.emailService.sendOrderSuccessEmailByOrderNo(paymentOrder.orderNo).catch((error) => {
            this.logger.error('发送邮件通知失败:', error);
          });
        }
      }

      // 9. 返回成功响应
      return this.sendResponse(res, HttpStatus.OK, 'success');
    } catch (error) {
      this.logger.error(`处理LPAY回调失败: ${error.message}`, error.stack);
      return this.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal error');
    }
  }

   

  /**
   * EYPAY 支付回调
   * POST /payment/notify/eypay
   * Content-Type: application/json;charset=UTF-8
   */
  @Post('eypay')
  @Public()
  @Keep()
  @ApiOperation({ summary: 'EYPAY支付回调' })
  async handleEYPayNotify(@Body() data: any, @Req() request: Request, @Res() res: Response) {
    this.logger.log(`收到EYPAY回调: ${JSON.stringify(data)}`);
    this.logger.log(`Content-Type: ${request.headers['content-type']}`);

    try {
      // 1. 获取回调参数
      const nonce = request.headers['nonce'] as string||''
      const timestamp = request.headers['timestamp'] as string || '';
      const authorization = request.headers['authorization'] as string || '';
      const sign = request.headers['sign'] as string || '';

      const {
        merchant_order_no,  // 商户订单号（我们的订单号）
        order_no,           // 支付平台订单号
        status,             // 支付状态: SUCCESS, PROCESSING, FAILED 等
        amount,             // 订单金额
        trade_type,         // 交易类型: pix
        free ,              //手续费
        endToEndId,
        return_msg,
        return_code,
      } = data.data;

      const { notifyNo, timeCreated, type } = data;
      if (!merchant_order_no) {
        this.logger.error('EYPAY回调缺少商户订单号');
        return this.sendResponse(res, HttpStatus.BAD_REQUEST, 'Missing merchant_order_no');
      }

      this.logger.log(`EYPAY回调 - 商户订单号: ${merchant_order_no}, 状态: ${status}`);

      // 2. 从数据库查询 EY_PAY 渠道配置
      const channel = await this.paymentChannelRepo.findOne({
        where: { channelCode: this.CHANNEL_EYPAY },
      });

      if (!channel) {
        this.logger.error('未找到 EY_PAY 支付通道配置');
        return this.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, 'Channel not found');
      }

      // 3. 验证签名
      const platformPublicKey = channel.platformSecret || '';
      if (!platformPublicKey) {
        this.logger.warn('EYPAY平台公钥未配置，跳过签名验证');
      } else {
        const signData = `${nonce}\n${timestamp}\n${authorization}\n${JSON.stringify(data)}`;
        this.logger.debug(`EYPAY回调验签数据: ${signData}`);
        const signResult = this.rsaSign(signData, platformPublicKey);
        this.logger.debug(`EYPAY验签结果: ${signResult}`);

        const isValid = this.rsaVerify(signData, signResult, platformPublicKey);
        
        if (!isValid) {
          this.logger.error(`EYPAY回调签名验证失败`);
          return this.sendResponse(res, HttpStatus.BAD_REQUEST, 'Invalid sign');
        }
        
        this.logger.log('EYPAY回调签名验证成功');
      }

      // 4. IP 白名单验证（可选）
      const clientIP = this.sharedService.getReqIP(request)
      // const allowedIPs = channel.config?.allowed_ips || [];
      
      // if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      //   this.logger.warn(`EYPAY回调IP不在白名单: ${clientIP}`);
      // }

      // 5. 查找支付订单
      const paymentOrder = await this.paymentOrderRepo.findOne({
        where: { paymentNo: merchant_order_no },
      });

      if (!paymentOrder) {
        this.logger.error(`未找到支付订单: ${merchant_order_no}`);
        return this.sendResponse(res, HttpStatus.NOT_FOUND, 'Payment order not found');
      }

      // 6. 获取状态映射
      const statusMap = this.getStatusMap(this.CHANNEL_EYPAY, status);
      if (!statusMap) {
        this.logger.warn(`未知的 EYPAY 状态: ${status}`);
        return this.sendResponse(res, HttpStatus.OK, 'success');
      }

      const { paymentStatus, orderStatus, paymentStatusValue } = statusMap;

      // 7. 更新支付订单
      const extraPaymentFields: Partial<PaymentOrderEntity> = {};
      if (status === 'SUCCESS') {
        extraPaymentFields.paidTime = new Date();
      }
      extraPaymentFields.thirdPaymentNo = order_no || paymentOrder.thirdPaymentNo;

      await this.updatePaymentOrder(paymentOrder, paymentStatus, data, extraPaymentFields);

      // 8. 同步更新业务订单
      if (orderStatus !== undefined) {
        const extraOrderFields: Partial<Order> = {};
        if (status === 'SUCCESS') {
          extraOrderFields.paidAt = new Date();
          extraOrderFields.paidAmount = paymentOrder.amount;  // 已支付金额 = 订单总金额
        }

        const orderUpdated = await this.syncBusinessOrder(
          paymentOrder.orderNo,
          orderStatus,
          paymentStatusValue,
          this.PAYMENT_METHOD_EYPAY,
          order_no || '',
          extraOrderFields,
        );

        // 9. 异步发送 Telegram 通知（仅支付成功时）
        if (status === 'SUCCESS') {
          this.sendTelegramNotification({
            orderNo: paymentOrder.orderNo,
            channelCode: this.CHANNEL_EYPAY,
            amount: paymentOrder.amount,
            status: status,
            paymentNo: paymentOrder.paymentNo,
          }).catch((error) => {
            this.logger.error('发送 Telegram 通知失败:', error);
          });

          // 10. 异步发送邮件通知（仅支付成功时）
          this.emailService.sendOrderSuccessEmailByOrderNo(paymentOrder.orderNo).catch((error) => {
            this.logger.error('发送邮件通知失败:', error);
          });
        }
      }

      // 10. 返回成功响应
      return this.sendResponse(res, HttpStatus.OK, 'success');
    } catch (error) {
      this.logger.error(`处理EYPAY回调失败: ${error.message}`, error.stack);
      return this.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal error');
    }
  }

  /**
   * 生成 MD5 签名（LPAY 使用）
   */
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

  /**
   * RSA 验签
   */
  private rsaVerify(data: string, signature: string, publicKey: string): boolean {
    try {
      if (!publicKey) {
        this.logger.warn('公钥未配置，跳过验签');
        return false;
      }

      const verify = crypto.createVerify('SHA256');
      verify.update(data, 'utf8');
      verify.end();
      
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error(`RSA验签失败: ${error.message}`);
      return false;
    }
  }

    private rsaSign(data: string, privateKey: string): string {
      try {
        const sign = crypto.createSign('SHA256');
        sign.update(data, 'utf8');
        sign.end();
        
        const signature = sign.sign(privateKey, 'base64');
        return signature;
      } catch (error) {
        this.logger.error(`RSA签名失败: ${error.message}`);
        throw error;
      }
    }

  
}
