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
    try {
      const ipAddress = this.sharedService.getReqIP(request);
      this.logger.log('==================== /checkout/tickets 请求 ====================',ipAddress);
      this.logger.log(`接收到入参: ${JSON.stringify(dto)}`,ipAddress);

      // 1. 从 cookie 获取用户 uid
   
      
      if (!dto.uid) {
        this.logger.error('用户 uid 不存在');
        return response.status(400).json({
          success: false,
          message: '用户未登录,请刷新页面重试',
        });
      }

      this.logger.log(`用户 uid: ${dto.uid}`,ipAddress);

      // 2. 解析订单摘要 (每5个元素为一个物品)
      let orderSummary = [] as string[];
      try {
        // 先尝试直接解析
        try {
          this.logger.log(`尝试直接解析订单摘要: `,typeof dto.fifaShowOrderSummary);
          orderSummary = JSON.parse(dto.fifaShowOrderSummary) as string[];
        } catch {
          orderSummary =[] as string[];
        }
        
        this.logger.log(`订单摘要: ${JSON.stringify(orderSummary)}  ${JSON.stringify(dto.fifaShowOrderSummaryImgs)}`, ipAddress);
        
        if (!Array.isArray(orderSummary) || orderSummary.length === 0) {
          throw new Error('fifaShowOrderSummary 必须是非空数组');
        }
      } catch (error) {
        this.logger.error(`fifaShowOrderSummary 解析失败: ${error.message}`, ipAddress);
        return response.status(400).json({
          success: false,
          message: '订单数据格式错误',
        });
      }

      // 3. 解析图片数组
      let orderImgs: string[] = [];
      if (dto.fifaShowOrderSummaryImgs) {
        try {
          // 先尝试直接解析
          try {
            orderImgs = JSON.parse(dto.fifaShowOrderSummaryImgs) as string[];
          } catch {
            // 如果失败,尝试修复引号问题
            orderImgs = [] as string[];
          }
          
          if (!Array.isArray(orderImgs)) {
            orderImgs = [];
          }
        } catch (error) {
          this.logger.warn(`fifaShowOrderSummaryImgs 解析失败: ${error.message}`, ipAddress);
          orderImgs = [];
        }
      }
      
      this.logger.log(`图片数组: ${JSON.stringify(orderImgs)}`, ipAddress);

      // 4. 计算物品数量 (每5个元素为一个物品)
      const itemCount = Math.ceil(orderSummary.length / 5);
      this.logger.log(`物品数量: ${itemCount}`);

      // 5. 生成订单号
      const orderNo = this.orderService.generateOrderNo();
      this.logger.log(`生成订单号: ${orderNo}`);

      // 6. 计算订单金额
      const totalAmount = 0;
      const subtotalAmount = 0;
      const shippingAmount = 0;
      const taxAmount = 0;
      const discountAmount = Math.round((dto.discount_total_price || 0) * 100);

      // 7. 直接创建订单实体
      const Order = (await import('../../order/entities/order.entity')).Order;
      const orderEntity = this.orderService['orderRepository'].create({
        orderNo,
        userId: dto.uid,
        token: '',
        orderStatus: 0,
        paymentStatus: 0,
        subtotalAmount,
        shippingAmount,
        taxAmount,
        discountAmount,
        totalAmount,
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

      // 8. 创建订单项
      const OrderItem = (await import('../../order/entities/order-item.entity')).OrderItem;
      const orderItems = [];
      for (let i = 0; i < itemCount; i++) {
        const startIndex = i * 5;
        const endIndex = Math.min(startIndex + 5, orderSummary.length);
        const itemElements = orderSummary.slice(startIndex, endIndex);

        const productImage = orderImgs[i] || '';
        const productName = itemElements[0] || `票务物品 ${i + 1}`;

        const orderItemEntity = this.orderService['orderItemRepository'].create({
          orderId: orderEntity.orderId,
          orderNo,
          itemId: 0, // 自增
          productId: 0, // 票务订单无产品ID
          skuId: 0, // 票务订单无SKU ID
          variantId: '',
          productName,
          variantName: itemElements.slice(1).join(', '),
          quantity: 1,
          salePrice: 0,
          subtotalAmount: 0,
          productImage,
          productUrl: productImage,
          skuCode: '',
          size: '',
          color: '',
        });

        await this.orderService['orderItemRepository'].save(orderItemEntity);
        orderItems.push(orderItemEntity);
      }

      this.logger.log(`订单项创建成功: ${orderItems.length} 个物品`);

      // 9. 保存收货信息到 biz_deliver 表
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


       // 4. 异步推送 Facebook 事件（不阻塞主流程）
      const userAgent = (request.headers['user-agent'] as string) || ''
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
      )

      // 5. 创建支付订单
      this.logger.log(`开始创建支付订单: ${orderNo}`, ipAddress);
      
      const paymentResult = await this.paymentService.createPayment({
        orderNo: orderEntity.orderNo,
        amount: orderEntity.totalAmount,
        currency: 'USD',
        paymentMethod: 'PIX_BRL',
        userId: dto.uid,
        email: dto.email,
      });

      if (!paymentResult || !paymentResult.success) {
        this.logger.error(`支付订单创建失败: ${paymentResult?.message}`, ipAddress);
        return response.status(500).json({
          success: false,
          message: `支付订单创建失败: ${paymentResult?.message || '未知错误'}`,
        });
      }

      this.logger.log(`支付订单创建成功: ${paymentResult.paymentNo}`, ipAddress);
      this.logger.log(`支付地址: ${paymentResult.payUrl}`, ipAddress);

      // 6. 返回支付地址给前端
      if(paymentResult && paymentResult.success){
        this.logger.log(`支付订单创建成功: ${paymentResult.paymentNo}  ${paymentResult.payUrl}  ${paymentResult.qrCode}  ${paymentResult.expireTime}`);
        
         // 5. 返回支付跳转链接（包含使用的通道信息）
        return response.redirect(paymentResult.payUrl);
      }
      else{
          this.logger.log(`支付订单创建失败: ${paymentResult.message}  orderNo: ${orderEntity.orderNo}`);
          return response.redirect('/checkout/payment/pix?v=' + orderEntity.orderNo);
      }
    } catch (error) {
      this.logger.error(`创建票务订单失败: ${error.message}`, error.stack);
      return response.status(500).json({
        success: false,
        message: `订单创建失败: ${error.message}`,
      });
    }
  }
}
