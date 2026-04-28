import { Injectable, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order } from './entities/order.entity'
import { OrderItem } from './entities/order-item.entity'
import { Cart } from '../cart/entities/cart.entity'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { ApiException } from 'src/common/exceptions/api.exception'
import { CheckoutPayDto } from '../cart/dto/req-cart.dto'

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * 生成32位不重复订单编号
   * 格式：时间戳(17位) + 随机数(15位)
   */
  generateOrderNo(): string {
    const timestamp = Date.now().toString() // 17位时间戳
    const random = Math.random().toString().substring(2, 17) // 15位随机数
    return timestamp + random
  }

  /**
   * 从购物车创建订单
   */
  async createOrderFromCart(
    userId: string,
    token: string,
    checkoutPayDto: CheckoutPayDto,
    ipAddress: string,
  ): Promise<{ 
    orderNo: string,
    orderId: number,
    totalAmount: number,
    itemCount: number,
    currency: string,
    items: Array<{
      productName: string,
      variantName: string,
      quantity: number,
      salePrice: number,
      subtotalAmount: number,
      productImage: string,
      productUrl: string,
    }>
  }> {
    // 1. 从购物车获取商品信息
    const cartItems = await this.cartRepository.find({
      where: { token, userId, status: 1 },
      order: { cartId: 'ASC' },
    })
 

    // 3. 计算订单总金额
    let subtotalAmount = 0
    const orderItems: Partial<OrderItem>[] = []

    for (const cartItem of cartItems) {
      const priceInCents = cartItem.price
      const quantity = cartItem.quantity
      const itemSubtotal = priceInCents * quantity

      subtotalAmount += itemSubtotal

      // 创建订单项
      orderItems.push({
        productId: cartItem.productId,
        skuId: cartItem.skuId,
        variantId: cartItem.variantId,
        productName: cartItem.productName,
        variantName: cartItem.size, // 尺码作为变体名称
        productImage: '', // TODO: 从产品表获取
        productUrl: cartItem.productUrl,
        skuCode: '', // TODO: 从SKU表获取
        size: cartItem.size,
        color: '', // TODO: 从SKU表获取
        originalPrice: priceInCents,
        salePrice: priceInCents,
        quantity: quantity,
        subtotalAmount: itemSubtotal,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: itemSubtotal,
        fulfillmentStatus: 0,
      })
    }

    // 4. 生成订单编号
    let orderNo = this.generateOrderNo()
    
    // 确保订单编号唯一
    let exists = await this.orderRepository.findOne({ where: { orderNo } })
    while (exists) {
      orderNo = this.generateOrderNo()
      exists = await this.orderRepository.findOne({ where: { orderNo } })
    }

    // 5. 创建订单
    const order = this.orderRepository.create({
      orderNo,
      userId,
      token,
      orderStatus: 0, // 待支付
      paymentStatus: 0, // 未支付
      subtotalAmount,
      shippingAmount: 0, // TODO: 根据配送方式计算
      taxAmount: 0, // TODO: 根据地址计算税费
      discountAmount: 0, // TODO: 根据折扣码计算
      totalAmount: subtotalAmount, // 小计 + 配送 + 税费 - 折扣
      paidAmount: 0,
      currency: 'USD',
      
      // 收货信息
      email: checkoutPayDto.email,
      countryCode: checkoutPayDto.countryCode,
      firstName: checkoutPayDto.firstName,
      lastName: checkoutPayDto.lastName,
      fullName: `${checkoutPayDto.firstName} ${checkoutPayDto.lastName}`,
      phone: checkoutPayDto.phone,
      address1: checkoutPayDto.address1,
      address2: checkoutPayDto.address2,
      city: checkoutPayDto.city,
      province: checkoutPayDto.province,
      postalCode: checkoutPayDto.postalCode,
      country: checkoutPayDto.country,
      zone: checkoutPayDto.zone,
      
      // 其他信息
      paymentMethod: null,
      discountCode: null,
      customerNote: null,
      ipAddress,
      isDeleted: 0,
    })

    // 5. 保存订单和订单项（使用事务）
    await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      // 保存订单
      await transactionalEntityManager.save(Order, order)

      // 保存订单项
      for (const item of orderItems) {
        item.orderId = order.orderId
        item.orderNo = orderNo
        await transactionalEntityManager.save(OrderItem, item)
      }

      // 将订单编号写入Redis缓存，有效期1小时
      await this.cacheManager.set(`order:no:${orderNo}`, JSON.stringify({
        orderId: order.orderId,
        userId,
        token,
        createdAt: new Date().toISOString(),
      }), 3600) // 1小时 = 3600秒

      // 删除购物车中的商品（软删除）
    //   await transactionalEntityManager.update(
    //     Cart,
    //     { token, userId, status: 1 },
    //     { status: 0 }
    //   )
    })

    console.log('✅ 订单创建成功:', {
      orderNo,
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      itemCount: orderItems.length,
    })

    // 返回完整的订单数据（用于生成 HTML）
    return {
      orderNo,
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      itemCount: orderItems.length,
      currency: order.currency,
      items: orderItems.map(item => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        salePrice: item.salePrice,
        subtotalAmount: item.subtotalAmount,
        productImage: item.productImage || '',
        productUrl: item.productUrl || '',
      })),
    }
  }

  /**
   * 根据订单编号获取订单信息
   */
  async getOrderByOrderNo(orderNo: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { orderNo } })
    if (!order) {
      throw new ApiException('订单不存在')
    }
    return order
  }

  /**
   * 根据订单编号获取订单项
   */
  async getOrderItemsByOrderNo(orderNo: string): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      where: { orderNo },
      order: { itemId: 'ASC' },
    })
  }

  /**
   * 从缓存中获取订单编号
   */
  async getOrderNoFromCache(orderNo: string): Promise<any> {
    const cached = await this.cacheManager.get(`order:no:${orderNo}`)
    return cached ? JSON.parse(cached as string) : null
  }
}

