import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  PaymentStrategy,
  CreatePaymentParams,
  CreatePaymentResult,
  QueryPaymentResult,
  NotifyResult,
  PaymentStatus,
  ChannelConfig,
} from '../interfaces/payment-strategy.interface';

/**
 * EYPAY 支付通道策略
 * 支持 PIX 支付，使用 RSA 签名验证
 */
@Injectable()
export class EYPayStrategy implements PaymentStrategy {
  private readonly logger = new Logger(EYPayStrategy.name);
  private channelConfig: ChannelConfig;

   


  // 平台公钥（用于验签）- 需要从 EYPAY 获取
  // 注意：文档中没有提供平台公钥，实际使用时需要向 EYPAY 获取
  private readonly platformPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlee9VLToY5dhZilBk9d2
Q6sLDg82Mb3wDISvrIURhVYYN3PHL3Yo6LW2mo+avuzR7GUlYXjExXrO8BZV/oKT
r3R9fJFx9pNMePb6X8KLH7Lau0BpV7sHucCdoFI0k6vtTklOYSkNrybROl2wdWiK
yTZxiuo+Nv9aPzAk9hfFdJpofRAl3YzeGvTSqq2scT7MN9SExYgrobBgG32RMBEX
WjI+wMQvtvVfahAxZAQ0Mqmfb0xfGkFN8rPbBFH9B8gG3utfWZknWhCQe1UmU919
fpw3brRN8Xqgr1r2W1JgNTFFvYEJ0zXp1FCP6CoGgnY1pANpM9PF4X/eVBChP+K1
pQIDAQAB
-----END PUBLIC KEY-----`

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
      channelCode: 'EY_PAY',
      channelName: 'EYPAY支付',
      channelType: 'PIX',
      platformKey: process.env.EYPAY_PLATFORM_KEY || '23710e8678a74fc0b91f479d730eb3f9',
      platformSecret: process.env.EYPAY_PLATFORM_SECRET || '',
      siteCode: process.env.EYPAY_SITE_CODE || '',
      apiBaseUrl: process.env.EYPAY_API_BASE_URL || 'https://api.eypays.com',
      apiVersion: 'v1',
      notifyUrl: process.env.EYPAY_NOTIFY_URL || 'https://store.fif.com/api/payment/notify/eypay',
      supportedCurrencies: ['BRL'],
      supportedMethods: ['PIX'],
      minAmount: 1.0,
      maxAmount: 999999.99,
      feeRate: 0.015, // EYPAY 费率
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
    this.logger.log(`EYPAY创建订单: ${params.orderNo}`);

    try {
      // 构建请求体参数
      const requestBody = {
        product_desc: params.body || params.subject || 'Payment',
        user_ip: params.userIp || '127.0.0.1', // 需要从请求中获取真实IP
        amount: Math.round(params.amount * 100).toString(), // 转为分，字符串格式
        time_start: this.formatTimeStart(new Date()),
        description: params.body || params.subject || 'Payment',
        trade_type: 'pix',
        notify_url: params.notifyUrl,
        merchant_order_no: params.orderNo,
        product_title: params.subject || 'Payment',
      };

      // 生成签名所需的 header 参数
      const nonce = this.generateNonce();
      const timestamp = Date.now().toString(); // 13位时间戳
      const authorization = this.channelConfig.platformKey;

      // 组装签名数据
      const signData = `POST\n${nonce}\n${timestamp}\n${authorization}\n${JSON.stringify(requestBody)}`;
      this.logger.debug(`EYPAY签名数据: ${signData}`);
      // 生成签名
      const sign = this.rsaSign(signData, this.channelConfig.platformSecret);
      this.logger.debug(`EYPAY签名: ${sign}`);
      // 设置请求头
      const headers = {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': authorization,
        'nonce': nonce,
        'timestamp': timestamp,
        'sign': sign,
      };

      this.logger.debug(`EYPAY请求参数: ${JSON.stringify(requestBody)}`);
      this.logger.debug(`EYPAY签名数据: ${signData}`);

      // 调用API
      const apiUrl = `${this.channelConfig.apiBaseUrl}/merchant-api/${this.channelConfig.apiVersion}/order/create`;
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestBody, { headers }),
      );

      this.logger.debug(`EYPAY响应数据: ${JSON.stringify(response.data)}`);

      // 验证响应签名
      const responseHeaders = response.headers;
      const responseSign = responseHeaders['sign'] || responseHeaders['Sign'];
      if (responseSign) {
        const responseSignData = `${responseHeaders['nonce']}\n${responseHeaders['timestamp']}\n${responseHeaders['authorization'] || responseHeaders['Authorization']}\n${JSON.stringify(response.data)}`;
        
        if (!this.rsaVerify(responseSignData, responseSign, this.platformPublicKey)) {
          this.logger.error('EYPAY响应签名验证失败');
          return {
            success: false,
            paymentNo: params.orderNo,
            errorMsg: '响应签名验证失败',
          };
        }
      }

      // 处理响应
      const responseData = response.data;
      if (responseData.return_code === 'SUCCESS') {
        // 从 credential 中提取支付信息
        const credential = responseData.credential || {};
        const payUrl = credential.cashierUrl || '';
        const qrCode = credential.pix || '';

        return {
          success: true,
          paymentNo: params.orderNo,
          thirdPaymentNo: responseData.order_no,
          payUrl: payUrl,
          qrCode: qrCode,
          expireTime: this.calculateExpireTime(),
          rawData: responseData,
        };
      } else {
        return {
          success: false,
          paymentNo: params.orderNo,
          errorMsg: responseData.return_msg || '创建支付失败',
        };
      }
    } catch (error) {
      this.logger.error(`EYPAY创建订单异常: ${error.message}`, error.stack);
      return {
        success: false,
        paymentNo: params.orderNo,
        errorMsg: `创建支付异常: ${error.message}`,
      };
    }
  }

  /**
   * 查询支付状态
   */
  async queryPayment(paymentNo: string): Promise<QueryPaymentResult> {
    this.logger.log(`EYPAY查询订单: ${paymentNo}`);

    try {
      // 注意：文档中没有提供查询接口，这里需要根据实际API实现
      // 目前返回待支付状态
      return {
        success: true,
        status: PaymentStatus.PENDING,
      };
    } catch (error) {
      this.logger.error(`EYPAY查询订单异常: ${error.message}`, error.stack);
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
    try {
      // EYPAY 回调验证逻辑
      // 根据文档，回调数据需要验签
      // 这里需要根据实际的回调格式来实现
      
      // 假设回调数据包含签名信息
      const sign = data.sign;
      if (!sign) {
        this.logger.warn('EYPAY回调缺少签名');
        return false;
      }

      // 构建验签数据
      // 根据文档格式：nonce+'\n'+timestamp+'\n'+Authorization+'\n'+response_data
      const signData = `${data.nonce}\n${data.timestamp}\n${data.authorization}\n${JSON.stringify(data.payload || {})}`;

      // 验签
      return this.rsaVerify(signData, sign, this.platformPublicKey);
    } catch (error) {
      this.logger.error(`EYPAY验证回调签名异常: ${error.message}`);
      return false;
    }
  }

  /**
   * 处理支付回调
   */
  async handleNotify(data: any): Promise<NotifyResult> {
    try {
      this.logger.log(`EYPAY处理回调: ${JSON.stringify(data)}`);

      // 验证签名
      if (!this.verifyNotify(data)) {
        this.logger.error('EYPAY回调签名验证失败');
        return {
          success: false,
          paymentNo: '',
          status: PaymentStatus.FAILED,
          errorMsg: '签名验证失败',
        };
      }

      // 验证 IP 白名单
      // const clientIp = data.user_ip;
      // if (!this.allowedCallbackIPs.includes(clientIp)) {
      //   this.logger.warn(`EYPAY回调IP不在白名单: ${clientIp}`);
      //   return {
      //     success: false,
      //     paymentNo: '',
      //     status: PaymentStatus.FAILED,
      //     errorMsg: 'IP不在白名单',
      //   };
      // }

      // 解析回调数据
      const paymentNo = data.merchant_order_no;
      const status = data.status; // SUCCESS, PROCESSING 等

      // 状态映射
      let paymentStatus: PaymentStatus;
      switch (status) {
        case 'SUCCESS':
          paymentStatus = PaymentStatus.SUCCESS;
          break;
        case 'PROCESSING':
          paymentStatus = PaymentStatus.PAYING;
          break;
        case 'FAILED':
        case 'CLOSED':
          paymentStatus = PaymentStatus.FAILED;
          break;
        default:
          paymentStatus = PaymentStatus.PENDING;
      }

      return {
        success: true,
        paymentNo: paymentNo,
        status: paymentStatus,
      };
    } catch (error) {
      this.logger.error(`EYPAY处理回调异常: ${error.message}`);
      return {
        success: false,
        paymentNo: '',
        status: PaymentStatus.FAILED,
        errorMsg: error.message,
      };
    }
  }

  /**
   * RSA 签名
   */
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

  /**
   * RSA 验签
   */
  private rsaVerify(data: string, signature: string, publicKey: string): boolean {
    try {
      if (!publicKey) {
        this.logger.warn('平台公钥未配置，跳过验签');
        return true; // 临时跳过验签，实际使用时必须配置公钥
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

  /**
   * 生成随机字符串（8-128位，字母数字组成）
   */
  private generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = Math.floor(Math.random() * 121) + 8; // 8-128位
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 格式化时间开始时间（yyyyMMddHHmmss）
   */
  private formatTimeStart(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * 计算过期时间（默认30分钟）
   */
  private calculateExpireTime(): Date {
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 30);
    return expireTime;
  }
}
