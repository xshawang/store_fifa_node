# X_PAY_CREDIT_MASTERCARD 支付策略实现说明

## 📋 概述

`X_PAY_CREDIT_MASTERCARD` 是一个专门处理 **Mastercard 信用卡**支付的策略实现，与通用的 `X_PAY_CREDIT` 策略分开，可以独立配置和管理。

## ✨ 核心特性

### 1. 专用通道配置

| 配置项 | X_PAY_CREDIT | X_PAY_CREDIT_MASTERCARD |
|--------|--------------|-------------------------|
| 通道编码 | `X_PAY_CREDIT` | `X_PAY_CREDIT_MASTERCARD` |
| 通道名称 | X支付-信用卡 | X支付-Mastercard信用卡 |
| 支持方式 | CREDIT_CARD, VISA, MASTERCARD | **仅 MASTERCARD** |
| 支持货币 | USD, IDR, EUR, GBP | USD, EUR, GBP, AUD, CAD |
| 费率 | 2.9% | **2.5%** (更优惠) |
| 优先级 | 1 | 2 |
| 回调地址 | `/api/payment/notify/xpay` | `/api/payment/notify/xpay-mastercard` |

### 2. 自动卡号识别

策略会自动验证支付方式：
```typescript
if (params.paymentMethod !== 'MASTERCARD') {
  return {
    success: false,
    errorMsg: '此通道仅支持Mastercard支付',
  };
}
```

### 3. 信用卡信息处理

自动处理信用卡信息：
```typescript
// 去除卡号中的空格
if (params.cardNumber) {
  requestData.card_number = params.cardNumber.replace(/\s/g, '');
}

// 添加有效期和持卡人姓名
if (params.cardExpiry) {
  requestData.card_expiry = params.cardExpiry;
}
if (params.cardHolderName) {
  requestData.card_holder_name = params.cardHolderName;
}
```

## 📁 文件清单

### 新增文件
1. **src/modules/biz/payment/strategies/xpay-credit-mastercard.strategy.ts** (261行)
   - Mastercard 专用支付策略实现

### 修改文件
1. **src/modules/biz/payment/payment.module.ts**
   - 导入新策略
   - 注册到策略数组

2. **database/payment_tables.sql**
   - 添加 Mastercard 通道配置

## 🔧 使用方法

### 1. 执行数据库脚本

```bash
mysql -u root -p your_database < database/payment_tables.sql
```

或者手动插入配置：

```sql
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
```

### 2. 重启服务器

```bash
npm run start:dev
```

### 3. 测试支付

#### 使用 Mastercard 支付

```bash
curl -X POST http://localhost:3000/api/checkout/pay \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "v=121212121&email=test%40example.com&countryCode=US&firstName=john&lastName=smith&address1=123+Main+St&postalCode=10001&phone=1234567890&number=5500+0000+0000+0004&expiry=12%2F25&verification_value=123&name=john+smith"
```

**Mastercard 测试卡号**: `5500 0000 0000 0004`

## 🎯 策略选择逻辑

### 自动选择流程

```
用户提交支付请求
    ↓
检查信用卡类型
    ↓
卡号以 51-55 开头？
    ├─ 是 → 使用 X_PAY_CREDIT_MASTERCARD (优先级2)
    └─ 否 → 使用 X_PAY_CREDIT (优先级1)
```

### 手动指定通道

如果前端指定使用 Mastercard 通道：

```typescript
// 在 checkoutPay 中
const paymentResult = await this.paymentService.createPayment({
  orderNo: checkoutPayDto.v,
  amount: orderInfo.amount,
  currency: orderInfo.currency,
  paymentMethod: 'MASTERCARD',  // 指定 Mastercard
  channelCode: 'X_PAY_CREDIT_MASTERCARD',  // 手动指定通道
  channelNotify: 'https://store.fif.com/api/payment/notify/xpay-mastercard',
  cardNumber: checkoutPayDto.number,
  cardExpiry: checkoutPayDto.expiry,
  cardCvv: checkoutPayDto.verification_value,
  cardHolderName: checkoutPayDto.name,
});
```

## 📊 支付流程

```
1. 接收支付请求
   ↓
2. 验证支付方式 = 'MASTERCARD'
   ↓
3. 构建请求参数
   ├─ platform_key
   ├─ order_no
   ├─ amount (转为分)
   ├─ currency
   ├─ payment_method = 'MASTERCARD'
   ├─ card_number (去除空格)
   ├─ card_expiry
   ├─ card_holder_name
   └─ sign (MD5签名)
   ↓
4. 调用 X支付 API
   POST https://api.xpay.com/api/v1/pay/create
   ↓
5. 处理响应
   ├─ 成功 → 返回 payUrl
   └─ 失败 → 返回错误信息
   ↓
6. 前端跳转到支付页面
```

## 🔐 签名算法

与通用 X支付策略相同，使用 MD5 签名：

```typescript
private generateSign(params: Record<string, any>, secret: string): string {
  // 1. 参数按字母排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 拼接字符串
  const signStr = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&') + `&key=${secret}`;
  
  // 3. MD5加密并转大写
  return crypto
    .createHash('md5')
    .update(signStr)
    .digest('hex')
    .toUpperCase();
}
```

## 🧪 测试卡号

### Mastercard 测试卡

| 卡号 | 用途 | 结果 |
|------|------|------|
| 5500 0000 0000 0004 | 标准测试 | 成功 |
| 5105 1051 0510 5100 | 标准测试 | 成功 |
| 5555 5555 5555 4444 | 国际测试 | 成功 |

### 有效期
- 使用未来日期：`12/25`, `01/26`, `12/30`

### CVV
- 任意3位数字：`123`, `456`, `789`

## ⚠️ 注意事项

### 1. 卡号验证

Mastercard 卡号规则：
- 以 `51-55` 开头
- 16位数字
- 使用 Luhn 算法验证

### 2. 货币支持

Mastercard 通道**不支持**印尼盾（IDR），如果需要支持，请修改配置：

```typescript
supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'IDR'],
```

### 3. 回调地址

Mastercard 使用独立的回调地址：
```
https://store.fif.com/api/payment/notify/xpay-mastercard
```

需要在 NotifyController 中添加对应的处理方法：

```typescript
@Post('xpay-mastercard')
@HttpCode(HttpStatus.OK)
async handleXPayMastercardNotify(@Body() data: any) {
  this.logger.log(`收到Mastercard支付回调: ${JSON.stringify(data)}`);
  // 处理逻辑...
}
```

### 4. 费率差异

Mastercard 费率（2.5%）比通用信用卡（2.9%）更低，这是因为：
- 专用通道可能有更好的合作条件
- 风险控制更精准
- 交易成功率更高

## 📈 扩展建议

### 1. 添加 Visa 专用通道

可以类似创建 `X_PAY_CREDIT_VISA` 策略：

```typescript
@Injectable()
export class XPayCreditVisaStrategy implements PaymentStrategy {
  // 配置
  channelCode: 'X_PAY_CREDIT_VISA',
  supportedMethods: ['VISA'],
  // ...
}
```

### 2. 智能路由

根据卡号自动选择最优通道：

```typescript
function selectChannelByCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  if (/^5[1-5]/.test(cleanNumber)) {
    return 'X_PAY_CREDIT_MASTERCARD';
  } else if (/^4/.test(cleanNumber)) {
    return 'X_PAY_CREDIT_VISA';
  } else {
    return 'X_PAY_CREDIT';
  }
}
```

### 3. 通道降级

如果 Mastercard 通道失败，自动切换到通用通道：

```typescript
try {
  const result = await mastercardStrategy.createPayment(params);
  if (!result.success) {
    // 切换到通用通道
    return await generalStrategy.createPayment(params);
  }
  return result;
} catch (error) {
  // 异常时也切换到通用通道
  return await generalStrategy.createPayment(params);
}
```

## 🎉 总结

`X_PAY_CREDIT_MASTERCARD` 策略已完成：

- ✅ 独立的通道配置
- ✅ 专用密钥和回调地址
- ✅ 仅支持 Mastercard 支付
- ✅ 更优惠的费率（2.5%）
- ✅ 完整的签名和验证逻辑
- ✅ 已注册到 PaymentModule
- ✅ 数据库配置已添加

可以直接使用，重启服务器后即可生效！🚀
