-- =============================================
-- 订单与支付系统表结构
-- 创建日期: 2026-02-05
-- 说明: 包含订单主表、订单明细表、支付记录表
-- =============================================

-- =============================================
-- 1. 订单主表 (biz_order)
-- =============================================
CREATE TABLE IF NOT EXISTS `biz_order` (
  `order_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '订单ID（主键）',
  
  -- 订单基本信息
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号（唯一，业务使用）',
  `user_id` VARCHAR(500) NOT NULL COMMENT '用户标识（从cookie _shopify_y提取）',
  `token` VARCHAR(500) NOT NULL COMMENT '购物车标识（从cookie cart提取）',
  
  -- 订单状态
  `order_status` TINYINT NOT NULL DEFAULT 0 COMMENT '订单状态：0-待支付 1-已支付 2-已发货 3-已完成 4-已取消 5-退款中 6-已退款',
  `payment_status` TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态：0-未支付 1-支付中 2-已支付 3-支付失败 4-已退款',
  
  -- 金额信息（单位：分，避免浮点数精度问题）
  `subtotal_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '商品小计（分）',
  `shipping_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '配送费用（分）',
  `tax_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '税费（分）',
  `discount_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '折扣金额（分）',
  `total_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '订单总金额（分）',
  `paid_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '已支付金额（分）',
  
  -- 货币信息
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD' COMMENT '货币代码（USD, CNY等）',
  
  -- 收货信息
  `email` VARCHAR(200) DEFAULT NULL COMMENT '邮箱地址',
  `country_code` VARCHAR(10) DEFAULT NULL COMMENT '国家代码（US, CN等）',
  `first_name` VARCHAR(100) DEFAULT NULL COMMENT '收货人名字',
  `last_name` VARCHAR(100) DEFAULT NULL COMMENT '收货人姓氏',
  `full_name` VARCHAR(200) DEFAULT NULL COMMENT '收货人全名',
  `phone` VARCHAR(50) DEFAULT NULL COMMENT '联系电话',
  `address1` VARCHAR(500) DEFAULT NULL COMMENT '地址行1',
  `address2` VARCHAR(500) DEFAULT NULL COMMENT '地址行2',
  `city` VARCHAR(100) DEFAULT NULL COMMENT '城市',
  `province` VARCHAR(100) DEFAULT NULL COMMENT '省份/州',
  `postal_code` VARCHAR(20) DEFAULT NULL COMMENT '邮政编码',
  `country` VARCHAR(100) DEFAULT NULL COMMENT '国家',
  `zone` VARCHAR(100) DEFAULT NULL COMMENT '区域/地区',
  
  -- 配送信息
  `shipping_method_id` VARCHAR(100) DEFAULT NULL COMMENT '配送方式ID',
  `shipping_method_name` VARCHAR(200) DEFAULT NULL COMMENT '配送方式名称',
  `tracking_number` VARCHAR(100) DEFAULT NULL COMMENT '物流追踪号',
  `shipping_carrier` VARCHAR(100) DEFAULT NULL COMMENT '物流承运商',
  
  -- 支付信息
  `payment_method` VARCHAR(50) DEFAULT NULL COMMENT '支付方式：credit_card, paypal, shop_pay, google_pay, apple_pay',
  `payment_transaction_id` VARCHAR(200) DEFAULT NULL COMMENT '支付交易号（第三方支付平台返回）',
  
  -- 促销信息
  `discount_code` VARCHAR(50) DEFAULT NULL COMMENT '折扣码',
  `coupon_id` BIGINT DEFAULT NULL COMMENT '优惠券ID',
  
  -- 备注信息
  `customer_note` TEXT DEFAULT NULL COMMENT '客户备注',
  `admin_note` TEXT DEFAULT NULL COMMENT '管理员备注',
  
  -- 时间信息
  `paid_at` DATETIME DEFAULT NULL COMMENT '支付时间',
  `shipped_at` DATETIME DEFAULT NULL COMMENT '发货时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `cancelled_at` DATETIME DEFAULT NULL COMMENT '取消时间',
  
  -- IP和设备信息
  `ip_address` VARCHAR(50) DEFAULT NULL COMMENT '下单IP地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  
  -- 软删除
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除：0-否 1-是',
  
  -- 标准字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` VARCHAR(100) DEFAULT NULL COMMENT '创建人',
  `updated_by` VARCHAR(100) DEFAULT NULL COMMENT '更新人',
  
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`(255)),
  KEY `idx_token` (`token`(255)),
  KEY `idx_order_status` (`order_status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_paid_at` (`paid_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';


-- =============================================
-- 2. 订单明细表 (biz_order_item)
-- =============================================
CREATE TABLE IF NOT EXISTS `biz_order_item` (
  `item_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '明细ID（主键）',
  
  -- 关联信息
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  
  -- 商品信息
  `product_id` BIGINT DEFAULT NULL COMMENT '产品ID',
  `sku_id` BIGINT NOT NULL COMMENT 'SKU ID',
  `variant_id` VARCHAR(50) DEFAULT NULL COMMENT '变体ID',
  `product_name` VARCHAR(500) NOT NULL COMMENT '产品名称',
  `variant_name` VARCHAR(500) DEFAULT NULL COMMENT '变体名称（如：尺码、颜色）',
  `product_image` VARCHAR(500) DEFAULT NULL COMMENT '产品图片URL',
  `product_url` VARCHAR(500) DEFAULT NULL COMMENT '产品详情页URL',
  
  -- SKU信息
  `sku_code` VARCHAR(100) DEFAULT NULL COMMENT 'SKU编码',
  `size` VARCHAR(100) DEFAULT NULL COMMENT '尺码',
  `color` VARCHAR(100) DEFAULT NULL COMMENT '颜色',
  `weight` DECIMAL(10,2) DEFAULT NULL COMMENT '重量（kg）',
  
  -- 价格信息（单位：分）
  `original_price` BIGINT NOT NULL COMMENT '原价（分）',
  `sale_price` BIGINT NOT NULL COMMENT '售价（分）',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '购买数量',
  `subtotal_amount` BIGINT NOT NULL COMMENT '小计金额（分）= sale_price * quantity',
  `discount_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '折扣金额（分）',
  `tax_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '税费（分）',
  `total_amount` BIGINT NOT NULL COMMENT '总金额（分）',
  
  -- 库存快照（下单时的库存信息）
  `stock_snapshot` INT DEFAULT NULL COMMENT '下单时库存数量',
  
  -- 履行状态
  `fulfillment_status` TINYINT NOT NULL DEFAULT 0 COMMENT '履行状态：0-未发货 1-部分发货 2-已发货 3-已收货',
  `shipped_quantity` INT NOT NULL DEFAULT 0 COMMENT '已发货数量',
  
  -- 退货信息
  `return_quantity` INT NOT NULL DEFAULT 0 COMMENT '退货数量',
  `return_reason` VARCHAR(500) DEFAULT NULL COMMENT '退货原因',
  
  -- 标准字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`item_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_sku_id` (`sku_id`),
  KEY `idx_fulfillment_status` (`fulfillment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';


-- =============================================
-- 3. 支付记录表 (biz_payment)
-- =============================================
CREATE TABLE IF NOT EXISTS `biz_payment` (
  `payment_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '支付ID（主键）',
  
  -- 关联信息
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  `user_id` VARCHAR(500) NOT NULL COMMENT '用户标识',
  
  -- 支付基本信息
  `payment_no` VARCHAR(50) NOT NULL COMMENT '支付流水号（唯一）',
  `payment_method` VARCHAR(50) NOT NULL COMMENT '支付方式：credit_card, paypal, shop_pay, google_pay, apple_pay',
  `payment_provider` VARCHAR(100) DEFAULT NULL COMMENT '支付服务商：stripe, paypal, shopify_payments等',
  
  -- 金额信息（单位：分）
  `payment_amount` BIGINT NOT NULL COMMENT '支付金额（分）',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD' COMMENT '货币代码',
  `fee_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '手续费（分）',
  `net_amount` BIGINT NOT NULL COMMENT '净收入（分）= payment_amount - fee_amount',
  
  -- 支付状态
  `payment_status` TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态：0-待支付 1-支付中 2-支付成功 3-支付失败 4-已退款 5-退款中',
  
  -- 第三方平台信息
  `transaction_id` VARCHAR(200) DEFAULT NULL COMMENT '第三方交易号',
  `provider_response` JSON DEFAULT NULL COMMENT '支付平台返回的完整响应（JSON）',
  `provider_request` JSON DEFAULT NULL COMMENT '发送给支付平台的请求（JSON）',
  
  -- 银行卡信息（仅信用卡支付）
  `card_brand` VARCHAR(50) DEFAULT NULL COMMENT '卡品牌：visa, mastercard, amex等',
  `card_last4` VARCHAR(10) DEFAULT NULL COMMENT '卡号后4位',
  `card_exp_month` VARCHAR(10) DEFAULT NULL COMMENT '卡有效期月份',
  `card_exp_year` VARCHAR(10) DEFAULT NULL COMMENT '卡有效期年份',
  `card_fingerprint` VARCHAR(200) DEFAULT NULL COMMENT '卡指纹（用于防重复）',
  
  -- 支付时间
  `paid_at` DATETIME DEFAULT NULL COMMENT '支付成功时间',
  `failed_at` DATETIME DEFAULT NULL COMMENT '支付失败时间',
  `failure_reason` VARCHAR(500) DEFAULT NULL COMMENT '失败原因',
  
  -- 退款信息
  `refunded_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '已退款金额（分）',
  `refund_count` INT NOT NULL DEFAULT 0 COMMENT '退款次数',
  `first_refund_at` DATETIME DEFAULT NULL COMMENT '首次退款时间',
  `last_refund_at` DATETIME DEFAULT NULL COMMENT '最后退款时间',
  
  -- 风控信息
  `risk_level` VARCHAR(20) DEFAULT NULL COMMENT '风险等级：low, medium, high',
  `risk_score` DECIMAL(5,2) DEFAULT NULL COMMENT '风险评分',
  `ip_address` VARCHAR(50) DEFAULT NULL COMMENT '支付IP地址',
  
  -- 备注
  `payment_note` VARCHAR(500) DEFAULT NULL COMMENT '支付备注',
  
  -- 标准字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  UNIQUE KEY `uk_transaction_id` (`transaction_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`(255)),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_paid_at` (`paid_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';


-- =============================================
-- 4. 退款记录表 (biz_refund)
-- =============================================
CREATE TABLE IF NOT EXISTS `biz_refund` (
  `refund_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '退款ID（主键）',
  
  -- 关联信息
  `payment_id` BIGINT NOT NULL COMMENT '支付ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  `payment_no` VARCHAR(50) NOT NULL COMMENT '支付流水号',
  
  -- 退款信息
  `refund_no` VARCHAR(50) NOT NULL COMMENT '退款流水号（唯一）',
  `refund_type` VARCHAR(50) NOT NULL COMMENT '退款类型：full-全额退款, partial-部分退款',
  `refund_reason` VARCHAR(500) NOT NULL COMMENT '退款原因',
  
  -- 金额信息（单位：分）
  `refund_amount` BIGINT NOT NULL COMMENT '退款金额（分）',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD' COMMENT '货币代码',
  `fee_refund_amount` BIGINT NOT NULL DEFAULT 0 COMMENT '退还手续费（分）',
  
  -- 退款状态
  `refund_status` TINYINT NOT NULL DEFAULT 0 COMMENT '退款状态：0-申请中 1-处理中 2-退款成功 3-退款失败 4-已取消',
  
  -- 第三方平台信息
  `refund_transaction_id` VARCHAR(200) DEFAULT NULL COMMENT '第三方退款交易号',
  `provider_response` JSON DEFAULT NULL COMMENT '支付平台返回的完整响应（JSON）',
  
  -- 时间信息
  `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `processed_at` DATETIME DEFAULT NULL COMMENT '处理时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `failed_at` DATETIME DEFAULT NULL COMMENT '失败时间',
  `failure_reason` VARCHAR(500) DEFAULT NULL COMMENT '失败原因',
  
  -- 操作信息
  `requested_by` VARCHAR(100) DEFAULT NULL COMMENT '申请人',
  `processed_by` VARCHAR(100) DEFAULT NULL COMMENT '处理人',
  `approved_by` VARCHAR(100) DEFAULT NULL COMMENT '审批人',
  
  -- 备注
  `refund_note` TEXT DEFAULT NULL COMMENT '退款备注',
  
  -- 标准字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`refund_id`),
  UNIQUE KEY `uk_refund_no` (`refund_no`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_refund_status` (`refund_status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款记录表';


-- =============================================
-- 5. 订单状态日志表 (biz_order_status_log)
-- =============================================
CREATE TABLE IF NOT EXISTS `biz_order_status_log` (
  `log_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID（主键）',
  
  -- 关联信息
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  
  -- 状态变更
  `from_status` VARCHAR(50) DEFAULT NULL COMMENT '原状态',
  `to_status` VARCHAR(50) NOT NULL COMMENT '新状态',
  `status_type` VARCHAR(50) NOT NULL COMMENT '状态类型：order-订单状态, payment-支付状态, fulfillment-履行状态',
  
  -- 变更信息
  `changed_by` VARCHAR(100) DEFAULT NULL COMMENT '变更人',
  `change_reason` VARCHAR(500) DEFAULT NULL COMMENT '变更原因',
  `change_note` TEXT DEFAULT NULL COMMENT '变更备注',
  
  -- 额外信息
  `extra_data` JSON DEFAULT NULL COMMENT '额外数据（JSON）',
  
  -- 标准字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (`log_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_status_type` (`status_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单状态日志表';


-- =============================================
-- 6. 购物车转订单关联表 (biz_cart_order_relation)
-- =============================================
CREATE TABLE IF NOT EXISTS `biz_cart_order_relation` (
  `relation_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '关联ID（主键）',
  
  -- 关联信息
  `cart_id` BIGINT NOT NULL COMMENT '购物车ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  
  -- 转换信息
  `converted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '转换时间',
  `cart_quantity` INT NOT NULL COMMENT '购物车中的数量',
  `order_quantity` INT NOT NULL COMMENT '订单中的数量',
  
  -- 标准字段
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (`relation_id`),
  KEY `idx_cart_id` (`cart_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`),
  UNIQUE KEY `uk_cart_order` (`cart_id`, `order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车转订单关联表';


-- =============================================
-- 索引优化建议
-- =============================================

-- 订单表复合索引
ALTER TABLE `biz_order` 
  ADD INDEX `idx_user_status` (`user_id`(255), `order_status`),
  ADD INDEX `idx_created_status` (`created_at`, `order_status`),
  ADD INDEX `idx_payment_method_status` (`payment_method`, `payment_status`);

-- 订单明细表复合索引
ALTER TABLE `biz_order_item`
  ADD INDEX `idx_order_sku` (`order_id`, `sku_id`),
  ADD INDEX `idx_product_sku` (`product_id`, `sku_id`);

-- 支付表复合索引
ALTER TABLE `biz_payment`
  ADD INDEX `idx_order_status` (`order_id`, `payment_status`),
  ADD INDEX `idx_user_created` (`user_id`(255), `created_at`);


-- =============================================
-- 外键约束（可选，根据业务需求决定是否启用）
-- =============================================

-- 注意：生产环境中通常不建议使用外键，而是在应用层维护数据一致性
-- 如果需要启用，取消下面的注释即可

-- ALTER TABLE `biz_order_item`
--   ADD CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `biz_order` (`order_id`) ON DELETE CASCADE;

-- ALTER TABLE `biz_payment`
--   ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `biz_order` (`order_id`) ON DELETE CASCADE;

-- ALTER TABLE `biz_refund`
--   ADD CONSTRAINT `fk_refund_payment` FOREIGN KEY (`payment_id`) REFERENCES `biz_payment` (`payment_id`) ON DELETE CASCADE,
--   ADD CONSTRAINT `fk_refund_order` FOREIGN KEY (`order_id`) REFERENCES `biz_order` (`order_id`) ON DELETE CASCADE;

-- ALTER TABLE `biz_order_status_log`
--   ADD CONSTRAINT `fk_status_log_order` FOREIGN KEY (`order_id`) REFERENCES `biz_order` (`order_id`) ON DELETE CASCADE;

-- ALTER TABLE `biz_cart_order_relation`
--   ADD CONSTRAINT `fk_cart_relation_cart` FOREIGN KEY (`cart_id`) REFERENCES `biz_cart` (`cart_id`) ON DELETE CASCADE,
--   ADD CONSTRAINT `fk_cart_relation_order` FOREIGN KEY (`order_id`) REFERENCES `biz_order` (`order_id`) ON DELETE CASCADE;


-- =============================================
-- 测试数据示例
-- =============================================

-- 插入测试订单
-- INSERT INTO `biz_order` (
--   `order_no`, `user_id`, `token`, `order_status`, `payment_status`,
--   `subtotal_amount`, `shipping_amount`, `tax_amount`, `discount_amount`, `total_amount`, `paid_amount`,
--   `currency`, `email`, `country_code`, `first_name`, `last_name`, `phone`,
--   `address1`, `address2`, `city`, `province`, `postal_code`, `country`,
--   `payment_method`
-- ) VALUES (
--   'ORD20260205001', 'user_test_001', 'cart_token_001', 1, 2,
--   15999, 999, 1200, 0, 18198, 18198,
--   'USD', 'test@example.com', 'US', 'John', 'Doe', '+1234567890',
--   '123 Main St', 'Apt 4B', 'New York', 'NY', '10001', 'United States',
--   'credit_card'
-- );
