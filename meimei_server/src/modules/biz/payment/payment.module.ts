import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentOrderEntity } from './entities/payment-order.entity';
import { PaymentChannelEntity } from './entities/payment-channel.entity';
import { DeliverEntity } from './entities/deliver.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { PaymentService } from './services/payment.service';
import { XPayStrategy } from './strategies/xpay.strategy';
import { XPayCreditMastercardStrategy } from './strategies/xpay-credit-mastercard.strategy';
import { PIXPayStrategy } from './strategies/pixpay.strategy';
import { LPayStrategy } from './strategies/lpay.strategy';
import { EYPayStrategy } from './strategies/eypay.strategy';
import { PaymentController } from './controllers/payment.controller';
import { NotifyController } from './controllers/notify.controller';
import { PaymentStrategy } from './interfaces/payment-strategy.interface';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';

/**
 * 支付模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentOrderEntity,
      PaymentChannelEntity,
      DeliverEntity,
      Order,
      OrderItem,
    ]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    CartModule,  // 导入 CartModule 以使用 CookieService
    OrderModule,  // 导入 OrderModule 以使用 CheckoutTemplateService
  ],
  controllers: [
    PaymentController,
    NotifyController,
  ],
  providers: [
    PaymentService,
    XPayStrategy,
    XPayCreditMastercardStrategy,  // 注册 Mastercard 策略
    PIXPayStrategy,  // 注册 PIX 支付策略
    LPayStrategy,  // 注册 LPAY 聚合支付策略
    EYPayStrategy,  // 注册 EYPAY 支付策略
    // 注册支付策略数组，注入到 PaymentService
    {
      provide: 'PAYMENT_STRATEGIES',  // 使用字符串token
      useFactory: (xpayStrategy: XPayStrategy, mastercardStrategy: XPayCreditMastercardStrategy, pixpayStrategy: PIXPayStrategy, lpayStrategy: LPayStrategy, eypayStrategy: EYPayStrategy) => {
        return [xpayStrategy, mastercardStrategy, pixpayStrategy, lpayStrategy, eypayStrategy];  // 返回所有策略数组
      },
      inject: [XPayStrategy, XPayCreditMastercardStrategy, PIXPayStrategy, LPayStrategy, EYPayStrategy],
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
