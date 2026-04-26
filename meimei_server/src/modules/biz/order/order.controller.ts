import { Controller, Post, Req, Body, Res, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Public } from 'src/common/decorators/public.decorator'
import { OrderService } from './order.service'
import { CookieService } from '../cart/cart-cookie.service'
import { CheckoutPayDto } from '../cart/dto/req-cart.dto'
import { Log, BusinessTypeEnum } from 'src/common/decorators/log.decorator'
import { Keep } from 'src/common/decorators/keep.decorator'

@ApiTags('订单管理')
@ApiBearerAuth()
@Controller()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * 从购物车创建订单
   * POST /cart/post
   * 处理 application/x-www-form-urlencoded 表单提交，返回 302 重定向
   */
  @Post('/cart/post')
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
    console.log('==================== /cart/post 请求 ====================')
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
      const result = await this.orderService.createOrderFromCart(
        userId,
        token,
        checkoutPayDto,
        ipAddress,
      )

      console.log('✅ 订单创建成功, orderNo:', result.orderNo)

      // 3. 将32位订单编号进行URL编码
      const encodedOrderNo = encodeURIComponent(result.orderNo)

      // 4. 构建重定向 URL
      const redirectUrl = `http://localhost:8080/checkout.html?v=${encodedOrderNo}`
      console.log('🔄 302 重定向到:', redirectUrl)
      
      // 5. 返回 302 重定向，浏览器自动跳转
      return response.redirect(302, redirectUrl)
    } catch (error) {
      console.error('❌ 订单创建失败:', error)
      // 发生错误时，重定向回购物车页面
      return response.redirect(302, '/cart?error=order_creation_failed')
    }
  }
}
