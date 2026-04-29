import { Controller, Post, Req, Body, Res, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Public } from 'src/common/decorators/public.decorator'
import { OrderService } from './order.service'
import { CookieService } from '../cart/cart-cookie.service'
import { CheckoutPayDto } from '../cart/dto/req-cart.dto'
import { Log, BusinessTypeEnum } from 'src/common/decorators/log.decorator'
import { Keep } from 'src/common/decorators/keep.decorator'
import { CheckoutTemplateService } from './checkout-template.service'
import { FacebookEventService } from './facebook-event.service'

@ApiTags('订单管理')
@ApiBearerAuth()
@Controller()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly cookieService: CookieService,
    private readonly checkoutTemplateService: CheckoutTemplateService,
    private readonly facebookEventService: FacebookEventService,
  ) {}
 
  /**
   * 从购物车创建订单
   * POST /cart/post
   * 处理 application/x-www-form-urlencoded 表单提交，返回 302 重定向
   */
  @Post(['/cart/post','/pt/cart/post'])
  @Public()
  @Keep()
  @Log({
    title: '创建订单',
    businessType: BusinessTypeEnum.insert,
  })
  async createOrderFromCart(
    @Req() request: Request,
    @Body() checkoutPayDto: CheckoutPayDto,
    @Res() response: Response,
  ) {
    console.log('==================== /cart/post 或 /pt/cart/post 请求 ====================')
    console.log('收到创建订单请求 (application/x-www-form-urlencoded)')
    console.log('checkoutPayDto:', JSON.stringify(checkoutPayDto, null, 2))
    console.log('Cookie:', request.headers.cookie)
    console.log('IP:', request.ip)
    console.log('==========================================================')

    try {
      // 1. 从 Cookie 获取用户信息
      const cookieHeader = request.headers.cookie || ''
      const userId = await this.cookieService.extractKeyFromCookie(cookieHeader, '_shopify_y')
      const token = await this.cookieService.extractKeyFromCookie(cookieHeader, 'cart')

      if (!userId || !token) {
        console.error('❌ 缺少用户标识或token')
        // 表单提交失败，重定向到错误页面或购物车页面
        return response.redirect(302, '/cart')
      }

      console.log('✅ userId:', userId)
      console.log('✅ token:', token)

      // 2. 创建订单
      const ipAddress = request.ip || request.headers['x-forwarded-for'] as string
      const orderData = await this.orderService.createOrderFromCart(
        userId,
        token,
        checkoutPayDto,
        ipAddress,
      )

      orderData.currency = 'BRL'  
      console.log('✅ 订单创建成功, orderNo:', orderData.orderNo)
      console.log('📦 订单商品数量:', orderData.itemCount)
      console.log('💰 订单总金额:', orderData.totalAmount)
      console.log('💰 订单货币默认BRL:',  orderData.currency)

      // 4. 异步推送 Facebook 事件（不阻塞主流程）
      const userAgent = (request.headers['user-agent'] as string) || ''
      this.facebookEventService.sendPurchaseEvent(
        {
          orderNo: orderData.orderNo,
          totalAmount: orderData.totalAmount,
          currency: orderData.currency,
          items: orderData.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            salePrice: item.salePrice,
          })),
        },
        ipAddress,
        userAgent,
      )

      // 5. 动态生成 Checkout HTML（注入订单数据）
      const html = await this.checkoutTemplateService.generateCheckoutHtml(orderData,true)

      console.log('📄 已生成 Checkout HTML 页面')
      console.log('🔗 支付 URL:', `https://store.fif.com/checkout/pay?v=${orderData.orderNo}`)

      // 6. 返回 HTML 响应（不再 302 重定向）
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      return response.send(html)
    } catch (error) {
      console.error('❌ 订单创建失败:', error)
      // 发生错误时，重定向回购物车页面
      return response.redirect(302, '/cart?error=order_creation_failed')
    }
  }
}
