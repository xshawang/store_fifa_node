import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PaymentOrderEntity } from '../entities/payment-order.entity';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
     import { firstValueFrom } from 'rxjs';
     import { HttpService } from '@nestjs/axios';
/**
 * 支付统计定时任务服务
 * 功能：
 * 1. 每小时统计前一小时支付成功订单
 * 2. 每天0点统计昨天支付成功订单汇总
 * 
 * 去重机制：基于 Redis 实现分布式去重，支持多实例部署
 */
@Injectable()
export class PaymentStatsTaskService {
  private readonly logger = new Logger(PaymentStatsTaskService.name);

  // Redis 键前缀
  private readonly REDIS_KEY_PREFIX = 'payment:notification:';
  // 去重记录过期时间（24小时）
  private readonly DEDUP_TTL_SECONDS = 24 * 60 * 60;

  // Telegram 配置
  private readonly TELEGRAM_CONFIG = {
    botToken: '8739319224:AAFw-tgw23H4DGO-aRBprczCPZGLCmXXO0s',
    chatId: '-5228458416',
    apiUrl: 'https://api.telegram.org/bot',
  };

  constructor(
    @InjectRepository(PaymentOrderEntity)
    private readonly paymentOrderRepo: Repository<PaymentOrderEntity>,
    @InjectRedis() private readonly redis: Redis,
    private readonly httpService: HttpService,
  ) {}

  /**
   * 每小时执行一次（每小时的第0分钟）
   * 统计前一小时支付成功的订单
   */
  @Cron('0 * * * *')
  async handleHourlyStats() {
    try {
      this.logger.log('开始执行每小时支付统计任务...');

      // 计算时间范围：前一小时整点到当前小时整点
      const now = new Date();
      const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
      const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000);

      // 查询前一小时支付成功的订单
      const stats = await this.getPaymentStats(previousHour, currentHour);

      // if (stats.count === 0) {
      //   this.logger.log(`前一小时(${this.formatDate(previousHour)} - ${this.formatDate(currentHour)})无支付成功订单`);
      //   return;
      // }

      // 生成通知唯一标识（类型+时间段）
      const notificationKey = `hourly_${this.formatDateHour(previousHour)}`;
      
      // 检查是否已发送过
      if (this.isNotificationSent(notificationKey)) {
        this.logger.log(`每小时统计通知已发送，跳过 - 时间段: ${this.formatDateHour(previousHour)}`);
        return;
      }

      this.logger.log(`前一小时支付统计 - 订单数: ${stats.count}, 金额: ${stats.totalAmount}`);

      // 发送 Telegram 通知
      const sent = await this.sendHourlyTelegramNotification({
        startTime: previousHour,
        endTime: currentHour,
        count: stats.count,
        totalAmount: stats.totalAmount,
        currency: stats.currency,
      });

      // 记录已发送
      if (sent) {
        await this.markNotificationSent(notificationKey);
      }
    } catch (error) {
      this.logger.error('每小时支付统计任务执行失败:', error);
    }
  }

  /**
   * 每天凌晨0点执行
   * 统计昨天支付成功的订单汇总
   */
  @Cron('0 0 * * *')
  async handleDailyStats() {
    try {
      this.logger.log('开始执行每日支付统计任务...');

      // 计算昨天的时间范围
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

      // 查询昨天支付成功的订单
      const stats = await this.getPaymentStats(yesterdayStart, todayStart);

      // if (stats.count === 0) {
      //   this.logger.log('昨天无支付成功订单');
      //   return;
      // }

      // 生成通知唯一标识（类型+日期）
      const notificationKey = `daily_${this.formatDateOnly(yesterdayStart)}`;
      
      // 检查是否已发送过
      if (this.isNotificationSent(notificationKey)) {
        this.logger.log(`每日汇总通知已发送，跳过 - 日期: ${this.formatDateOnly(yesterdayStart)}`);
        return;
      }

      this.logger.log(`昨天支付统计 - 订单数: ${stats.count}, 金额: ${stats.totalAmount}`);

      // 发送 Telegram 通知
      const sent = await this.sendDailyTelegramNotification({
        date: yesterdayStart,
        count: stats.count,
        totalAmount: stats.totalAmount,
        currency: stats.currency,
      });

      // 记录已发送
      if (sent) {
        await this.markNotificationSent(notificationKey);
      }
    } catch (error) {
      this.logger.error('每日支付统计任务执行失败:', error);
    }
  }

  /**
   * 查询指定时间范围内的支付统计数据
   */
  private async getPaymentStats(startTime: Date, endTime: Date) {
    // 查询支付成功（status=2）的订单
    const result = await this.paymentOrderRepo
      .createQueryBuilder('payment')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'totalAmount')
     
      .where('payment.status = :status', { status: 2 })
      .andWhere('payment.paidTime >= :startTime', { startTime })
      .andWhere('payment.paidTime < :endTime', { endTime })
      
      .getRawMany();

    if (result.length === 0) {
      return { count: 0, totalAmount: 0, currency: 'BRL' };
    }
    // 如果有多种货币，取主要的（第一条）
    const mainResult = result[0];
    return {
      count: parseInt(mainResult.count) || 0,
      totalAmount: parseFloat(mainResult.totalAmount) || 0,
      currency: mainResult.currency || 'BRL',
    };
  }

  /**
   * 发送每小时统计 Telegram 通知
   * @returns 是否发送成功
   */
  private async sendHourlyTelegramNotification(data: {
    startTime: Date;
    endTime: Date;
    count: number;
    totalAmount: number;
    currency: string;
  }): Promise<boolean> {
    try {
      const { startTime, endTime, count, totalAmount, currency } = data;
      const amountFormatted = totalAmount.toFixed(2);
      const timeRange = this.formatDateHour(startTime);

      const message = `
📊 <b>每小时支付统计</b>

⏰ <b>时间段:</b> ${timeRange}
📦 <b>成功订单数:</b> ${count} 单
💰 <b>支付金额:</b> ${amountFormatted} ${currency}
      `.trim();

      await this.sendTelegramMessage(message);
      this.logger.log(`每小时统计通知发送成功 - 时间段: ${timeRange}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        '发送每小时统计通知失败:',
        error.response?.data || error.message,
      );
      return false;
    }
  }

  /**
   * 发送每日统计 Telegram 通知
   * @returns 是否发送成功
   */
  private async sendDailyTelegramNotification(data: {
    date: Date;
    count: number;
    totalAmount: number;
    currency: string;
  }): Promise<boolean> {
    try {
      const { date, count, totalAmount, currency } = data;
      const amountFormatted = totalAmount.toFixed(2);
      const dateStr = this.formatDateOnly(date);

      const message = `
📈 <b>每日支付汇总</b>

📅 <b>日期:</b> ${dateStr}
📦 <b>成功订单数:</b> ${count} 单
💰 <b>支付金额:</b> ${amountFormatted} ${currency}
      `.trim();

      await this.sendTelegramMessage(message);
      this.logger.log(`每日汇总通知发送成功 - 日期: ${dateStr}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        '发送每日汇总通知失败:',
        error.response?.data || error.message,
      );
      return false;
    }
  }

  /**
   * 发送 Telegram 消息（通用方法）
   */
  private async sendTelegramMessage(message: string): Promise<void> {
    const url = `${this.TELEGRAM_CONFIG.apiUrl}${this.TELEGRAM_CONFIG.botToken}/sendMessage`;
    
        const response = await firstValueFrom(
            this.httpService.post(url, { chat_id: this.TELEGRAM_CONFIG.chatId, text: message, parse_mode: 'HTML' }),
          );
    
  }

  /**
   * 格式化日期时间（yyyy-MM-dd HH）
   */
  private formatDateHour(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:00`;
  }

  /**
   * 格式化日期（yyyy-MM-dd）
   */
  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 格式化完整日期时间
   */
  private formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * 检查通知是否已发送（基于 Redis）
   * @param key 通知唯一标识
   */
  private async isNotificationSent(key: string): Promise<boolean> {
    const redisKey = `${this.REDIS_KEY_PREFIX}${key}`;
    const exists = await this.redis.exists(redisKey);
    return exists === 1;
  }

  /**
   * 标记通知已发送（基于 Redis，24小时过期）
   * @param key 通知唯一标识
   */
  private async markNotificationSent(key: string): Promise<void> {
    const redisKey = `${this.REDIS_KEY_PREFIX}${key}`;
    await this.redis.setex(redisKey, this.DEDUP_TTL_SECONDS, '1');
    this.logger.debug(`标记通知已发送: ${key}，过期时间: ${this.DEDUP_TTL_SECONDS}秒`);
  }
}
