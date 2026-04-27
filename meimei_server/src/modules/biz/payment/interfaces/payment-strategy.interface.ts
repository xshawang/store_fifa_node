/**
 * 支付通道策略接口
 * 所有支付通道必须实现此接口
 */

export interface PaymentStrategy {
  /**
   * 获取通道编码
   */
  getChannelCode(): string;

  /**
   * 获取通道类型
   */
  getChannelType(): string;

  /**
   * 创建支付订单
   * @param params 支付参数
   */
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;

  /**
   * 查询支付状态
   * @param paymentNo 支付订单号
   */
  queryPayment(paymentNo: string): Promise<QueryPaymentResult>;

  /**
   * 验证回调签名
   * @param data 回调数据
   */
  verifyNotify(data: any): boolean;

  /**
   * 处理支付回调
   * @param data 回调数据
   */
  handleNotify(data: any): Promise<NotifyResult>;

  /**
   * 是否支持该货币
   * @param currency 货币代码
   */
  supportCurrency(currency: string): boolean;

  /**
   * 是否支持该支付方式
   * @param method 支付方式
   */
  supportMethod(method: string): boolean;

  /**
   * 获取优先级（数字越小优先级越高）
   */
  getPriority(): number;
}

/**
 * 创建支付订单参数
 */
export interface CreatePaymentParams {
  orderNo: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  notifyUrl: string;
  subject?: string;
  body?: string;
  [key: string]: any;
}

/**
 * 创建支付订单结果
 */
export interface CreatePaymentResult {
  success: boolean;
  paymentNo: string;
  thirdPaymentNo?: string;
  payUrl?: string;
  qrCode?: string;
  expireTime?: Date;
  errorMsg?: string;
  rawData?: any;
}

/**
 * 查询支付状态结果
 */
export interface QueryPaymentResult {
  success: boolean;
  status: PaymentStatus;
  paidTime?: Date;
  errorMsg?: string;
  rawData?: any;
}

/**
 * 支付状态枚举
 */
export enum PaymentStatus {
  PENDING = 0,      // 待支付
  PAYING = 1,       // 支付中
  SUCCESS = 2,      // 支付成功
  FAILED = 3,       // 支付失败
  CANCELLED = 4,    // 已取消
  REFUNDED = 5,     // 已退款
}

/**
 * 回调处理结果
 */
export interface NotifyResult {
  success: boolean;
  paymentNo: string;
  status: PaymentStatus;
  errorMsg?: string;
}

/**
 * 支付通道配置
 */
export interface ChannelConfig {
  channelCode: string;
  channelName: string;
  channelType: string;
  platformKey: string;
  platformSecret: string;
  siteCode?: string;
  apiBaseUrl: string;
  apiVersion: string;
  notifyUrl: string;
  supportedCurrencies: string[];
  supportedMethods: string[];
  minAmount: number;
  maxAmount: number;
  feeRate: number;
  isActive: boolean;
  priority: number;
  sortOrder: number;
  config?: Record<string, any>;
}
