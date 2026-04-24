import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common'
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
import { Request } from 'express'

@ApiTags('购物车管理')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /* 添加商品到购物车 */
  @RepeatSubmit()
  @Post('add')
  @Public()
  @Log({
    title: '购物车管理',
    businessType: BusinessTypeEnum.insert,
  })
  async addToCart(
    @Body() createCartDto: CreateCartDto,
    @Req() request: Request,
  ) {
    const cookieHeader = request.headers.cookie || ''
    const cart = await this.cartService.addToCart(createCartDto, cookieHeader)
    return DataObj.create(cart)
  }

  /* 分页查询购物车列表 */
  @Get('list')
  @RequiresPermissions('cart:list:query')
  @ApiPaginatedResponse(Cart)
  async list(@Query(PaginationPipe) queryDto: QueryCartDto, @Req() request: Request) {
    const cookieHeader = request.headers.cookie || ''
    return this.cartService.findAll(queryDto, cookieHeader)
  }

  /* 通过购物车ID查询 */
  @Get(':cartId')
  @RequiresPermissions('cart:detail:query')
  @ApiDataResponse(typeEnum.object, Cart)
  async one(@Param('cartId') cartId: number) {
    const cart = await this.cartService.findOne(cartId)
    return DataObj.create(cart)
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
@Controller('api/cart')
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
