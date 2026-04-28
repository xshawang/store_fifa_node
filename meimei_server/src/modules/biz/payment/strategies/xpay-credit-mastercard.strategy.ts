import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  PaymentStrategy,
  CreatePaymentParams,
  CreatePaymentResult,
  QueryPaymentResult,
  NotifyResult,
  PaymentStatus,
  ChannelConfig,
} from '../interfaces/payment-strategy.interface';
import * as crypto from 'crypto';

/**
 * X支付 - Mastercard 信用卡策略
 * 专门处理 Mastercard 信用卡支付
 */
@Injectable()
export class XPayCreditMastercardStrategy implements PaymentStrategy {
 
  private readonly logger = new Logger(XPayCreditMastercardStrategy.name);
  private   channelConfig: ChannelConfig;

  constructor(private readonly httpService: HttpService) {
    // Mastercard 专用配置
    this.channelConfig = {
      channelCode: 'X_PAY_CREDIT_MASTERCARD',
      channelName: 'X支付-Mastercard信用卡',
      channelType: 'CREDIT_CARD',
      platformKey: 'pk_test_mastercard_key_123',  // Mastercard 专用密钥
      platformSecret: 'sk_test_mastercard_secret_456',
      siteCode: 'TESTSITE001',
      apiBaseUrl: 'https://api.xpay.com',
      apiVersion: 'v1',
      notifyUrl: 'https://store.fif.com/api/payment/notify/xpay-mastercard',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'],  // Mastercard 支持的货币
      supportedMethods: ['MASTERCARD'],  // 仅支持 Mastercard
      minAmount: 1.0,
      maxAmount: 999999.99,
      feeRate: 0.025,  // Mastercard 费率可能不同
      isActive: true,
      priority: 2,  // 优先级略低于通用信用卡
      sortOrder: 2,
    };
  }
  setChannelConfig(channelConfig: ChannelConfig) {
    this.channelConfig = channelConfig;
  }
  getChannelCode(): string {
    return this.channelConfig.channelCode;
  }

  getChannelType(): string {
    return this.channelConfig.channelType;
  }

  getPriority(): number {
    return this.channelConfig.priority;
  }

  supportCurrency(currency: string): boolean {
    return this.channelConfig.supportedCurrencies.includes(currency);
  }

  supportMethod(method: string): boolean {
    return this.channelConfig.supportedMethods.includes(method);
  }

  /**
   * 创建支付订单
   */
  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    this.logger.log(`Mastercard支付创建订单: ${params.orderNo}`);

    try {
      // 验证支付方式
    //   if (params.paymentMethod !== 'MASTERCARD') {
    //     return {
    //       success: false,
    //       paymentNo: params.orderNo,
    //       errorMsg: '此通道仅支持Mastercard支付',
    //     };
    //   }

      // 构建请求参数
      const requestData: any = {
        platform_key: this.channelConfig.platformKey,
        site_code: this.channelConfig.siteCode,
        order_no: params.orderNo,
        amount: Math.round(params.amount * 100), // 转为分
        currency: params.currency,
        payment_method: 'MASTERCARD',  // 固定为 MASTERCARD
        timestamp: Math.floor(Date.now() / 1000),
        notify_url: params.notifyUrl,
      };

      // 如果有信用卡信息，添加到请求中
      if (params.cardNumber) {
        requestData.card_number = params.cardNumber.replace(/\s/g, '');  // 去除空格
      }
      if (params.cardExpiry) {
        requestData.card_expiry = params.cardExpiry;
      }
      if (params.cardHolderName) {
        requestData.card_holder_name = params.cardHolderName;
      }

      // 生成签名
      requestData.sign = this.generateSign(requestData, this.channelConfig.platformSecret);

      this.logger.debug(`Mastercard请求参数: ${JSON.stringify(requestData)}`);

      // 调用API
      const apiUrl = `${this.channelConfig.apiBaseUrl}/api/${this.channelConfig.apiVersion}/pay/create`;
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData),
      );

      this.logger.debug(`Mastercard响应数据: ${JSON.stringify(response.data)}`);

      // 处理响应
      if (response.data.code === 0) {
        return {
          success: true,
          paymentNo: params.orderNo,
          thirdPaymentNo: response.data.data.third_order_no,
          payUrl: response.data.data.pay_url,
          qrCode: response.data.data.qr_code,
          expireTime: new Date(response.data.data.expire_time),
          rawData: response.data,
        };
      } else {
        return {
          success: false,
          paymentNo: params.orderNo,
          errorMsg: response.data.msg || '创建Mastercard支付失败',
          rawData: response.data,
        };
      }
    } catch (error) {
      this.logger.error(`Mastercard支付创建订单异常: ${error.message}`, error.stack);
      return {
        success: false,
        paymentNo: params.orderNo,
        errorMsg: error.message || '网络异常',
      };
    }
  }

  /**
   * 查询支付状态
   */
  async queryPayment(paymentNo: string): Promise<QueryPaymentResult> {
    this.logger.log(`Mastercard支付查询订单: ${paymentNo}`);

    try {
      const requestData: any = {
        platform_key: this.channelConfig.platformKey,
        order_no: paymentNo,
        timestamp: Math.floor(Date.now() / 1000),
      };

      requestData.sign = this.generateSign(requestData, this.channelConfig.platformSecret);

      const apiUrl = `${this.channelConfig.apiBaseUrl}/api/${this.channelConfig.apiVersion}/pay/query`;
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData),
      );

      if (response.data.code === 0) {
        const statusMap: Record<string, PaymentStatus> = {
          'pending': PaymentStatus.PENDING,
          'paying': PaymentStatus.PAYING,
          'success': PaymentStatus.SUCCESS,
          'failed': PaymentStatus.FAILED,
          'cancelled': PaymentStatus.CANCELLED,
        };

        return {
          success: true,
          status: statusMap[response.data.data.status] || PaymentStatus.PENDING,
          paidTime: response.data.data.paid_time ? new Date(response.data.data.paid_time) : undefined,
          rawData: response.data,
        };
      } else {
        return {
          success: false,
          status: PaymentStatus.FAILED,
          errorMsg: response.data.msg || '查询失败',
        };
      }
    } catch (error) {
      this.logger.error(`Mastercard支付查询订单异常: ${error.message}`, error.stack);
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorMsg: error.message,
      };
    }
  }

  /**
   * 验证回调签名
   */
  verifyNotify(data: any): boolean {
    const sign = data.sign;
    delete data.sign;

    const expectedSign = this.generateSign(data, this.channelConfig.platformSecret);
    return sign === expectedSign;
  }

  /**
   * 处理支付回调
   */
  async handleNotify(data: any): Promise<NotifyResult> {
    this.logger.log(`Mastercard支付处理回调: ${data.order_no}`);

    // 验证签名
    if (!this.verifyNotify({ ...data })) {
      this.logger.error('Mastercard回调签名验证失败');
      return {
        success: false,
        paymentNo: data.order_no,
        status: PaymentStatus.FAILED,
        errorMsg: '签名验证失败',
      };
    }

    // 根据状态映射
    const statusMap: Record<string, PaymentStatus> = {
      'success': PaymentStatus.SUCCESS,
      'failed': PaymentStatus.FAILED,
    };

    return {
      success: true,
      paymentNo: data.order_no,
      status: statusMap[data.status] || PaymentStatus.PENDING,
    };
  }

  /**
   * 生成签名
   */
  private generateSign(params: Record<string, any>, secret: string): string {
    // 1. 参数按字母排序
    const sortedKeys = Object.keys(params).sort();

    // 2. 拼接字符串
    const signStr = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join('&') + `&key=${secret}`;

    // 3. MD5加密并转大写
    return crypto
      .createHash('md5')
      .update(signStr)
      .digest('hex')
      .toUpperCase();
  }
}
