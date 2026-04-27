import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 支付订单实体
 */
@Entity('biz_payment_order')
@Index('idx_order_no', ['orderNo'])
@Index('idx_user_id', ['userId'])
@Index('idx_status', ['status'])
export class PaymentOrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'payment_no', type: 'varchar', length: 64, unique: true })
  paymentNo: string;

  @Column({ name: 'order_no', type: 'varchar', length: 64 })
  orderNo: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64, nullable: true })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'tinyint', default: 0 })
  status: number; // 0-待支付 1-支付中 2-支付成功 3-支付失败 4-已取消 5-已退款

  @Column({ name: 'payment_channel', type: 'varchar', length: 50 })
  paymentChannel: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ name: 'third_payment_no', type: 'varchar', length: 128, nullable: true })
  thirdPaymentNo: string;

  @Column({ name: 'pay_url', type: 'varchar', length: 512, nullable: true })
  payUrl: string;

  @Column({ name: 'qr_code', type: 'varchar', length: 512, nullable: true })
  qrCode: string;

  @Column({ name: 'expire_time', type: 'datetime', nullable: true })
  expireTime: Date;

  @Column({ name: 'paid_time', type: 'datetime', nullable: true })
  paidTime: Date;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retry', type: 'int', default: 3 })
  maxRetry: number;

  @Column({ name: 'error_msg', type: 'text', nullable: true })
  errorMsg: string;

  @Column({ name: 'request_data', type: 'json', nullable: true })
  requestData: any;

  @Column({ name: 'response_data', type: 'json', nullable: true })
  responseData: any;

  @Column({ name: 'notify_data', type: 'json', nullable: true })
  notifyData: any;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
