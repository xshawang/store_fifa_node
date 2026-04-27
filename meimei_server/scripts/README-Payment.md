# 支付模块（Payment Module）

## 📋 概述

支付模块是一个完整的支付解决方案，采用**策略模式**实现多支付通道支持，具备**自动重试**和**通道切换**能力。

## ✨ 核心特性

- ✅ **策略模式** - 易于扩展新的支付通道
- ✅ **自动重试** - 支付失败自动重试（可配置）
- ✅ **通道切换** - 按优先级和支付方式自动选择通道
- ✅ **回调处理** - 完整的支付回调验证和处理
- ✅ **日志记录** - 详细的支付日志和回调日志
- ✅ **配送信息** - 自动补全订单收件信息

## 📁 文件结构

```
database/
└── payment_tables.sql          # 数据库表结构SQL

src/modules/biz/payment/
├── interfaces/
│   └── payment-strategy.interface.ts  # 支付策略接口

scripts/
├── 支付模块架构设计.md          # 完整架构设计文档
└── README-Payment.md           # 本文件
```

## 🗄️ 数据库表

### 1. biz_payment_order（支付订单表）
存储所有支付订单信息，支持重试和状态追踪。

**关键字段**:
- `payment_no`: 系统生成的支付订单号
- `order_no`: 关联业务订单号
- `status`: 支付状态（0-待支付, 1-支付中, 2-成功, 3-失败, 4-取消, 5-退款）
- `retry_count`: 已重试次数
- `payment_channel`: 支付通道编码

### 2. biz_payment_channel（支付通道配置表）
存储支付通道的配置信息，支持动态切换。

**关键字段**:
- `channel_code`: 通道唯一编码（如 X_PAY_CREDIT）
- `channel_type`: 通道类型（CREDIT_CARD, QRIS, ALIPAY）
- `priority`: 优先级（数字越小越优先）
- `is_active`: 是否启用

### 3. biz_payment_notify_log（支付回调日志表）
记录所有支付回调，便于排查问题。

### 4. biz_deliver（配送信息表）
存储订单的收件信息，补全订单数据。

## 🎯 设计模式

### 策略模式（Strategy Pattern）

**接口定义**:
```typescript
interface PaymentStrategy {
  createPayment(params): Promise<CreatePaymentResult>;
  queryPayment(paymentNo): Promise<QueryPaymentResult>;
  verifyNotify(data): boolean;
  handleNotify(data): Promise<NotifyResult>;
  supportCurrency(currency): boolean;
  supportMethod(method): boolean;
  getPriority(): number;
}
```

**通道选择逻辑**:
1. 查询所有启用的支付通道
2. 过滤支持当前货币和支付方式的通道
3. 按优先级排序（数字越小越优先）
4. 优先选择信用卡通道
5. 返回最合适的通道

### 重试机制（Retry Pattern）

**配置参数**:
- `retry_count`: 当前重试次数
- `max_retry`: 最大重试次数（默认3次）
- `retry_interval`: 重试间隔（秒）

**重试流程**:
```
支付失败
   ↓
retry_count < max_retry?
   ↓ 是
等待 retry_interval 秒
   ↓
重新发起支付
   ↓
retry_count++
   ↓ 否
标记支付失败
```

## 🔐 X支付通道

### 创建支付订单

**API**: `POST /api/v1/pay/create`

**请求参数**:
```json
{
  "platform_key": "pk_test_abcd1234efgh5678",
  "site_code": "TESTSITE001",
  "order_no": "ORDER20260302006",
  "amount": 16850,
  "currency": "IDR",
  "payment_method": "ALIPAY",
  "timestamp": 1772434437,
  "notify_url": "https://merchant.com/notify",
  "sign": "99EE348F297AC38231A9D87EB314C256"
}
```

**响应参数**:
```json
{
  "code": 0,
  "msg": "Success",
  "data": {
    "order_no": "PO20260119153045123456",
    "partner_order_no": "ORDER202601190001",
    "third_order_no": "TXN123456789",
    "pay_url": "https://pay.example.com/checkout/xxx",
    "qr_code": "https://pay.example.com/qr/xxx.png",
    "expire_time": "2026-01-19 16:30:45",
    "amount": 100000,
    "currency": "IDR",
    "payment_method": "QRIS"
  }
}
```

### 签名算法

```typescript
// 1. 参数按字母排序
const sortedKeys = Object.keys(params).sort();

// 2. 拼接字符串
const signStr = sortedKeys
  .map(key => `${key}=${params[key]}`)
  .join('&') + `&key=${secret}`;

// 3. MD5加密并转大写
const sign = crypto
  .createHash('md5')
  .update(signStr)
  .digest('hex')
  .toUpperCase();
```

## 🚀 API 接口

### 1. 获取支付页面
```
GET /checkout/pay?v={orderNo}
```

### 2. 创建支付订单
```
POST /api/payment/create
```

### 3. 查询支付状态
```
GET /api/payment/query/{paymentNo}
```

### 4. 支付回调
```
POST /api/payment/notify/{channelCode}
```

## 📝 部署步骤

### 1. 执行数据库脚本
```bash
mysql -u root -p < database/payment_tables.sql
```

### 2. 配置支付通道
在 `biz_payment_channel` 表中添加支付通道配置。

### 3. 注册支付策略
在 `PaymentModule` 中注册新的支付策略。

### 4. 测试支付流程
使用测试订单验证整个支付流程。

## 🔧 扩展新支付通道

### 1. 创建策略类
```typescript
@Injectable()
export class NewPayStrategy extends AbstractPaymentStrategy {
  getChannelCode(): string {
    return 'NEW_PAY';
  }
  
  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    // 实现创建支付逻辑
  }
  
  // 实现其他必要方法...
}
```

### 2. 注册策略
```typescript
@Module({
  providers: [
    NewPayStrategy,
    {
      provide: 'PAYMENT_STRATEGY_NEW_PAY',
      useExisting: NewPayStrategy,
    },
  ],
})
export class PaymentModule {}
```

### 3. 添加通道配置
```sql
INSERT INTO biz_payment_channel (
  channel_code, channel_name, channel_type,
  platform_key, platform_secret, ...
) VALUES (
  'NEW_PAY', '新支付', 'CREDIT_CARD',
  'pk_xxx', 'sk_xxx', ...
);
```

## ⚠️ 注意事项

1. **签名验证**: 所有回调必须验证签名
2. **幂等处理**: 回调处理必须支持幂等
3. **事务管理**: 支付状态更新使用事务
4. **日志记录**: 记录所有支付操作日志
5. **异常处理**: 捕获并记录所有异常
6. **重试限制**: 避免无限重试

## 📚 相关文档

- [支付模块架构设计.md](./支付模块架构设计.md)
- [数据库表结构](../database/payment_tables.sql)
- [X支付API文档](https://xpay.com/docs)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
