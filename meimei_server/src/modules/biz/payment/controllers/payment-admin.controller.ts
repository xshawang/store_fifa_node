import { Controller, Get, Post, Put, Delete, Query, Body, Param } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { RequiresPermissions } from 'src/common/decorators/requires-permissions.decorator'
import { Log, BusinessTypeEnum } from 'src/common/decorators/log.decorator'
import { RepeatSubmit } from 'src/common/decorators/repeat-submit.decorator'
import { User, UserEnum } from 'src/common/decorators/user.decorator'
import { UserInfoPipe } from 'src/common/pipes/user-info.pipe'
import { PaginationPipe } from 'src/common/pipes/pagination.pipe'
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator'
import { PaymentService } from '../services/payment.service'
import { OrderService } from '../../order/order.service'
import { QueryPaymentOrderDto, QueryPaymentChannelDto, CreatePaymentChannelDto, UpdatePaymentChannelDto } from '../dto/query-payment.dto'
import { QueryOrderDto } from '../../order/dto/req-order.dto'
import { PaymentOrderEntity } from '../entities/payment-order.entity'
import { PaymentChannelEntity } from '../entities/payment-channel.entity'
import { Order } from '../../order/entities/order.entity'

/**
 * 支付管理控制器
 * 管理后台使用的接口
 */
@ApiTags('支付管理')
@ApiBearerAuth()
@Controller('biz/payment')
export class PaymentAdminController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
  ) {}

  /* 分页查询支付订单列表 */
  @Get('order/list')
  @RequiresPermissions('biz:payment:query')
  @ApiPaginatedResponse(PaymentOrderEntity)
  async listPaymentOrders(@Query(PaginationPipe) queryDto: QueryPaymentOrderDto) {
    return this.paymentService.findPaymentOrders(queryDto)
  }

  /* 分页查询支付渠道列表 */
  @Get('channel/list')
  @RequiresPermissions('biz:channel:query')
  @ApiPaginatedResponse(PaymentChannelEntity)
  async listPaymentChannels(@Query(PaginationPipe) queryDto: QueryPaymentChannelDto) {
    return this.paymentService.findPaymentChannels(queryDto)
  }

  /* 获取支付渠道详情 */
  @Get('channel/:id')
  @RequiresPermissions('biz:channel:query')
  async getPaymentChannel(@Param('id') id: number) {
    return this.paymentService.findPaymentChannelById(id)
  }

  /* 新增支付渠道 */
  @RepeatSubmit()
  @Post('channel')
  @RequiresPermissions('biz:channel:add')
  @Log({
    title: '支付渠道管理',
    businessType: BusinessTypeEnum.insert,
  })
  async addPaymentChannel(
    @Body() createDto: CreatePaymentChannelDto,
    @User(UserEnum.userName, UserInfoPipe) userName: string,
  ) {
    createDto['createBy'] = createDto['updateBy'] = userName
    await this.paymentService.createPaymentChannel(createDto)
  }

  /* 修改支付渠道 */
  @RepeatSubmit()
  @Put('channel')
  @RequiresPermissions('biz:channel:edit')
  @Log({
    title: '支付渠道管理',
    businessType: BusinessTypeEnum.update,
  })
  async updatePaymentChannel(
    @Body() updateDto: UpdatePaymentChannelDto,
    @User(UserEnum.userName, UserInfoPipe) userName: string,
  ) {
    await this.paymentService.updatePaymentChannel(updateDto.id, updateDto)
  }

  /* 删除支付渠道 */
  @Delete('channel/:ids')
  @RequiresPermissions('biz:channel:remove')
  @Log({
    title: '支付渠道管理',
    businessType: BusinessTypeEnum.delete,
  })
  async deletePaymentChannel(@Param('ids') ids: string) {
    await this.paymentService.deletePaymentChannel(ids)
  }
}
