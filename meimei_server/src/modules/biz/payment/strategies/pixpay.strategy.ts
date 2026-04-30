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
 * PIX_PAY 支付策略实现
 * 支持巴西 PIX 即时支付，货币 BRL（巴西雷亚尔）
 */
@Injectable()
export class PIXPayStrategy implements PaymentStrategy {
  private readonly logger = new Logger(PIXPayStrategy.name);
  private   channelConfig: ChannelConfig;

  // 回调 IP 白名单
  private readonly allowedCallbackIPs = [
    '54.233.234.196',
    '18.229.23.62',
    '56.125.86.62',
    '18.229.182.144',
    '56.125.155.115',
  ];

  constructor(private readonly httpService: HttpService) {
    // 从环境变量或配置加载通道配置
    this.channelConfig = {
      channelCode: 'PIX_PAY',
      channelName: 'PIX支付',
      channelType: 'PIX',
      platformKey: process.env.PIXPAY_PLATFORM_KEY || 'pk_test_pixpay_key_here',
      platformSecret: process.env.PIXPAY_PLATFORM_SECRET || 'sk_test_pixpay_secret_here',
      siteCode: process.env.PIXPAY_SITE_CODE || 'TESTSITE001',
      apiBaseUrl: process.env.PIXPAY_API_BASE_URL || 'https://api.pixpay.com',
      apiVersion: 'v1',
      notifyUrl: process.env.PIXPAY_NOTIFY_URL || 'https://store.fafbuy.store/api/payment/notify/pixpay',
      supportedCurrencies: ['BRL'],
      supportedMethods: ['PIX'],
      minAmount: 1.0,
      maxAmount: 999999.99,
      feeRate: 0.015, // PIX 费率通常较低
      isActive: true,
      priority: 1,
      sortOrder: 1,
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
    this.logger.log(`PIX_PAY创建订单: ${params.orderNo}`);

    try {
      // 构建请求参数
      const requestData: any = {
        platform_key: this.channelConfig.platformKey,
        site_code: this.channelConfig.siteCode,
        order_no: params.orderNo,
        amount: Math.round(params.amount * 100), // 转为分
        currency: params.currency,
        payment_method: 'PIX',
        timestamp: Math.floor(Date.now() / 1000),
        notify_url: params.notifyUrl,
      };

      // 如果有 CPF（巴西税号），添加到请求中
      if (params.cpf) {
        requestData.cpf = params.cpf;
      }

      // 如果有用户邮箱，添加到请求中
      if (params.email) {
        requestData.email = params.email;
      }

      // 生成签名
      requestData.sign = this.generateSign(requestData, this.channelConfig.platformSecret);

      this.logger.debug(`PIX_PAY请求参数: ${JSON.stringify(requestData)}`);

      // 调用API
      const apiUrl = `${this.channelConfig.apiBaseUrl}/api/${this.channelConfig.apiVersion}/pay/create`;
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData),
      );

      this.logger.debug(`PIX_PAY响应数据: ${JSON.stringify(response.data)}`);

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
          errorMsg: response.data.msg || '创建支付失败',
          rawData: response.data,
        };
      }
    } catch (error) {
      this.logger.error(`PIX_PAY创建订单异常: ${error.message}`, error.stack);
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
    this.logger.log(`PIX_PAY查询订单: ${paymentNo}`);

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
        // 状态映射：PROCESSING→PAYING, SUCCESS→SUCCESS, FAIL→FAILED
        const statusMap: Record<string, PaymentStatus> = {
          'PROCESSING': PaymentStatus.PAYING,
          'SUCCESS': PaymentStatus.SUCCESS,
          'FAIL': PaymentStatus.FAILED,
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
      this.logger.error(`PIX_PAY查询订单异常: ${error.message}`, error.stack);
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
    const dataCopy = { ...data };
    delete dataCopy.sign;

    const expectedSign = this.generateSign(dataCopy, this.channelConfig.platformSecret);
    return sign === expectedSign;
  }

  /**
   * 验证回调 IP 是否在白名单中
   */
  isIPAllowed(ip: string): boolean {
    if (!ip) {
      return false;
    }
    
    // 处理可能的 IPv6 映射格式或代理头
    const cleanIP = ip.replace(/^::ffff:/, '');
    return this.allowedCallbackIPs.includes(cleanIP);
  }

  /**
   * 处理支付回调
   */
  async handleNotify(data: any): Promise<NotifyResult> {
    this.logger.log(`PIX_PAY处理回调: ${data.order_no}`);

    // 验证签名
    if (!this.verifyNotify({ ...data })) {
      this.logger.error('PIX_PAY回调签名验证失败');
      return {
        success: false,
        paymentNo: data.order_no,
        status: PaymentStatus.FAILED,
        errorMsg: '签名验证失败',
      };
    }

    // 状态映射：PROCESSING→PAYING, SUCCESS→SUCCESS, FAIL→FAILED
    const statusMap: Record<string, PaymentStatus> = {
      'PROCESSING': PaymentStatus.PAYING,
      'SUCCESS': PaymentStatus.SUCCESS,
      'FAIL': PaymentStatus.FAILED,
    };

    return {
      success: true,
      paymentNo: data.order_no,
      status: statusMap[data.status] || PaymentStatus.PENDING,
    };
  }

  /**
   * 生成签名
   * 使用 MD5 签名算法（与 XPay 相同）
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
