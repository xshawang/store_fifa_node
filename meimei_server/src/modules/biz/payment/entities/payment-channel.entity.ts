import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 支付通道配置实体
 */
@Entity('biz_payment_channel')
@Index('idx_channel_type', ['channelType'])
@Index('idx_is_active', ['isActive'])
@Index('idx_priority', ['priority'])
export class PaymentChannelEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'channel_code', type: 'varchar', length: 50, unique: true })
  channelCode: string;

  @Column({ name: 'channel_name', type: 'varchar', length: 100 })
  channelName: string;

  @Column({ name: 'channel_type', type: 'varchar', length: 50 })
  channelType: string; // CREDIT_CARD, QRIS, ALIPAY

  @Column({ name: 'platform_key', type: 'varchar', length: 255 })
  platformKey: string;

  @Column({ name: 'platform_secret', type: 'varchar', length: 255 })
  platformSecret: string;

  @Column({ name: 'site_code', type: 'varchar', length: 100, nullable: true })
  siteCode: string;

  @Column({ name: 'api_base_url', type: 'varchar', length: 255 })
  apiBaseUrl: string;

  @Column({ name: 'api_version', type: 'varchar', length: 20, default: 'v1' })
  apiVersion: string;

  @Column({ name: 'notify_url', type: 'varchar', length: 512 })
  notifyUrl: string;

  @Column({ name: 'supported_currencies', type: 'json' })
  supportedCurrencies: string[];

  @Column({ name: 'supported_methods', type: 'json' })
  supportedMethods: string[];

  @Column({ name: 'min_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minAmount: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 10, scale: 2, default: 999999.99 })
  maxAmount: number;

  @Column({ name: 'fee_rate', type: 'decimal', precision: 5, scale: 4, default: 0 })
  feeRate: number;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'json', nullable: true })
  config: any;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
