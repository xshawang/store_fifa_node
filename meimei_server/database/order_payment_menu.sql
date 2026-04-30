-- =============================================
-- 订单和支付管理菜单SQL
-- 创建日期: 2026-04-30
-- 说明: 添加订单管理、支付订单、支付渠道菜单和权限
-- =============================================

-- 插入订单管理菜单（一级菜单 - 业务管理下的子菜单）
-- 假设业务管理的父菜单ID为2000，需要根据实际情况调整
INSERT INTO `sys_menu` (
  `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, 
  `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, 
  `create_by`, `create_time`, `update_by`, `update_time`, `remark`
) VALUES 
('订单管理', 2000, 1, 'order', 'biz/order/index', NULL, 1, 0, 'C', '0', '0', 'biz:order:list', 'guide', 'admin', NOW(), '', NULL, '订单管理菜单'),
('支付订单', 2000, 2, 'payment-order', 'biz/payment/order', NULL, 1, 0, 'C', '0', '0', 'biz:payment:list', 'money', 'admin', NOW(), '', NULL, '支付订单菜单'),
('支付渠道', 2000, 3, 'payment-channel', 'biz/payment/channel', NULL, 1, 0, 'C', '0', '0', 'biz:channel:list', 'config', 'admin', NOW(), '', NULL, '支付渠道菜单');

-- 获取刚插入的菜单ID（需要根据实际数据库调整）
SET @order_menu_id = LAST_INSERT_ID() - 2;
SET @payment_order_menu_id = LAST_INSERT_ID() - 1;
SET @payment_channel_menu_id = LAST_INSERT_ID();

-- 插入订单管理按钮权限
INSERT INTO `sys_menu` (
  `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, 
  `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, 
  `create_by`, `create_time`, `update_by`, `update_time`, `remark`
) VALUES 
('订单查询', @order_menu_id, 1, '#', '', NULL, 1, 0, 'F', '0', '0', 'biz:order:query', '#', 'admin', NOW(), '', NULL, ''),
('订单详情', @order_menu_id, 2, '#', '', NULL, 1, 0, 'F', '0', '0', 'biz:order:detail', '#', 'admin', NOW(), '', NULL, '');

-- 插入支付订单按钮权限
INSERT INTO `sys_menu` (
  `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, 
  `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, 
  `create_by`, `create_time`, `update_by`, `update_time`, `remark`
) VALUES 
('支付订单查询', @payment_order_menu_id, 1, '#', '', NULL, 1, 0, 'F', '0', '0', 'biz:payment:query', '#', 'admin', NOW(), '', NULL, '');

-- 插入支付渠道按钮权限
INSERT INTO `sys_menu` (
  `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, 
  `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, 
  `create_by`, `create_time`, `update_by`, `update_time`, `remark`
) VALUES 
('支付渠道查询', @payment_channel_menu_id, 1, '#', '', NULL, 1, 0, 'F', '0', '0', 'biz:channel:query', '#', 'admin', NOW(), '', NULL, ''),
('支付渠道新增', @payment_channel_menu_id, 2, '#', '', NULL, 1, 0, 'F', '0', '0', 'biz:channel:add', '#', 'admin', NOW(), '', NULL, ''),
('支付渠道修改', @payment_channel_menu_id, 3, '#', '', NULL, 1, 0, 'F', '0', '0', 'biz:channel:edit', '#', 'admin', NOW(), '', NULL, ''),
('支付渠道删除', @payment_channel_menu_id, 4, '#', '', NULL, 1, 0, 'F', '0', '0', 'biz:channel:remove', '#', 'admin', NOW(), '', NULL, '');

-- 说明：
-- 1. parent_id=2000 需要根据实际的"业务管理"菜单ID进行调整
-- 2. 如果菜单已存在，请先删除或使用UPDATE语句
-- 3. 执行后需要给角色分配这些菜单权限
-- 4. 权限标识说明：
--    - biz:order:list - 订单列表页面权限
--    - biz:order:query - 订单查询接口权限
--    - biz:order:detail - 订单详情接口权限
--    - biz:payment:list - 支付订单列表页面权限
--    - biz:payment:query - 支付订单查询接口权限
--    - biz:channel:list - 支付渠道列表页面权限
--    - biz:channel:query - 支付渠道查询接口权限
--    - biz:channel:add - 支付渠道新增接口权限
--    - biz:channel:edit - 支付渠道修改接口权限
--    - biz:channel:remove - 支付渠道删除接口权限
