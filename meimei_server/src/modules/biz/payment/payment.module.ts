import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentOrderEntity } from './entities/payment-order.entity';
import { PaymentChannelEntity } from './entities/payment-channel.entity';
import { DeliverEntity } from './entities/deliver.entity';
import { PaymentService } from './services/payment.service';
import { XPayStrategy } from './strategies/xpay.strategy';
import { XPayCreditMastercardStrategy } from './strategies/xpay-credit-mastercard.strategy';
import { PaymentController } from './controllers/payment.controller';
import { NotifyController } from './controllers/notify.controller';
import { PaymentStrategy } from './interfaces/payment-strategy.interface';
import { CartModule } from '../cart/cart.module';

/**
 * 支付模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentOrderEntity,
      PaymentChannelEntity,
      DeliverEntity,
    ]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    CartModule,  // 导入 CartModule 以使用 CookieService
  ],
  controllers: [
    PaymentController,
    NotifyController,
  ],
  providers: [
    PaymentService,
    XPayStrategy,
    XPayCreditMastercardStrategy,  // 注册 Mastercard 策略
    // 注册支付策略数组，注入到 PaymentService
    {
      provide: 'PAYMENT_STRATEGIES',  // 使用字符串token
      useFactory: (xpayStrategy: XPayStrategy, mastercardStrategy: XPayCreditMastercardStrategy) => {
        return [xpayStrategy, mastercardStrategy];  // 返回所有策略数组
      },
      inject: [XPayStrategy, XPayCreditMastercardStrategy],
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
