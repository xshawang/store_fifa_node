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
 * LPAY 聚合支付策略实现
 * 支持多种支付方式，通过统一接口进行支付
 */
@Injectable()
export class LPayStrategy implements PaymentStrategy {
  private readonly logger = new Logger(LPayStrategy.name);
  private channelConfig: ChannelConfig;

  constructor(private readonly httpService: HttpService) {
    // 从环境变量或配置加载通道配置
    this.channelConfig = {
      channelCode: 'L_PAY',
      channelName: 'LPAY聚合支付',
      channelType: 'AGGREGATE',
      platformKey: process.env.LPAY_API_KEY || 'test123',
      platformSecret: process.env.LPAY_SECRET || '123456',
      siteCode: process.env.LPAY_SITE_CODE || 'SITE001',  // 这是通道编码 code
      apiBaseUrl: process.env.LPAY_API_BASE_URL || 'https://api.lpay.com',
      apiVersion: 'v2',
      notifyUrl: process.env.LPAY_NOTIFY_URL || 'https://store.fafbuy.store/api/payment/notify/lpay',
      supportedCurrencies: ['USD', 'BRL', 'EUR', 'GBP', 'CNY'],
      supportedMethods: ['ALIPAY', 'WECHAT', 'CREDIT_CARD', 'PIX', 'QRIS'],
      minAmount: 1.0,
      maxAmount: 999999.99,
      feeRate: 0.02,
      isActive: true,
      priority: 1,
      sortOrder: 1,
    };
  }

  /**
   * 设置通道配置（可选，用于动态更新配置）
   */
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
    this.logger.log(`LPAY创建订单: ${JSON.stringify(params)}`);
    //转换成 BRL
    const USD_TO_BRL_RATE = 5.0;
    const brlAmount = params.amount * USD_TO_BRL_RATE;
    
    this.logger.log(`LPAY 订单金额: ${params.amount} USD BRL Amount: ${brlAmount}`);

    try {
      // 构建请求参数
      const requestData: any = {
        amount: brlAmount,
        merchant_order_no: params.orderNo,
        api_key: this.channelConfig.platformKey,
      };

      // 生成签名
      requestData.sign = this.generateSign(requestData, this.channelConfig.platformSecret);

      this.logger.debug(`LPAY请求参数: ${JSON.stringify(requestData)}`);

      // 调用API - 根据文档使用 /api/v2/pay/in 接口
      const apiUrl = `${this.channelConfig.apiBaseUrl}/api/v2/pay/in`
      const reqParams = { ...requestData, code: this.channelConfig.siteCode, notify_url: this.channelConfig.notifyUrl };
      this.logger.debug(`LPAY请求参数: ${JSON.stringify(reqParams)}`)

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, reqParams),
      );

      this.logger.debug(`LPAY响应数据: ${JSON.stringify(response.data)}`);

      // 处理响应 - 根据文档 code: 1 表示成功
      if (response.data.code === 1) {
        const responseData = response.data.data;
        return {
          success: true,
          paymentNo: params.orderNo,
          thirdPaymentNo: responseData.order_no, // 平台单号
          payUrl: responseData.pay_url, // 支付地址
          qrCode: responseData.pay_data || '', // 巴西地区有值其他地区为空
          expireTime: undefined, // 文档未提供过期时间
          rawData: response.data,
        };
      } else {
        return {
          success: false,
          paymentNo: params.orderNo,
          errorMsg: response.data.msg || response.data.data?.msg || '创建支付失败',
          rawData: response.data,
        };
      }
    } catch (error) {
      this.logger.error(`LPAY创建订单异常: ${error.message}`, error.stack);
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
    this.logger.log(`LPAY查询订单: ${paymentNo}`);

    try {
      // 构建查询参数
      const requestData: any = {
        api_key: this.channelConfig.platformKey,
        merchant_order_no: paymentNo,
      };

      // 生成签名
      requestData.sign = this.generateSign(requestData, this.channelConfig.platformSecret);

      // 调用查询API
      const apiUrl = `${this.channelConfig.apiBaseUrl}/api/${this.channelConfig.apiVersion}/pay/query`;
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData),
      );

      if (response.data.code === 1) {
        const responseData = response.data.data;
        
        // 状态映射：0→待支付, 1→已支付, 2→失败, 3→退款
        const statusMap: Record<number, PaymentStatus> = {
          0: PaymentStatus.PENDING,
          1: PaymentStatus.SUCCESS,
          2: PaymentStatus.FAILED,
          3: PaymentStatus.REFUNDED,
        };

        return {
          success: true,
          status: statusMap[responseData.status] || PaymentStatus.PENDING,
          paidTime: responseData.status === 1 ? new Date() : undefined, // 文档未提供支付时间
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
      this.logger.error(`LPAY查询订单异常: ${error.message}`, error.stack);
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
   * 处理支付回调
   */
  async handleNotify(data: any): Promise<NotifyResult> {
    this.logger.log(`LPAY处理回调: ${data.merchant_order_no}`);

    // 验证签名
    if (!this.verifyNotify({ ...data })) {
      this.logger.error('LPAY回调签名验证失败');
      return {
        success: false,
        paymentNo: data.merchant_order_no,
        status: PaymentStatus.FAILED,
        errorMsg: '签名验证失败',
      };
    }

    // 状态映射：0→待支付, 1→已支付, 2→失败, 3→退款
    const statusMap: Record<number, PaymentStatus> = {
      0: PaymentStatus.PENDING,
      1: PaymentStatus.SUCCESS,
      2: PaymentStatus.FAILED,
      3: PaymentStatus.REFUNDED,
    };

    return {
      success: true,
      paymentNo: data.merchant_order_no,
      status: statusMap[data.status] || PaymentStatus.PENDING,
    };
  }

  /**
   * 生成签名
   * 根据LPAY文档签名规则：
   * 1. 将所有请求参数（除sign外）按参数名ASCII码从小到大排序
   * 2. 为空参数不参与签名
   * 3. 将排序后的参数用&连接成字符串
   * 4. 在字符串末尾加上&和商户密钥
   * 5. 对整个字符串进行MD5加密并转大写
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
}
