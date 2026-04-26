import { Body, Controller, Delete, Get, Header, Headers, Param, Post, Put, Query, Req, Res, UseInterceptors } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { DataObj } from 'src/common/class/data-obj.class'
import { ApiDataResponse, typeEnum } from 'src/common/decorators/api-data-response.decorator'
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator'
import { BusinessTypeEnum, Log } from 'src/common/decorators/log.decorator'
import { RepeatSubmit } from 'src/common/decorators/repeat-submit.decorator'
import { RequiresPermissions } from 'src/common/decorators/requires-permissions.decorator'
import { User, UserEnum } from 'src/common/decorators/user.decorator'
import { PaginationPipe } from 'src/common/pipes/pagination.pipe'
import { UserInfoPipe } from 'src/common/pipes/user-info.pipe'
import { CartService } from './cart.service'
import { CreateCartDto, UpdateCartDto, QueryCartDto, ChangeCartDto, CheckoutDto, CheckoutPayDto } from './dto/req-cart.dto'
import { Cart } from './entities/cart.entity'
import { Public } from 'src/common/decorators/public.decorator'
import { Keep } from 'src/common/decorators/keep.decorator'
import { Request, Response } from 'express'
import { FilesInterceptor } from '@nestjs/platform-express'
import { CookieService } from './cart-cookie.service'
  

@ApiTags('购物车管理')
@ApiBearerAuth()
@Controller()
export class CartController {
  constructor(private readonly cartService: CartService, private readonly cookieService: CookieService) {}

  /* 添加商品到购物车 */
  @UseInterceptors(FilesInterceptor('files'))
  // @RepeatSubmit()
  @Post('/cart/add')
  @Public()
  @Keep()
  @Log({
    title: '购物车管理',
    businessType: BusinessTypeEnum.insert,
  })
  async addToCart(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('addToCart raw body:', request.body)
    console.log('request headers:', JSON.stringify(request.headers))
    console.log('🍪 请求中的原始 cookie:', request.headers.cookie)
    
    // 直接从 request.body 获取表单参数
    const rawBody = request.body as any
    console.log('📋 原始 body keys:', Object.keys(rawBody))
    
    let createCartDto = new CreateCartDto()
    createCartDto.id = rawBody['id'] ? Number(rawBody['id']) : undefined
    createCartDto.productId = rawBody['product-id'] ? Number(rawBody['product-id']) : undefined
    
    // 处理 Size-1 可能被 URL 编码的情况
    // 尝试多种可能的键名：'Size-1', 'Size-1\r\n', 'Size-1%0D%0A', 或任何包含 'Size-1' 的键
    let sizeValue = rawBody['Size-1'] || rawBody['Size-1\r\n'] || rawBody['Size-1%0D%0A']
    console.log('🔍 直接查找 Size-1 结果:', sizeValue)
    
    // 如果还是没找到，遍历所有 keys 查找包含 'Size-1' 的键
    if (!sizeValue) {
      console.log('🔍 未找到 Size-1，开始遍历所有 keys...')
      for (const key of Object.keys(rawBody)) {
        console.log(`  检查 key: "${key}"`)
        if (key.includes('Size-1')) {
          sizeValue = rawBody[key]
          console.log(`✅ 找到 Size-1 值，键名: "${key}", 值: "${sizeValue}"`)
          break
        }
      }
    }
    
    createCartDto.size1 = sizeValue
    createCartDto.formType = rawBody['form_type']
    createCartDto.utf8 = rawBody['utf8']
    createCartDto.sectionId = rawBody['section-id']
    createCartDto.sections = rawBody['sections']
    createCartDto.sectionsUrl = rawBody['sections_url']
    createCartDto.quantity = rawBody['quantity'] ? Number(rawBody['quantity']) : 1
    
    console.log('createCartDto:', JSON.stringify(createCartDto))
      
    const cookieHeader = request.headers.cookie || ''
    const cart = await this.cartService.addToCart(createCartDto, cookieHeader)
    
    // 如果是新生成的 cart token，写入 cookie
    if (cart['_isNewToken']) {
      // console.log('🍪 设置 cart cookie:', cart.token)
      
      // // 根据请求来源动态设置 domain
      // const host = request.headers.host || '';
      // let cookieDomain = '';
      
      // // 如果是生产环境 (.fifa.com)，设置 domain
      // if (host.includes('fifa.com')) {
      //   cookieDomain = '.fifa.com';
      // }
      // // 本地开发环境 (localhost) 不设置 domain，使用默认
      
      // const cookieValue = `cart=${encodeURIComponent(cart.token)}; Path=/; Max-Age=${14 * 24 * 60 * 60}; SameSite=Lax; HttpOnly=false${cookieDomain ? '; Domain=' + cookieDomain : ''}`;
      
      // response.setHeader('Set-Cookie', cookieValue);
      // console.log('🍪 Set-Cookie header:', cookieValue);
      // console.log('🍪 Cookie domain:', cookieDomain || '(none, using default)');
      
      // 删除内部标记
      delete cart['_isNewToken'];
    }
    
    return cart;
  }

  /* 修改购物车商品数量 */
  @Post('/cart/change')
  @Public()
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Content-Language', 'en-SG')
  @Header('Cache-Control', 'no-cache, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-XSS-Protection', '1; mode=block')
  @Header('X-Download-Options', 'noopen')
  @Header('X-Permitted-Cross-Domain-Policies', 'none')
  @Header('Strict-Transport-Security', 'max-age=7889238')
  @Header('Vary', 'Accept, accept-encoding')
  @Header('Content-Security-Policy', "block-all-mixed-content; frame-ancestors 'none'; upgrade-insecure-requests;")
  @Header('Powered-By', 'Shopify')
  @Header('Shopify-Complexity-Score', '0')
  @Log({
    title: '购物车管理变更',
    businessType: BusinessTypeEnum.update,
  })
  async changeCart(
    @Req() request: Request,
  ) {
    console.log('changeCart raw body:', request.body)
    console.log('changeCart request headers:', JSON.stringify(request.headers))
    
    // 从 request.body 获取参数
    const rawBody = request.body as any
    let changeCartDto = new ChangeCartDto()
    changeCartDto.line = rawBody['line']
    changeCartDto.quantity = rawBody['quantity'] ? Number(rawBody['quantity']) : 0
    changeCartDto.sections = rawBody['sections']
    changeCartDto.sectionsUrl = rawBody['sections_url']
    
    console.log('changeCartDto:', JSON.stringify(changeCartDto))
      
    const cookieHeader = request.headers.cookie || ''
    const result = await this.cartService.changeCart(changeCartDto, cookieHeader)
    
    // 返回 JSON 响应
    return result
  }

  /* 获取checkout信息 */
  @Post('/cart/checkout')
  @Public()
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Content-Language', 'en-SG')
  @Header('Cache-Control', 'no-cache, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-XSS-Protection', '1; mode=block')
  @Header('X-Download-Options', 'noopen')
  @Header('X-Permitted-Cross-Domain-Policies', 'none')
  @Header('Strict-Transport-Security', 'max-age=7889238')
  @Header('Vary', 'Accept, accept-encoding')
  @Header('Content-Security-Policy', "block-all-mixed-content; frame-ancestors 'none'; upgrade-insecure-requests;")
  @Header('Powered-By', 'Shopify')
  @Header('Shopify-Complexity-Score', '0')
  @Log({
    title: '购物车Checkout',
    businessType: BusinessTypeEnum.other,
  })
  async getCheckout(
    @Req() request: Request,
  ) {
    console.log('getCheckout raw body:', request.body)
    console.log('getCheckout request headers:', JSON.stringify(request.headers))
    
    const cookieHeader = request.headers.cookie || ''
    const result = await this.cartService.getCheckoutInfo(cookieHeader)
    
    // 返回 JSON 响应
    return result
  }

  /**
   * 处理结算支付表单提交
   */
  @Post('/checkout/pay')
  @Public()
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Content-Language', 'en-SG')
  @Header('Cache-Control', 'no-cache, no-store')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Header('X-Frame-Options', 'DENY')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('X-XSS-Protection', '1; mode=block')
  @Header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  @Header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;")
  @Header('Referrer-Policy', 'strict-origin-when-cross-origin')
  @Header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  @Header('X-Request-Id', Date.now().toString())
  @Header('Server', 'nginx')
  @Log({
    title: '结算支付',
    businessType: BusinessTypeEnum.other,
  })
  async checkoutPay(
    @Req() request: Request,
    @Body() checkoutPayDto: CheckoutPayDto,
  ) {
    console.log('==================== /checkout/pay 请求 ====================')
    console.log('收到结算支付表单数据：')
    console.log('checkoutPayDto:', JSON.stringify(checkoutPayDto, null, 2))
    console.log('完整 request.body:', JSON.stringify(request.body, null, 2))
    console.log('请求 Headers:', JSON.stringify(request.headers, null, 2))
    console.log('Cookie:', request.headers.cookie)
    const userId = await this.cookieService.extractKeyFromCookie(request.headers.cookie,"_shopify_y");
    const token = await this.cookieService.extractKeyFromCookie(request.headers.cookie, "token");


    // TODO: 在这里实现支付处理逻辑
    // 1. 验证表单数据
    // 2. 处理支付
    // 3. 创建订单
    // 4. 返回结果
    
    return {
      success: true,
      message: '支付请求已接收',
      data: checkoutPayDto,
      timestamp: new Date().toISOString(),
      userId,
      token
    }
  }

  /* 分页查询购物车列表 */
  @Get('list')
  @RequiresPermissions('cart:list:query')
  @ApiPaginatedResponse(Cart)
  async list(@Query(PaginationPipe) queryDto: QueryCartDto, @Req() request: Request) {
    const cookieHeader = request.headers.cookie || ''
    return this.cartService.findAll(queryDto, cookieHeader)
  }

  /* 获取购物车信息（Shopify 格式） - 必须放在 :cartId 之前 */
  @Get('/cart.js')
  @Public()
  async getCartInfo(@Req() request: Request) {
    console.log('\n========================================')
    console.log('=== getCartInfo called ===')
    console.log('Request URL:', request.url)
    console.log('Request Method:', request.method)
    console.log('Request headers:', JSON.stringify(request.headers, null, 2))
    const cookieHeader = request.headers.cookie || ''
    console.log('Cookie header:', cookieHeader)
    console.log('========================================\n')
    
    try {
      const cartInfo = await this.cartService.getCartInfo(cookieHeader)
      console.log('Cart info result:', JSON.stringify(cartInfo, null, 2))
      return cartInfo
    } catch (error) {
      console.error('Error in getCartInfo:', error)
      throw error
    }
  }

  /* 通过购物车ID查询 */
  @Get('/cartget')
  @Public()
  @Keep()
  async one(@Req() request: Request, @Res({ passthrough: false }) response: any, @Param('section_id') section_id: string) {
    console.log('\n========================================')
    console.log('=== getCart called ===', section_id)
    console.log('getCart Request URL:', request.url, section_id)
    console.log('getCart Request Method:', request.method, section_id)
    console.log('getCart Request headers:', JSON.stringify(request.headers, null, 2))
    const cookieHeader = request.headers.cookie || ''
    console.log('getCart Cookie header:', cookieHeader)
    console.log('========================================\n')
    
    try {
      const html = await this.cartService.getCart(cookieHeader, section_id)
      
      // 设置响应头
      response.set('Content-Type', 'text/html; charset=utf-8')
      response.set('Content-Language', 'en-SG')
      response.set('X-Content-Type-Options', 'nosniff')
      response.set('X-Frame-Options', 'DENY')
      response.set('X-XSS-Protection', '1; mode=block')
      response.set('X-Download-Options', 'noopen')
      response.set('X-Permitted-Cross-Domain-Policies', 'none')
      response.set('Strict-Transport-Security', 'max-age=7889238')
      response.set('Vary', 'Accept, Accept-Encoding')
      
      // 设置 security headers
      response.set('Content-Security-Policy', "block-all-mixed-content; frame-ancestors 'none'; upgrade-insecure-requests;")
      
      // 设置 Shopify 相关 headers
      response.set('Powered-By', 'Shopify')
      response.set('Shopify-Complexity-Score', '0')
      
      // 设置 Link header for preconnect
      response.set('Link', '<https://cdn.shopify.com>; rel="preconnect", <https://cdn.shopify.com>; rel="preconnect"; crossorigin')
      
      // 设置 NEL (Network Error Logging)
      response.set('NEL', JSON.stringify({
        success_fraction: 0.01,
        report_to: 'cf-nel',
        max_age: 604800
      }))
      
      // 设置 cookies（如果需要）
      const hasUserId = cookieHeader.includes('_shopify_y=')
      if (!hasUserId) {
        const crypto = require('crypto')
        const newUserId = crypto.randomUUID()
        response.cookie('_shopify_y', newUserId, {
          domain: '.fifa.com',
          path: '/',
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
          sameSite: 'lax'
        })
        response.cookie('localization', 'SG', {
          path: '/',
          maxAge: 365 * 24 * 60 * 60 * 1000,
          sameSite: 'lax'
        })
        response.cookie('cart_currency', 'USD', {
          path: '/',
          maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
          sameSite: 'lax'
        })
      }
      
      response.send(html)
    } catch (error) {
      console.error('Error in getCart:', error)
      response.status(500).send('Internal Server Error')
    }
  }

  /* 更新购物车项数量 */
  @RepeatSubmit()
  @Put()
  @RequiresPermissions('cart:edit')
  @Log({
    title: '购物车管理',
    businessType: BusinessTypeEnum.update,
  })
  async update(
    @Body() updateCartDto: UpdateCartDto,
    @User(UserEnum.userName, UserInfoPipe) userName: string,
  ) {
    await this.cartService.update(Number(updateCartDto.cartId), updateCartDto)
  }

  /* 删除购物车项 */
  @Delete(':cartIds')
  @RequiresPermissions('cart:remove')
  @Log({
    title: '购物车管理',
    businessType: BusinessTypeEnum.delete,
  })
  async delete(@Param('cartIds') cartIds: string) {
    await this.cartService.remove(cartIds)
  }

  /* 清空购物车 */
  @Post('clear')
  @RequiresPermissions('cart:clear')
  @Log({
    title: '购物车管理',
    businessType: BusinessTypeEnum.delete,
  })
  async clear(@Req() request: Request) {
    const cookieHeader = request.headers.cookie || ''
    await this.cartService.clearUserCart(cookieHeader)
  }
}

/* 公开接口：前端用户查询自己的购物车 */
@ApiTags('购物车展示')
@Controller('cart')
export class PublicCartController {
  constructor(private readonly cartService: CartService) {}

  /* 查询当前用户的购物车列表（无需鉴权） */
  @Get('list')
  @Public()
  @ApiPaginatedResponse(Cart)
  async list(@Query(PaginationPipe) queryDto: QueryCartDto, @Req() request: Request) {
    const cookieHeader = request.headers.cookie || ''
    return this.cartService.findAll(queryDto, cookieHeader)
  }
}
