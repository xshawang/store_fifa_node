import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { DataObj } from 'src/common/class/data-obj.class'
import { BusinessTypeEnum, Log } from 'src/common/decorators/log.decorator'
import { RepeatSubmit } from 'src/common/decorators/repeat-submit.decorator'
import { Public } from 'src/common/decorators/public.decorator'
import { EmailService } from './email.service'
import { OrderService } from '../order/order.service'


@ApiTags('产品管理')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService, private readonly orderService: OrderService) { }

    /* 手动发送邮件 */
    @Public()
    @Post('send-email')
    @Log({
        title: '手动发送邮件',
        businessType: BusinessTypeEnum.insert,
    })
    async sendEmail(@Query() param: any) {
        console.log('接收到参数 ', param.orderNo)
        this.emailService.sendOrderSuccessEmailByOrderNo(param.orderNo)
        return DataObj.create(true)
    }

}