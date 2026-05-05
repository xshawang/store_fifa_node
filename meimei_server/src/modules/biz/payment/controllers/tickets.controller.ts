import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, Logger,UseInterceptors } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { Keep } from 'src/common/decorators/keep.decorator';
import { CreateTicketsDto } from '../dto/create-tickets.dto';
import { OrderService } from '../../order/order.service';
import { CookieService } from '../../cart/cart-cookie.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliverEntity } from '../entities/deliver.entity';
import { CheckoutTemplateService } from './../../order/checkout-template.service'
import { FacebookEventService } from './../../order/facebook-event.service'
import { SharedService } from 'src/shared/shared.service'
import { PaymentService } from './../services/payment.service'
import { convertToBrl } from './../../../../common/utils';
import { FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express'
/**
 * 票务订单控制器
 * 处理 /checkout/tickets 接口
 */
@ApiTags('Tickets')
@Controller()
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly cookieService: CookieService,
    private readonly checkoutTemplateService: CheckoutTemplateService,
    private readonly facebookEventService: FacebookEventService,
    private readonly sharedService: SharedService,
    private readonly paymentService: PaymentService,
    @InjectRepository(DeliverEntity)
    private readonly deliverRepository: Repository<DeliverEntity>,
  ) {}

  /**
   * 票务订单创建接口
   * POST /checkout/tickets
   */
  @Post('/checkout/tickets')
  @Public()
  @Keep()
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: '创建票务订单' })
  async createTicketsOrder(
    @Body() dto: CreateTicketsDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const ipAddress = this.sharedService.getReqIP(request);
    this.logger.log('==================== /checkout/tickets 请求 ====================', ipAddress);
    this.logger.log(`接收到入参: ${JSON.stringify(dto)}`, ipAddress);

    try {
      // 1. 验证用户ID
      this.validateUserId(dto);

      // 2. 解析订单数据
      const { orderSummary, orderImgs } = this.parseOrderData(dto, ipAddress);

      // 3. 计算物品数量
      const itemCount = Math.ceil(orderSummary.length / 5);
      this.logger.log(`物品数量: ${itemCount}`, ipAddress);

      // 4. 生成订单号
      const orderNo = this.orderService.generateOrderNo();
      this.logger.log(`生成订单号: ${orderNo}`, ipAddress);

      // 5. 创建订单主表
      const orderEntity = await this.createOrderEntity(orderNo, dto);

      // 6. 创建订单项并计算总金额
      const { orderItems, totalAmount } = await this.createOrderItems(
        orderEntity,
        orderNo,
        orderSummary,
        orderImgs,
        itemCount,
        ipAddress,
      );

      // 7. 更新订单总金额
      await this.updateOrderAmount(orderEntity, totalAmount);

      // 8. 保存收货信息
      await this.saveDeliveryInfo(orderNo, dto);

      // 9. 异步推送 Facebook 事件
      this.sendFacebookEventAsync(orderEntity, orderItems, ipAddress, request);

      // 10. 创建支付订单并跳转
      await this.createPaymentAndRedirect(orderEntity, dto, ipAddress, response);
    } catch (error) {
      this.logger.error(`创建票务订单失败: ${error.message}`, error.stack);
      return response.status(500).json({
        success: false,
        message: `订单创建失败: ${error.message}`,
      });
    }
  }

  /**
   * 验证用户ID
   */
  private validateUserId(dto: CreateTicketsDto): void {
    if (!dto.uid) {
      this.logger.error('用户 uid 不存在');
      throw new Error('用户未登录,请刷新页面重试');
    }
    this.logger.log(`用户 uid: ${dto.uid}`);
  }

  /**
   * 解析订单数据
   */
  private parseOrderData(dto: CreateTicketsDto, ipAddress: string): { orderSummary: string[]; orderImgs: string[] } {
    // 解析订单摘要
    let orderSummary: string[] = [];
    try {
      orderSummary = JSON.parse(dto.fifaShowOrderSummary) as string[];
      if (!Array.isArray(orderSummary) || orderSummary.length === 0) {
        throw new Error('fifaShowOrderSummary 必须是非空数组');
      }
    } catch (error) {
      this.logger.error(`fifaShowOrderSummary 解析失败: ${error.message}`, ipAddress);
      throw new Error('订单数据格式错误');
    }

    // 解析图片数组
    let orderImgs: string[] = [];
    if (dto.fifaShowOrderSummaryImgs) {
      try {
        orderImgs = JSON.parse(dto.fifaShowOrderSummaryImgs) as string[];
        if (!Array.isArray(orderImgs)) {
          orderImgs = [];
        }
      } catch (error) {
        this.logger.warn(`fifaShowOrderSummaryImgs 解析失败: ${error.message}`, ipAddress);
        orderImgs = [];
      }
    }

    this.logger.log(`订单摘要: ${JSON.stringify(orderSummary)}, 图片: ${JSON.stringify(orderImgs)}`, ipAddress);
    return { orderSummary, orderImgs };
  }

  /**
   * 创建订单主表
   */
  private async createOrderEntity(orderNo: string, dto: CreateTicketsDto): Promise<any> {
    const orderEntity = this.orderService['orderRepository'].create({
      orderNo,
      userId: dto.uid,
      token: '',
      orderStatus: 0,
      paymentStatus: 0,
      subtotalAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
      currency: 'USD',
      email: dto.email,
      firstName: dto['first-name'],
      lastName: dto['last-name'],
      fullName: `${dto['first-name']} ${dto['last-name']}`,
      phone: dto.phone,
      address1: dto.address,
      address2: dto.address2 || '',
      city: dto.city,
      province: dto.state,
      postalCode: dto.zip,
      country: dto.country,
      paymentMethod: dto.paymentmethod_select || dto.paymentmethod || '',
    });

    await this.orderService['orderRepository'].save(orderEntity);
    this.logger.log(`订单创建成功: ${orderNo}`);
    return orderEntity;
  }

  /**
   * 创建订单项并计算总金额
   */
  private async createOrderItems(
    orderEntity: any,
    orderNo: string,
    orderSummary: string[],
    orderImgs: string[],
    itemCount: number,
    ipAddress: string,
  ): Promise<{ orderItems: any[]; totalAmount: number }> {
    const orderItems = [];
    let totalAmount = 0;

    for (let i = 0; i < itemCount; i++) {
      const startIndex = i * 5;
      const endIndex = Math.min(startIndex + 5, orderSummary.length);
      const itemElements = orderSummary.slice(startIndex, endIndex);

      // 解析物品信息
      const { productName, salePrice, quantity, variantName } = this.parseItemInfo(itemElements, i);
      const productImage = orderImgs[i] || '';
      const subtotalAmount = salePrice * quantity;
      totalAmount += subtotalAmount;

      this.logger.log(`物品 ${i + 1}: ${productName}, 价格: $${salePrice}, 数量: ${quantity}, 小计: $${subtotalAmount}`, ipAddress);

      // 创建订单项
      const orderItemEntity = this.orderService['orderItemRepository'].create({
        orderId: orderEntity.orderId,
        orderNo,
        itemId: 0,
        productId: 0,
        skuId: 0,
        variantId: '',
        productName,
        variantName,
        quantity,
        salePrice,
        subtotalAmount,
        productImage,
        productUrl: productImage,
        skuCode: '',
        size: '',
        color: '',
      });

      await this.orderService['orderItemRepository'].save(orderItemEntity);
      orderItems.push(orderItemEntity);
    }

    this.logger.log(`订单项创建成功: ${orderItems.length} 个物品, 总金额: $${totalAmount}`, ipAddress);
    return { orderItems, totalAmount };
  }

  /**
   * 解析物品信息
   */
  private parseItemInfo(itemElements: string[], index: number): {
    productName: string;
    salePrice: number;
    quantity: number;
    variantName: string;
  } {
    const productName = itemElements[0] || `票务物品 ${index + 1}`;

    // 解析价格 (第4个元素,索引3): "$450.00"
    let salePrice = 0;
    if (itemElements.length > 3 && itemElements[3]) {
      const priceStr = itemElements[3].replace(/[^\d.]/g, '');
      salePrice = parseFloat(priceStr);
    }

    // 解析数量 (第5个元素,索引4): "Qty: 2"
    let quantity = 1;
    if (itemElements.length > 4 && itemElements[4]) {
      const qtyMatch = itemElements[4].match(/\d+/);
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[0]);
      }
    }

    const variantName = itemElements.slice(1, 3).join(', ');

    return { productName, salePrice, quantity, variantName };
  }

  /**
   * 更新订单总金额
   */
  private async updateOrderAmount(orderEntity: any, totalAmount: number): Promise<void> {
    orderEntity.totalAmount = totalAmount;
    orderEntity.subtotalAmount = totalAmount;
    await this.orderService['orderRepository'].save(orderEntity);
    this.logger.log(`订单金额更新成功: $${totalAmount}`);
  }

  /**
   * 保存收货信息
   */
  private async saveDeliveryInfo(orderNo: string, dto: CreateTicketsDto): Promise<void> {
    const deliver = this.deliverRepository.create({
      orderNo,
      userId: dto.uid,
      recipientName: `${dto['first-name']} ${dto['last-name']}`,
      recipientPhone: dto.phone,
      recipientEmail: dto.email,
      country: dto.country,
      countryCode: '',
      province: dto.state,
      city: dto.city,
      district: '',
      address: dto.address,
      postalCode: dto.zip,
      company: dto.company || '',
      addressLine1: dto.address,
      addressLine2: dto.address2 || '',
      isDefault: false,
      remark: dto.instructions || '',
    });

    await this.deliverRepository.save(deliver);
    this.logger.log(`收货信息保存成功: ${deliver.id}`);
  }

  /**
   * 异步推送 Facebook 事件
   */
  private sendFacebookEventAsync(
    orderEntity: any,
    orderItems: any[],
    ipAddress: string,
    request: Request,
  ): void {
    const userAgent = (request.headers['user-agent'] as string) || '';
    this.facebookEventService.sendPurchaseEvent(
      {
        orderNo: orderEntity.orderNo,
        totalAmount: orderEntity.totalAmount,
        currency: orderEntity.currency,
        items: orderItems.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          salePrice: item.salePrice,
        })),
      },
      ipAddress,
      userAgent,
      request.get('host'),
    );
  }

  /**
   * 创建支付订单并跳转
   */
  private async createPaymentAndRedirect(
    orderEntity: any,
    dto: CreateTicketsDto,
    ipAddress: string,
    response: Response,
  ): Promise<void> {
    this.logger.log(`开始创建支付订单: ${orderEntity.orderNo}`, ipAddress);

    const paymentResult = await this.paymentService.createPayment({
      orderNo: orderEntity.orderNo,
      amount: convertToBrl(orderEntity.totalAmount, 'USD').brl,
      currency: 'BRL',
      paymentMethod: 'PIX_BRL',
      userId: dto.uid,
      email: dto.email,
    });

    if (!paymentResult || !paymentResult.success) {
      this.logger.error(`支付订单创建失败: ${paymentResult?.message}`, ipAddress);
      return response.redirect('/checkout/payment/pix?v=' + orderEntity.orderNo);
    }

    this.logger.log(`支付订单创建成功: ${paymentResult.paymentNo}, 支付地址: ${paymentResult.payUrl}`, ipAddress);
    return response.redirect(paymentResult.payUrl);
  }
}
