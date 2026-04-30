import { Controller, Post, Req, Body, Res, HttpStatus, Get, Param, Query } from '@nestjs/common'
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
import { QueryOrderDto } from './dto/req-order.dto'
import { PaginationPipe } from 'src/common/pipes/pagination.pipe'
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator'
import { RequiresPermissions } from 'src/common/decorators/requires-permissions.decorator'
import { Order } from './entities/order.entity'
import { DataObj } from 'src/common/class/data-obj.class'

@ApiTags('订单管理')
@ApiBearerAuth()
@Controller('biz/order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly cookieService: CookieService,
    private readonly checkoutTemplateService: CheckoutTemplateService,
    private readonly facebookEventService: FacebookEventService,
  ) {}

  /* 分页查询订单列表 */
  @Get('list')
  @RequiresPermissions('biz:order:query')
  @ApiPaginatedResponse(Order)
  async list(@Query(PaginationPipe) queryDto: QueryOrderDto) {
    return this.orderService.findAll(queryDto)
  }

  /* 获取订单详情（包含订单项） */
  @Get('detail/:orderNo')
  @RequiresPermissions('biz:order:query')
  async getDetail(@Param('orderNo') orderNo: string) {
    const detail = await this.orderService.getOrderDetail(orderNo)
    return DataObj.create(detail)
  }

  /* 获取订单支付信息 */
  @Get('payments/:orderNo')
  @RequiresPermissions('biz:order:query')
  async getPayments(@Param('orderNo') orderNo: string) {
    const payments = await this.orderService.getOrderPayments(orderNo)
    return DataObj.create(payments)
  }
 
}