-- 创建购物车表 (biz_cart)
CREATE TABLE IF NOT EXISTS `biz_cart` (
    
  `cart_id` INT NOT NULL AUTO_INCREMENT COMMENT '购物车ID（主键）',
  `token` varchar(200) not null comment '购物车标识（从cookie中提取）',
  `user_id` VARCHAR(500) NOT NULL COMMENT '用户标识（从cookie中提取）',
  `product_id` INT NOT NULL COMMENT '产品ID',
  `variant_id` VARCHAR(50) NULL COMMENT '变体ID',
  `size` VARCHAR(100) NULL COMMENT '尺码',
  `form_type` VARCHAR(50) NULL DEFAULT 'product' COMMENT '表单类型',
  `quantity` INT NULL DEFAULT 1 COMMENT '数量',
  `section_id` VARCHAR(200) NULL COMMENT 'section ID',
  `sections` VARCHAR(500) NULL COMMENT 'sections',
  `sections_url` VARCHAR(500) NULL COMMENT 'sections URL',
  `product_name` VARCHAR(500) NULL COMMENT '产品名称',
  `price` DECIMAL(10,2) NULL COMMENT '产品价格',
  `product_url` VARCHAR(500) NULL COMMENT '产品URL',
  `status` INT NULL DEFAULT 1 COMMENT '状态：0-已删除 1-正常',
  `create_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` VARCHAR(30) NULL DEFAULT '' COMMENT '创建人',
  `update_by` VARCHAR(30) NULL DEFAULT '' COMMENT '更新人',
  `remark` VARCHAR(255) NULL DEFAULT '' COMMENT '备注',
  `version` INT NULL DEFAULT 0 COMMENT '版本号',
  PRIMARY KEY (`cart_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_variant_id` (`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';
