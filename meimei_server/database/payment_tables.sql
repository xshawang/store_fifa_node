-- ============================================
-- 支付模块数据库表结构
-- ============================================

-- 1. 支付订单表
CREATE TABLE IF NOT EXISTS `biz_payment_order` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `payment_no` VARCHAR(64) NOT NULL COMMENT '支付订单号（系统生成）',
  `order_no` VARCHAR(64) NOT NULL COMMENT '业务订单号',
  `user_id` VARCHAR(64) DEFAULT NULL COMMENT '用户ID',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '支付金额',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD' COMMENT '货币代码',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态: 0-待支付 1-支付中 2-支付成功 3-支付失败 4-已取消 5-已退款',
  `payment_channel` VARCHAR(50) NOT NULL COMMENT '支付通道编码',
  `payment_method` VARCHAR(50) NOT NULL COMMENT '支付方式编码',
  `third_payment_no` VARCHAR(128) DEFAULT NULL COMMENT '第三方支付订单号',
  `pay_url` VARCHAR(512) DEFAULT NULL COMMENT '支付链接',
  `qr_code` VARCHAR(512) DEFAULT NULL COMMENT '二维码链接',
  `expire_time` DATETIME DEFAULT NULL COMMENT '支付过期时间',
  `paid_time` DATETIME DEFAULT NULL COMMENT '支付完成时间',
  `retry_count` INT NOT NULL DEFAULT 0 COMMENT '重试次数',
  `max_retry` INT NOT NULL DEFAULT 3 COMMENT '最大重试次数',
  `error_msg` TEXT DEFAULT NULL COMMENT '错误信息',
  `request_data` JSON DEFAULT NULL COMMENT '请求参数',
  `response_data` JSON DEFAULT NULL COMMENT '响应数据',
  `notify_data` JSON DEFAULT NULL COMMENT '回调数据',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_third_payment_no` (`third_payment_no`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付订单表';

-- 2. 支付通道配置表
CREATE TABLE IF NOT EXISTS `biz_payment_channel` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `channel_code` VARCHAR(50) NOT NULL COMMENT '通道编码（唯一标识）',
  `channel_name` VARCHAR(100) NOT NULL COMMENT '通道名称',
  `channel_type` VARCHAR(50) NOT NULL COMMENT '通道类型: CREDIT_CARD-信用卡 QRIS-QRIS ALIPAY-支付宝',
  `platform_key` VARCHAR(255) NOT NULL COMMENT '平台Key',
  `platform_secret` VARCHAR(255) NOT NULL COMMENT '平台密钥',
  `site_code` VARCHAR(100) DEFAULT NULL COMMENT '网站编码',
  `api_base_url` VARCHAR(255) NOT NULL COMMENT 'API基础URL',
  `api_version` VARCHAR(20) NOT NULL DEFAULT 'v1' COMMENT 'API版本',
  `notify_url` VARCHAR(512) NOT NULL COMMENT '回调通知地址',
  `supported_currencies` JSON NOT NULL COMMENT '支持的货币列表',
  `supported_methods` JSON NOT NULL COMMENT '支持的支付方式列表',
  `min_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '最小支付金额',
  `max_amount` DECIMAL(10, 2) NOT NULL DEFAULT 999999.99 COMMENT '最大支付金额',
  `fee_rate` DECIMAL(5, 4) NOT NULL DEFAULT 0.0000 COMMENT '费率',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用: 0-禁用 1-启用',
  `priority` INT NOT NULL DEFAULT 0 COMMENT '优先级（数字越小优先级越高）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `config` JSON DEFAULT NULL COMMENT '扩展配置',
  `remark` TEXT DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_code` (`channel_code`),
  KEY `idx_channel_type` (`channel_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付通道配置表';

-- 3. 支付回调日志表
CREATE TABLE IF NOT EXISTS `biz_payment_notify_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `payment_no` VARCHAR(64) NOT NULL COMMENT '支付订单号',
  `channel_code` VARCHAR(50) NOT NULL COMMENT '通道编码',
  `notify_type` VARCHAR(50) NOT NULL COMMENT '回调类型: PAYMENT-支付回调 REFUND-退款回调',
  `notify_data` JSON NOT NULL COMMENT '回调原始数据',
  `verify_status` TINYINT NOT NULL DEFAULT 0 COMMENT '验证状态: 0-待验证 1-验证成功 2-验证失败',
  `process_status` TINYINT NOT NULL DEFAULT 0 COMMENT '处理状态: 0-待处理 1-处理成功 2-处理失败',
  `error_msg` TEXT DEFAULT NULL COMMENT '错误信息',
  `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(512) DEFAULT NULL COMMENT 'User-Agent',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_payment_no` (`payment_no`),
  KEY `idx_channel_code` (`channel_code`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付回调日志表';

-- 4. 配送信息表（补全订单收件信息）
CREATE TABLE IF NOT EXISTS `biz_deliver` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` VARCHAR(64) NOT NULL COMMENT '订单号',
  `user_id` VARCHAR(64) DEFAULT NULL COMMENT '用户ID',
  `recipient_name` VARCHAR(100) NOT NULL COMMENT '收件人姓名',
  `recipient_phone` VARCHAR(50) NOT NULL COMMENT '收件人电话',
  `recipient_email` VARCHAR(100) DEFAULT NULL COMMENT '收件人邮箱',
  `country` VARCHAR(100) NOT NULL COMMENT '国家',
  `country_code` VARCHAR(10) NOT NULL COMMENT '国家代码',
  `province` VARCHAR(100) NOT NULL COMMENT '省/州',
  `city` VARCHAR(100) NOT NULL COMMENT '城市',
  `district` VARCHAR(100) DEFAULT NULL COMMENT '区/县',
  `address` VARCHAR(500) NOT NULL COMMENT '详细地址',
  `postal_code` VARCHAR(20) DEFAULT NULL COMMENT '邮政编码',
  `company` VARCHAR(200) DEFAULT NULL COMMENT '公司名称',
  `address_line1` VARCHAR(300) NOT NULL COMMENT '地址行1',
  `address_line2` VARCHAR(300) DEFAULT NULL COMMENT '地址行2',
  `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认地址: 0-否 1-是',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配送信息表';

-- ============================================
-- 初始化数据
-- ============================================

-- 插入支付通道配置（X支付 - 信用卡）
INSERT INTO `biz_payment_channel` (
  `channel_code`, `channel_name`, `channel_type`,
  `platform_key`, `platform_secret`, `site_code`,
  `api_base_url`, `api_version`, `notify_url`,
  `supported_currencies`, `supported_methods`,
  `min_amount`, `max_amount`, `fee_rate`,
  `is_active`, `priority`, `sort_order`,
  `config`, `remark`
) VALUES (
  'X_PAY_CREDIT', 'X支付-信用卡', 'CREDIT_CARD',
  'pk_test_abcd1234efgh5678', 'sk_test_secret_key_here', 'TESTSITE001',
  'https://api.xpay.com', 'v1', 'https://store.fif.com/api/payment/notify/xpay',
  '["USD", "IDR", "EUR", "GBP"]',
  '["CREDIT_CARD", "VISA", "MASTERCARD"]',
  1.00, 999999.99, 0.0290,
  1, 1, 1,
  '{"timeout": 30, "retry_interval": 5}',
  'X支付信用卡通道，支持Visa、Mastercard'
);

-- 插入支付通道配置（X支付 - Mastercard信用卡）
INSERT INTO `biz_payment_channel` (
  `channel_code`, `channel_name`, `channel_type`,
  `platform_key`, `platform_secret`, `site_code`,
  `api_base_url`, `api_version`, `notify_url`,
  `supported_currencies`, `supported_methods`,
  `min_amount`, `max_amount`, `fee_rate`,
  `is_active`, `priority`, `sort_order`,
  `config`, `remark`
) VALUES (
  'X_PAY_CREDIT_MASTERCARD', 'X支付-Mastercard信用卡', 'CREDIT_CARD',
  'pk_test_mastercard_key_123', 'sk_test_mastercard_secret_456', 'TESTSITE001',
  'https://api.xpay.com', 'v1', 'https://store.fif.com/api/payment/notify/xpay-mastercard',
  '["USD", "EUR", "GBP", "AUD", "CAD"]',
  '["MASTERCARD"]',
  1.00, 999999.99, 0.0250,
  1, 2, 2,
  '{"timeout": 30, "retry_interval": 5}',
  'X支付Mastercard专用通道，仅支持Mastercard信用卡'
);

-- 插入支付通道配置（X支付 - QRIS）
INSERT INTO `biz_payment_channel` (
  `channel_code`, `channel_name`, `channel_type`,
  `platform_key`, `platform_secret`, `site_code`,
  `api_base_url`, `api_version`, `notify_url`,
  `supported_currencies`, `supported_methods`,
  `min_amount`, `max_amount`, `fee_rate`,
  `is_active`, `priority`, `sort_order`,
  `config`, `remark`
) VALUES (
  'X_PAY_QRIS', 'X支付-QRIS', 'QRIS',
  'pk_test_abcd1234efgh5678', 'sk_test_secret_key_here', 'TESTSITE001',
  'https://api.xpay.com', 'v1', 'https://store.fif.com/api/payment/notify/xpay',
  '["IDR"]',
  '["QRIS"]',
  1000.00, 10000000.00, 0.0070,
  1, 2, 2,
  '{"timeout": 30, "retry_interval": 5}',
  'X支付QRIS通道，支持印尼本地支付'
);

-- 插入支付通道配置（X支付 - 支付宝）
INSERT INTO `biz_payment_channel` (
  `channel_code`, `channel_name`, `channel_type`,
  `platform_key`, `platform_secret`, `site_code`,
  `api_base_url`, `api_version`, `notify_url`,
  `supported_currencies`, `supported_methods`,
  `min_amount`, `max_amount`, `fee_rate`,
  `is_active`, `priority`, `sort_order`,
  `config`, `remark`
) VALUES (
  'X_PAY_ALIPAY', 'X支付-支付宝', 'ALIPAY',
  'pk_test_abcd1234efgh5678', 'sk_test_secret_key_here', 'TESTSITE001',
  'https://api.xpay.com', 'v1', 'https://store.fif.com/api/payment/notify/xpay',
  '["USD", "CNY"]',
  '["ALIPAY"]',
  1.00, 999999.99, 0.0250,
  1, 3, 3,
  '{"timeout": 30, "retry_interval": 5}',
  'X支付支付宝通道'
);

-- 插入支付通道配置（PIX_PAY - PIX支付）
INSERT INTO `biz_payment_channel` (
  `channel_code`, `channel_name`, `channel_type`,
  `platform_key`, `platform_secret`, `site_code`,
  `api_base_url`, `api_version`, `notify_url`,
  `supported_currencies`, `supported_methods`,
  `min_amount`, `max_amount`, `fee_rate`,
  `is_active`, `priority`, `sort_order`,
  `config`, `remark`
) VALUES (
  'PIX_PAY', 'PIX支付', 'PIX',
  'pk_test_pixpay_key_here', 'sk_test_pixpay_secret_here', 'TESTSITE001',
  'https://api.pixpay.com', 'v1', 'https://store.fif.com/api/payment/notify/pixpay',
  '["BRL"]',
  '["PIX"]',
  1.00, 999999.99, 0.0150,
  1, 1, 1,
  '{"timeout": 30, "retry_interval": 5, "allowed_ips": ["54.233.234.196","18.229.23.62","56.125.86.62","18.229.182.144","56.125.155.115"]}',
  'PIX_PAY通道，支持巴西PIX即时支付，货币BRL'
);

-- 插入支付通道配置（L_PAY - LPAY聚合支付）
INSERT INTO `biz_payment_channel` (
  `channel_code`, `channel_name`, `channel_type`,
  `platform_key`, `platform_secret`, `site_code`,
  `api_base_url`, `api_version`, `notify_url`,
  `supported_currencies`, `supported_methods`,
  `min_amount`, `max_amount`, `fee_rate`,
  `is_active`, `priority`, `sort_order`,
  `config`, `remark`
) VALUES (
  'L_PAY', 'LPAY聚合支付', 'AGGREGATE',
  'test123', '123456', 'TESTSITE001',
  'https://api.lpay.com', 'v2', 'https://store.fif.com/api/payment/notify/lpay',
  '["USD", "BRL", "EUR", "GBP", "CNY"]',
  '["ALIPAY", "WECHAT", "CREDIT_CARD", "PIX", "QRIS"]',
  1.00, 999999.99, 0.0200,
  1, 1, 1,
  '{"timeout": 30, "retry_interval": 5}',
  'LPAY聚合支付通道，支持多种支付方式'
);

-- 插入支付通道配置（EY_PAY - EYPAY支付）
INSERT INTO `biz_payment_channel` (
  `channel_code`, `channel_name`, `channel_type`,
  `platform_key`, `platform_secret`, `site_code`,
  `api_base_url`, `api_version`, `notify_url`,
  `supported_currencies`, `supported_methods`,
  `min_amount`, `max_amount`, `fee_rate`,
  `is_active`, `priority`, `sort_order`,
  `config`, `remark`
) VALUES (
  'EY_PAY', 'EYPAY支付', 'PIX',
  '23710e8678a74fc0b91f479d730eb3f9', '', '',
  'https://api.eypays.com', 'v1', 'https://store.fif.com/api/payment/notify/eypay',
  '["BRL"]',
  '["PIX"]',
  1.00, 999999.99, 0.0150,
  1, 1, 1,
  '{"timeout": 30, "retry_interval": 5, "allowed_ips": ["54.233.234.196","18.229.23.62","56.125.86.62","18.229.182.144","56.125.155.115"], "merchant_private_key": "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCKid0goeWZGpKc6o/UsJGYdgeRYX3bpUYE1WhJcX9ilwFEhXh2iXJmR+MCPe/WDE0ZrQokfY2gO4Cknj0+99e1fyXpS/LnJZAzAAG2elaxRXFnmQzPCL8+d15fRDviNEGhLUqfZNxj4rx4jOjNXDS60OtyU/Kqpe4k9CKbEXBfEinUNihPPcxJ+e5B/IDhMHTbr/ssnqaWU4Ku/dWIQJYfJOTW59XQhDYzKYTsBIQx8ZG0yVUTksYTXaCEI1uwukRXbmMIV4T7tlRuhcw4+bsBOT++6kBFCyxPf61NttPn5I4NoICeAbXmxqQXpFPG97Dk2OBAe2Fy5sUljjRlBikjAgMBAAECggEALhMTu9qcJYM054MLOs1OXspCUhN+bCJXWxwuht58YymdflB1c9baeTHHSeOXdDS7H6LxEJnBFF01t4n5DIwY7X/P9/sOWdmgT5Xc+/dMBcD2qmG4ZNKf6AKDHGPxFpYSjawmeURuF7o8vEsA0eusjcUVyPwqZJ6yyQ94wuHV4YgDsd6GtxK9VrAk6zDQVZBjn0kgQGNoPwckZCAWnPkiV8XdxgMxPy4JbjKjBDIGOUOS9byaI7ZM+G9wPOQN2wBenfbaDtPXjfQ8qaLEWmiO+AB35/zGgl/eM5oBIx7bZfxUOOSaoES1F2udnWHnR7/g/nNc48G5aeUdD3CCXPk4AQKBgQDx7zpBRqcPGqVw1UOOkBKvfdzOtVQBO2g4sGAuG4jaUMimPvnhRZZoZQZfYvbVAjrBO1MaKeUYXlSMdrUVooiBsmvsLG3xqa3tvAePiWzckRYKibK5IXS2kOM+tpPMCiu+8FbsAkUSmCVpJJZQDlwU+F4st41FwGjlpWwHM1QfAQKBgQCSl8SZTtr/aVWTO1Mw6iwWFXcYn0bJOFkjPmkY0xetU0R0M0jfU4vvZNoTpjdsDwqIM789fjo8659o8YVDG1Ks0WO3A/cH9BK0zgfeSXMbabUt35v9urKwVhNhI/x6BTBxp5cO18lalDNUTrh0RLchmsZlRlPC9FRaoajZpPHsIwKBgQDI+QoyeWeDY4Y1IeOZxNLQ10QaroSW9WuRU+rBwnu/p0XW3A+lc7ILDIjrqgETV2PJaueQn2bBBHNFr8Kjsz2kR7vhF9NI4cQq7Xx2XxmAbEGcBWDi6wjSM6+iQ/aok3ZdibcbHJOWa68AFbWL0THq9Zr9mIiRfdFlmzIPFTN3AQKBgGrOAuKEDpFKqJvF/H3GD+rjJsucuJFA6ckA3sfEfRq+cUCMYQq9r1XzT+RDFVw4tT65HRvrjPj330QxvBtBnAHn6VPdoq17yelLt3XgY+pUITpUEi5SSYCqpiH/eyNYBoy4QxoAZGcHVUKWvFOSAS+NugDttXd0VsVVxVUVlWGrAoGAJKa1hOBNege4MLLQI51brKcUfdpW/m4AyILDWVIm8KZDDkzJnZZYs2gcIxtVGI5acdEFkfh+qGNFyr+Aya1g6AcrI47nK1bb0V3wgKXBEZ/GqP1HNPnf2C0rlXUjp5KdNbhThLByfcDmL7Dz2veVPauDvfTANojON0RpXG2sFrY="}',
  'EYPAY通道，支持巴西PIX支付，使用RSA签名验证'
);
