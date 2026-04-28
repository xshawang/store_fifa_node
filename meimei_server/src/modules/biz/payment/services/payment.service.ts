import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentOrderEntity } from '../entities/payment-order.entity';
import { PaymentChannelEntity } from '../entities/payment-channel.entity';
import { DeliverEntity } from '../entities/deliver.entity';
import { PaymentStrategy } from '../interfaces/payment-strategy.interface';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import {Order} from '../../order/entities/order.entity';
import {OrderItem} from '../../order/entities/order-item.entity';
/**
 * 支付核心服务
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentOrderEntity)
    private readonly paymentOrderRepo: Repository<PaymentOrderEntity>,

    @InjectRepository(PaymentChannelEntity)
    private readonly paymentChannelRepo: Repository<PaymentChannelEntity>,

    @InjectRepository(DeliverEntity)
    private readonly deliverRepo: Repository<DeliverEntity>,

    @Inject('PAYMENT_STRATEGIES')
    private readonly strategies: PaymentStrategy[],

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,

  ) {}

  /**
   * 创建支付订单
   * 调用方只需提供基本支付信息，通道信息由本方法自动选择和附加
   */
  async createPayment(dto: CreatePaymentDto) {
    //目前都是BRL支付
    dto.currency = 'BRL';
    this.logger.log(`创建支付订单: ${dto.orderNo} ${dto.userId} ${dto.amount} ${dto.currency} ${dto.paymentMethod}`);

    // 1. 查询订单是否存在
    const order = await this.getOrderInfo(dto.orderNo);
    if (!order) {
      // throw new Error(`订单不存在: ${dto.orderNo}`);
      return {
          success: false,
          message: `订单不存在: ${dto.orderNo}`,
        };
    }

    // 2. 自动选择支付通道（根据支付方式和金额、货币）
    const channel = await this.selectPaymentChannel(
      dto.amount,
      dto.currency,
      dto.paymentMethod,
    );

    if (!channel) {
      //throw new Error(`没有找到合适的支付通道，支付方式: ${dto.paymentMethod}`);
      return {
          success: false,
          message: `没有找到合适的支付通道，支付方式: ${dto.paymentMethod}`,
        };
    }

    this.logger.log(`自动选择支付通道: ${channel.channelCode} - ${channel.channelName}`);
    this.logger.log(`通道通知地址: ${channel.notifyUrl}`);

    // 3. 创建支付订单记录（自动附加通道信息）
    const paymentOrder = new PaymentOrderEntity();
    paymentOrder.paymentNo = this.generatePaymentNo();
    paymentOrder.orderNo = dto.orderNo;
    paymentOrder.userId = dto.userId;
    paymentOrder.amount = dto.amount;
    paymentOrder.currency = dto.currency;
    paymentOrder.status = 0; // 待支付
    paymentOrder.paymentChannel = channel.channelCode;  // 自动附加
    paymentOrder.paymentMethod = dto.paymentMethod;
    paymentOrder.maxRetry = 3;
    paymentOrder.retryCount = 0;

    await this.paymentOrderRepo.save(paymentOrder);

    const strategy = this.strategies.find(
      (s) => s.getChannelCode() === channel.channelCode,
    );

    
    if (!strategy) {
      //throw new Error(`支付策略未找到: ${channel.channelCode}`);
       return {
          success: false,
          message: `支付策略未找到: ${channel.channelCode}`,
        };
      
    }

    strategy.setChannelConfig({
      channelCode: channel.channelCode,
      channelName: channel.channelName,
      channelType: channel.channelType,
      platformKey: channel.platformKey,
      platformSecret: channel.platformSecret,
      siteCode: channel.siteCode,
      apiBaseUrl: channel.apiBaseUrl,
      apiVersion: channel.apiVersion,
      notifyUrl: channel.notifyUrl,
      supportedCurrencies: channel.supportedCurrencies,
      supportedMethods: channel.supportedMethods,
      minAmount: channel.minAmount,
      maxAmount: channel.maxAmount,
      feeRate: channel.feeRate,
      isActive: channel.isActive,
      priority: channel.priority,
      sortOrder: channel.sortOrder,
    });
    // 5. 调用第三方支付API（自动使用通道的
   // 4. 获取对应的支付策略notifyUrl）
    try {
      const result = await strategy.createPayment({
        orderNo: paymentOrder.paymentNo,//不使用订单编号，而是使用支付订单编号
        amount: dto.amount,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        notifyUrl: channel.notifyUrl,  // 自动附加通道配置的通知地址
        // 传递信用卡信息（如果有）
        cardNumber: dto.cardNumber,
        cardExpiry: dto.cardExpiry,
        cardCvv: dto.cardCvv,
        cardHolderName: dto.cardHolderName,
        // 传递 PIX 支付信息（如果有）
        cpf: dto.cpf,
        email: dto.email 
      });

      if (result.success) {
        // 更新支付订单
        paymentOrder.thirdPaymentNo = result.thirdPaymentNo;
        paymentOrder.payUrl = result.payUrl;
        paymentOrder.qrCode = result.qrCode;
        paymentOrder.expireTime = result.expireTime;
        paymentOrder.status = 1; // 支付中
        paymentOrder.responseData = result.rawData;

        await this.paymentOrderRepo.save(paymentOrder);

        return {
          success: true,
          paymentNo: paymentOrder.paymentNo,
          payUrl: result.payUrl,
          qrCode: result.qrCode,
          expireTime: result.expireTime,
          channelCode: channel.channelCode,  // 返回使用的通道代码
          channelName: channel.channelName,  // 返回通道名称
        };
      } else {
        // 支付创建失败
        paymentOrder.status = 3; // 支付失败
        paymentOrder.errorMsg = result.errorMsg;
        await this.paymentOrderRepo.save(paymentOrder);

        //throw new Error(`创建支付失败: ${result.errorMsg}`);
        return {
          success: false,
          message: result.errorMsg,
        };
      }
    } catch (error) {
      this.logger.error(`创建支付异常: ${error.message}`, error.stack);

      // 更新支付订单状态
      paymentOrder.status = 3;
      paymentOrder.errorMsg = error.message;
      await this.paymentOrderRepo.save(paymentOrder);

       return {
          success: false,
          message: error.message,
        };
    }
  }

  /**
   * 查询支付状态
   */
  async queryPayment(paymentNo: string) {
    const paymentOrder = await this.paymentOrderRepo.findOne({
      where: { paymentNo },
    });

    if (!paymentOrder) {
      throw new Error(`支付订单不存在: ${paymentNo}`);
    }

    // 获取支付策略
    const strategy = this.strategies.find(
      (s) => s.getChannelCode() === paymentOrder.paymentChannel,
    );

    if (!strategy) {
      throw new Error(`支付策略未找到: ${paymentOrder.paymentChannel}`);
    }

    // 查询第三方支付状态
    const result = await strategy.queryPayment(paymentNo);

    // 更新本地状态
    if (result.success && result.status === 2) {
      paymentOrder.status = 2; // 支付成功
      paymentOrder.paidTime = result.paidTime;
      await this.paymentOrderRepo.save(paymentOrder);
    }

    return {
      paymentNo: paymentOrder.paymentNo,
      status: paymentOrder.status,
      paidTime: paymentOrder.paidTime,
    };
  }

  /**
   * 选择支付通道
   */
  private async selectPaymentChannel(
    amount: number,
    currency: string,
    paymentMethod: string,
  ): Promise<PaymentChannelEntity | null> {
    // 查询所有启用的通道
    const channels = await this.paymentChannelRepo.find({
      where: { isActive: true, channelType: paymentMethod },
      order: { priority: 'ASC' },
    });

    // 过滤支持的通道
    const supported = channels.filter((ch) => {
      const supportCurrency = ch.supportedCurrencies.includes(currency);
      const amountValid = amount >= ch.minAmount && amount <= ch.maxAmount;
      return supportCurrency  && amountValid;
    });

    if (supported.length === 0) {
      return null;
    }

    return supported[0];
  }

  /**
   * 生成支付订单号
   */
  private generatePaymentNo(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `PAY${timestamp}${random}`;
  }

  /**
   * 保存收件信息
   */
  async saveDeliverInfo(data: {
    orderNo: string;
    userId: string;
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
    countryCode: string;
    country: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
    addressLine1: string;
    addressLine2: string;
    remark:string
  }): Promise<DeliverEntity> {
    this.logger.log(`保存收件信息: ${data.orderNo}`);

    // 检查是否已存在
    const existing = await this.deliverRepo.findOne({
      where: { orderNo: data.orderNo },
    });

    if (existing) {
      // 更新
      if(data.recipientName !== undefined && data.recipientName !== null && data.recipientName.length > 2){
        existing.recipientName = data.recipientName;
      }
      if(data.recipientPhone !== undefined && data.recipientPhone !== null && data.recipientPhone.length > 2){
        existing.recipientPhone = data.recipientPhone;
      }
      if(data.countryCode !== undefined && data.countryCode !== null && data.countryCode.length > 2){
        existing.countryCode = data.countryCode;
      }
      if(data.country !== undefined && data.country !== null && data.country.length > 2){
        existing.country = data.country;
      }
      if(data.province !== undefined && data.province !== null && data.province.length > 2){
        existing.province = data.province;
      }
      if(data.city !== undefined && data.city !== null && data.city.length > 2){
        existing.city = data.city;
      }
      if(data.addressLine1 !== undefined && data.addressLine1 !== null && data.addressLine1.length > 2){
        existing.addressLine1 = data.addressLine1;
      }
      if(data.addressLine2 !== undefined && data.addressLine2 !== null && data.addressLine2.length > 2){
        existing.addressLine2 = data.addressLine2;
      }
      if(data.postalCode !== undefined && data.postalCode !== null && data.postalCode.length > 2){
        existing.postalCode = data.postalCode;
      }
      if(data.addressLine1 !== undefined && data.addressLine1 !== null && data.addressLine1.length > 2){
        existing.addressLine1 = data.addressLine1;
      }
      if(data.remark !== undefined && data.remark !== null && data.remark.length > 20){
        existing.remark = data.remark;
      }
      if(data.addressLine2 !== undefined && data.addressLine2 !== null && data.addressLine2.length > 2){
        existing.addressLine2 = data.addressLine2;
      }
      if(data.address !== undefined && data.address !== null && data.address.length > 2){
        existing.address = data.address;
      }
      if(data.remark !== undefined && data.remark !== null && data.remark.length > 20){
        existing.remark = data.remark;
      }
      existing.updatedAt = new Date();
      return await this.deliverRepo.save(existing);
    } else {
      // 创建
      const deliver = new DeliverEntity();
      deliver.orderNo = data.orderNo;
      deliver.userId = data.userId;
      deliver.recipientName = data.recipientName;
      deliver.recipientPhone = data.recipientPhone;
      deliver.recipientEmail = data.recipientEmail;
      deliver.countryCode = data.countryCode;
      deliver.country = data.country;
      deliver.province = data.province;
      deliver.city = data.city;
      deliver.address = data.address;
      deliver.postalCode = data.postalCode;
      deliver.addressLine1 = data.addressLine1;
      deliver.addressLine2 = data.addressLine2;
      deliver.isDefault = false;
      deliver.remark = data.remark;
      return await this.deliverRepo.save(deliver);
    }
  }

  /**
   * 获取订单信息（公开方法）
   */
  async getOrderInfo(orderNo: string): Promise<any> {
    // TODO: 从订单服务获取订单信息
    // 这里简化处理，实际应该注入OrderService
    // 示例： 
    // orderNo: string
    // orderId: number
    // items: Array<{
    //   productName: string
    //   variantName: string
    //   quantity: number
    //   salePrice: number
    //   subtotalAmount: number
    //   productImage: string
    //   productUrl: string
    // }>
    // totalAmount: number
    // itemCount: number
    // currency: string
    const order = await this.orderRepo.findOne({ where: { orderNo } });
    const items = await this.orderItemRepo.find({ where: { orderNo } });
    return {
      orderNo: order.orderNo,
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      itemCount: items.length,
      currency: order.currency,
      items: items,
    };

    
  }

  /**
   * 选择信用卡支付通道（优先级最高）
   */
  async selectCreditCardChannel(
    amount: number,
    currency: string,
  ): Promise<PaymentChannelEntity | null> {
    this.logger.log('选择信用卡支付通道');

    // 查询所有启用的信用卡通道
    const channels = await this.paymentChannelRepo.find({
      where: {
        isActive: true,
        channelType: 'CREDIT_CARD',
      },
      order: { priority: 'ASC' },
    });

    // 过滤支持的通道
    const supported = channels.filter((ch) => {
      const supportCurrency = ch.supportedCurrencies.includes(currency);
      const amountValid = amount >= ch.minAmount && amount <= ch.maxAmount;

      return supportCurrency && amountValid;
    });

    if (supported.length === 0) {
      this.logger.warn('没有找到可用的信用卡通道');
      return null;
    }

    // 返回优先级最高的通道
    return supported[0];
  }
}
