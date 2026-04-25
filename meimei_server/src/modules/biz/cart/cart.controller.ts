import { Body, Controller, Delete, Get, Header, Param, Post, Put, Query, Req, Res, UseInterceptors } from '@nestjs/common'
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
import { CreateCartDto, UpdateCartDto, QueryCartDto } from './dto/req-cart.dto'
import { Cart } from './entities/cart.entity'
import { Public } from 'src/common/decorators/public.decorator'
import { Keep } from 'src/common/decorators/keep.decorator'
import { Request, Response } from 'express'
import { FilesInterceptor } from '@nestjs/platform-express'

@ApiTags('购物车管理')
@ApiBearerAuth()
@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /* 添加商品到购物车 */
  @UseInterceptors(FilesInterceptor('files'))
  // @RepeatSubmit()
  @Post('/cart/add')
  @Public()
  @Log({
    title: '购物车管理',
    businessType: BusinessTypeEnum.insert,
  })
  async addToCart(
    @Req() request: Request,
  ) {
    console.log('addToCart raw body:', request.body)
    console.log('request headers:', JSON.stringify(request.headers))
    
    // 直接从 request.body 获取表单参数
    const rawBody = request.body as any
    let createCartDto = new CreateCartDto()
    createCartDto.id = rawBody['id'] ? Number(rawBody['id']) : undefined
    createCartDto.productId = rawBody['product-id'] ? Number(rawBody['product-id']) : undefined
    createCartDto.size1 = rawBody['Size-1']
    createCartDto.formType = rawBody['form_type']
    createCartDto.utf8 = rawBody['utf8']
    createCartDto.sectionId = rawBody['section-id']
    createCartDto.sections = rawBody['sections']
    createCartDto.sectionsUrl = rawBody['sections_url']
    createCartDto.quantity = rawBody['quantity'] ? Number(rawBody['quantity']) : 1
    
    console.log('createCartDto:', JSON.stringify(createCartDto))
      
    const cookieHeader = request.headers.cookie || ''
    const cart = await this.cartService.addToCart(createCartDto, cookieHeader)
    return cart;
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
