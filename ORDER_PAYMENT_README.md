# 订单和支付管理功能说明

## 功能概述

本次更新实现了三个核心管理功能：
1. **订单管理** - 订单列表查询、订单详情查看、支付信息查看
2. **支付订单管理** - 支付记录列表查询、多条件筛选
3. **支付渠道配置** - 支付渠道的增删改查管理

## 目录结构

### 后端 (meimei_server)
```
server/meimei_server/src/modules/biz/
├── order/
│   ├── dto/
│   │   └── req-order.dto.ts              # 订单查询DTO
│   ├── entities/
│   │   ├── order.entity.ts               # 订单实体
│   │   └── order-item.entity.ts          # 订单项实体
│   ├── order.controller.ts               # 订单控制器（已更新）
│   └── order.service.ts                  # 订单服务（已更新）
└── payment/
    ├── dto/
    │   └── query-payment.dto.ts          # 支付查询DTO（新增）
    ├── entities/
    │   ├── payment-order.entity.ts       # 支付订单实体
    │   └── payment-channel.entity.ts     # 支付渠道实体
    ├── controllers/
    │   └── payment-admin.controller.ts   # 支付管理控制器（新增）
    ├── services/
    │   └── payment.service.ts            # 支付服务（已更新）
    └── payment.module.ts                 # 支付模块（已更新）
```

### 前端 (meimei_ui_vue3)
```
server/meimei_ui_vue3/src/
├── api/biz/
│   ├── order.js                          # 订单API（新增）
│   └── payment.js                        # 支付API（新增）
├── views/biz/
│   ├── order/
│   │   └── index.vue                     # 订单管理页面（新增）
│   └── payment/
│       ├── order.vue                     # 支付订单页面（新增）
│       └── channel.vue                   # 支付渠道页面（新增）
└── router/
    └── index.js                          # 路由配置（已更新）
```

## API接口说明

### 1. 订单管理接口

#### 1.1 订单列表查询
- **接口**: `GET /biz/order/list`
- **权限**: `biz:order:query`
- **查询参数**:
  - `pageNum`: 页码
  - `pageSize`: 每页数量
  - `orderNo`: 订单编号（模糊查询）
  - `startTime`: 创建开始时间
  - `endTime`: 创建截止时间

#### 1.2 订单详情查询
- **接口**: `GET /biz/order/detail/:orderNo`
- **权限**: `biz:order:query`
- **返回**: 订单基本信息 + 订单项列表（包含产品名、图片、规格编号、尺码等）

#### 1.3 订单支付信息查询
- **接口**: `GET /biz/order/payments/:orderNo`
- **权限**: `biz:order:query`
- **返回**: 该订单的所有支付记录列表

### 2. 支付订单接口

#### 2.1 支付订单列表查询
- **接口**: `GET /biz/payment/order/list`
- **权限**: `biz:payment:query`
- **查询参数**:
  - `pageNum`: 页码
  - `pageSize`: 每页数量
  - `orderNo`: 订单编号（模糊查询）
  - `paymentNo`: 支付编号（模糊查询）
  - `startTime`: 支付开始时间
  - `endTime`: 支付截止时间
  - `status`: 支付状态（0-待支付 1-支付中 2-支付成功 3-支付失败 4-已取消 5-已退款）
- **默认行为**: 如果不传时间参数，默认查询当天的支付信息

### 3. 支付渠道接口

#### 3.1 支付渠道列表查询
- **接口**: `GET /biz/payment/channel/list`
- **权限**: `biz:channel:query`
- **查询参数**:
  - `pageNum`: 页码
  - `pageSize`: 每页数量
  - `channelCode`: 渠道编码（模糊查询）
  - `channelName`: 渠道名称（模糊查询）
  - `channelType`: 渠道类型
  - `isActive`: 是否启用（0-禁用 1-启用）

#### 3.2 支付渠道详情
- **接口**: `GET /biz/payment/channel/:id`
- **权限**: `biz:channel:query`

#### 3.3 新增支付渠道
- **接口**: `POST /biz/payment/channel`
- **权限**: `biz:channel:add`
- **请求体**:
```json
{
  "channelCode": "X_PAY_CREDIT",
  "channelName": "X支付-信用卡",
  "channelType": "CREDIT_CARD",
  "platformKey": "pk_test_xxx",
  "platformSecret": "sk_test_xxx",
  "siteCode": "TESTSITE001",
  "apiBaseUrl": "https://api.xpay.com",
  "apiVersion": "v1",
  "notifyUrl": "https://store.fif.com/api/payment/notify/xpay",
  "supportedCurrencies": ["USD", "IDR", "EUR", "GBP"],
  "supportedMethods": ["CREDIT_CARD", "VISA", "MASTERCARD"],
  "minAmount": 1.00,
  "maxAmount": 999999.99,
  "feeRate": 0.029,
  "isActive": 1,
  "priority": 1,
  "sortOrder": 1,
  "config": {"timeout": 30},
  "remark": "X支付信用卡通道"
}
```

#### 3.4 修改支付渠道
- **接口**: `PUT /biz/payment/channel`
- **权限**: `biz:channel:edit`
- **请求体**: 同新增，需包含 `id` 字段

#### 3.5 删除支付渠道
- **接口**: `DELETE /biz/payment/channel/:ids`
- **权限**: `biz:channel:remove`
- **说明**: ids为逗号分隔的ID字符串，支持批量删除

## 数据库初始化

执行以下SQL文件添加菜单和权限：

```bash
mysql -u root -p your_database < server/meimei_server/database/order_payment_menu.sql
```

**注意**: 
- 需要修改SQL中的 `parent_id=2000` 为实际的"业务管理"菜单ID
- 执行后需要在角色管理中为相应角色分配这些菜单权限

## 功能特性

### 订单管理页面
- ✅ 支持按订单编号、创建时间范围查询
- ✅ 点击订单编号查看详情（弹窗显示订单信息和商品列表）
- ✅ 商品列表展示：产品名、图片、规格编号、尺码、数量、价格
- ✅ 点击支付编号查看支付信息（弹窗显示该订单的所有支付记录）

### 支付订单页面
- ✅ 支持按订单编号、支付编号、状态、支付时间范围查询
- ✅ 默认查询当天的支付信息
- ✅ 支付状态用不同颜色的标签区分
- ✅ 显示完整的支付信息（支付渠道、支付方式、第三方支付编号等）

### 支付渠道配置页面
- ✅ 支持按渠道编码、名称、类型、状态查询
- ✅ 新增渠道配置（完整的表单验证）
- ✅ 编辑渠道配置
- ✅ 删除渠道配置（支持批量删除）
- ✅ 渠道状态启用/禁用
- ✅ 优先级和排序设置
- ✅ 费率配置（支持小数点后4位）

## 权限配置

需要在系统管理中配置以下权限：

### 菜单权限
- `biz:order:list` - 订单管理菜单
- `biz:payment:list` - 支付订单菜单
- `biz:channel:list` - 支付渠道菜单

### 按钮权限
- `biz:order:query` - 订单查询
- `biz:order:detail` - 订单详情
- `biz:payment:query` - 支付订单查询
- `biz:channel:query` - 支付渠道查询
- `biz:channel:add` - 支付渠道新增
- `biz:channel:edit` - 支付渠道修改
- `biz:channel:remove` - 支付渠道删除

## 使用流程

1. **部署后端**
   - 确保数据库表已创建（biz_order, biz_order_item, biz_payment_order, biz_payment_channel）
   - 执行菜单SQL添加菜单和权限
   - 重启后端服务

2. **部署前端**
   - 前端代码已包含所有页面和路由
   - 重新编译部署前端项目

3. **配置权限**
   - 登录管理后台
   - 进入"系统管理" -> "角色管理"
   - 为相应角色勾选新增的菜单权限
   - 保存后重新登录生效

4. **使用功能**
   - 访问"业务管理"菜单下的三个子菜单
   - 订单管理：查看订单、查看详情、查看支付信息
   - 支付订单：查询支付记录、筛选状态
   - 支付渠道：配置支付通道、管理费率等

## 注意事项

1. **金额单位**: 订单金额使用"分"为单位，前端展示时会自动转换为元
2. **时间格式**: 时间查询使用 `YYYY-MM-DD HH:mm:ss` 格式
3. **支付状态**: 
   - 0-待支付
   - 1-支付中
   - 2-支付成功
   - 3-支付失败
   - 4-已取消
   - 5-已退款
4. **渠道编码**: 渠道编码必须唯一，新增时会进行校验
5. **费率设置**: 费率范围为0-1，如0.029表示2.9%

## 技术栈

### 后端
- NestJS + TypeORM
- MySQL数据库
- Swagger API文档

### 前端
- Vue 3 + Composition API
- Element Plus UI组件库
- Vue Router路由管理
- Axios HTTP请求

## 后续优化建议

1. 添加订单状态变更日志功能
2. 实现订单导出功能（Excel）
3. 添加支付渠道测试功能
4. 实现支付对账功能
5. 添加订单统计报表
6. 实现订单自动取消（超时未支付）
7. 添加退款管理功能
