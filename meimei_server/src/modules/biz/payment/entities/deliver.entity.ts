import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 配送信息实体
 */
@Entity('biz_deliver')
@Index('idx_user_id', ['userId'])
export class DeliverEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'order_no', type: 'varchar', length: 64})
  orderNo: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'recipient_name', type: 'varchar', length: 100 })
  recipientName: string;

  @Column({ name: 'recipient_phone', type: 'varchar', length: 50 })
  recipientPhone: string;

  @Column({ name: 'recipient_email', type: 'varchar', length: 100})
  recipientEmail: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ name: 'country_code', type: 'varchar', length: 10 })
  countryCode: string;

  @Column({ type: 'varchar', length: 100 })
  province: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  district: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ type: 'varchar', length: 200 })
  company: string;

  @Column({ name: 'address_line1', type: 'varchar', length: 300 })
  addressLine1: string;

  @Column({ name: 'address_line2', type: 'varchar', length: 300 })
  addressLine2: string;

  @Column({ name: 'is_default', type: 'tinyint', default: 0 })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 1000 })
  remark: string;
}
