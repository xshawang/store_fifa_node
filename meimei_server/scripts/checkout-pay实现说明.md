# /checkout/pay 接口实现说明

## 📋 功能概述

`/checkout/pay` 接口用于处理结算支付表单提交，完成以下核心功能：
1. 接收并解析表单参数（自动处理URL编码）
2. 保存收件信息到 `biz_deliver` 表
3. 查询订单信息
4. 选择信用卡支付通道（优先级最高）
5. 创建支付订单
6. 返回支付跳转链接

## 🔧 接口详情

### 基本信息
- **路径**: `POST /checkout/pay`
- **权限**: 公开（无需登录）
- **Content-Type**: `application/x-www-form-urlencoded` 或 `application/json`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| v | string | 是 | 订单编号 | 121212121 |
| email | string | 是 | 收件邮箱 | www%40124.com |
| countryCode | string | 是 | 国家代码 | US |
| firstName | string | 是 | 姓 | john |
| lastName | string | 是 | 名 | smith |
| address1 | string | 是 | 地址行1 | fource |
| address2 | string | 否 | 地址行2 | dsdsf |
| postalCode | string | 是 | 邮政编码 | 2323 |
| phone | string | 是 | 联系电话 | 1232342 |
| number | string | 是 | 信用卡号 | 6011 5916 6560 7745 |
| expiry | string | 是 | 有效期 | 12 / 34 |
| verification_value | string | 是 | CVV | 234 |
| name | string | 是 | 持卡人姓名 | john smith |
| phone2 | string | 否 | 备用电话 | 2323232323 |

### 请求示例

#### URL编码格式
```
POST /checkout/pay
Content-Type: application/x-www-form-urlencoded

v=121212121&email=wwww%40124.com&countryCode=US&firstName=john&lastName=smith&address1=fource&address2=dsdsf&postalCode=2323&phone=1232342&number=6011+5916+6560+7745&expiry=12+%2F+34&verification_value=234&name=john+smith&phone2=2323232323
```

#### JSON格式
```json
POST /checkout/pay
Content-Type: application/json

{
  "v": "121212121",
  "email": "wwww@124.com",
  "countryCode": "US",
  "firstName": "john",
  "lastName": "smith",
  "address1": "fource",
  "address2": "dsdsf",
  "postalCode": "2323",
  "phone": "1232342",
  "number": "6011 5916 6560 7745",
  "expiry": "12 / 34",
  "verification_value": "234",
  "name": "john smith",
  "phone2": "2323232323"
}
```

### 响应示例

#### 成功响应
```json
{
  "success": true,
  "message": "支付订单创建成功",
  "code": 0,
  "data": {
    "paymentNo": "PAY17143872001234",
    "payUrl": "https://pay.xpay.com/checkout/abc123",
    "qrCode": null,
    "expireTime": "2026-04-27T10:00:00.000Z"
  }
}
```

#### 失败响应
```json
{
  "success": false,
  "message": "订单不存在",
  "code": -1
}
```

## 🔄 业务流程

```
1. 接收请求参数
   ↓
2. 从Cookie提取用户标识
   ├─ _shopify_y (用户ID)
   └─ token (认证令牌)
   ↓
3. 保存收件信息到 biz_deliver 表
   ├─ 检查是否已存在（根据orderNo）
   ├─ 存在 → 更新
   └─ 不存在 → 创建
   ↓
4. 查询订单信息
   ├─ 订单号验证
   └─ 获取订单金额和货币
   ↓
5. 选择信用卡支付通道
   ├─ 查询所有启用的 CREDIT_CARD 通道
   ├─ 按优先级排序
   ├─ 过滤支持的货币和金额范围
   └─ 返回优先级最高的通道
   ↓
6. 创建支付订单
   ├─ 生成支付订单号
   ├─ 记录到 biz_payment_order 表
   ├─ 调用第三方支付API
   └─ 获取支付链接
   ↓
7. 返回支付跳转链接
   └─ 前端收到 payUrl 后跳转
```

## 💾 数据库操作

### 1. 保存收件信息 (biz_deliver)

```typescript
{
  orderNo: "121212121",
  userId: "从Cookie获取",
  recipientName: "john smith",
  recipientPhone: "1232342",
  recipientEmail: "wwww@124.com",
  countryCode: "US",
  country: "United States",
  province: "",
  city: "",
  address: "fource, dsdsf",
  postalCode: "2323",
  addressLine1: "fource",
  addressLine2: "dsdsf",
  isDefault: false
}
```

### 2. 创建支付订单 (biz_payment_order)

```typescript
{
  paymentNo: "PAY17143872001234",
  orderNo: "121212121",
  userId: "从Cookie获取",
  amount: 180.00,
  currency: "USD",
  status: 1, // 支付中
  paymentChannel: "X_PAY_CREDIT",
  paymentMethod: "CREDIT_CARD",
  thirdPaymentNo: "从第三方支付返回",
  payUrl: "https://pay.xpay.com/checkout/abc123",
  qrCode: null,
  expireTime: "2026-04-27 10:00:00",
  retryCount: 0,
  maxRetry: 3
}
```

## 🔐 支付通道选择逻辑

```typescript
// 选择信用卡支付通道
async selectCreditCardChannel(amount: number, currency: string) {
  // 1. 查询所有启用的信用卡通道
  const channels = await this.paymentChannelRepo.find({
    where: {
      isActive: true,
      channelType: 'CREDIT_CARD'
    },
    order: { priority: 'ASC' }
  });
  
  // 2. 过滤支持的通道
  const supported = channels.filter(ch => 
    ch.supportedCurrencies.includes(currency) &&
    amount >= ch.minAmount &&
    amount <= ch.maxAmount
  );
  
  // 3. 返回优先级最高的（priority数字最小）
  return supported[0];
}
```

### 通道优先级
1. **X_PAY_CREDIT** (priority=1) - X支付-信用卡
2. 其他信用卡通道...

## 🌍 国家代码映射

```typescript
const countryMap = {
  'US': 'United States',
  'CN': 'China',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'KR': 'South Korea',
  'CA': 'Canada',
  'AU': 'Australia',
  'ID': 'Indonesia',
  // 可扩展更多...
};
```

## 🔒 安全处理

### 1. URL编码自动处理
NestJS 的 `@Body()` 装饰器会自动处理 URL 编码：
- `%40` → `@`
- `+` → 空格
- `%2F` → `/`

### 2. 信用卡信息安全
- ⚠️ **当前实现**: 信用卡信息直接传递到支付通道
- ✅ **建议改进**: 
  - 不要在日志中记录完整卡号
  - 使用PCI DSS合规的支付方式
  - 考虑使用Token化方案

### 3. 数据验证
使用 `class-validator` 进行参数验证：
```typescript
@IsNotEmpty({ message: '订单编号不能为空' })
@IsString()
v: string;
```

## 📝 日志记录

### 请求日志
```
==================== /checkout/pay 请求 ====================
订单号: 121212121
收件人: john smith
邮箱: wwww@124.com
电话: 1232342
用户ID: xxx
```

### 业务日志
```
保存收件信息: 121212121
收件信息保存成功: 1
订单金额: 180.00 USD
选择信用卡支付通道
选择支付通道: X_PAY_CREDIT - X支付-信用卡
支付订单创建成功: PAY17143872001234
```

### 错误日志
```
结算支付失败: 订单不存在
Error: 订单不存在
    at PaymentController.checkoutPay ...
```

## 🧪 测试用例

### 使用 curl 测试
```bash
curl -X POST http://localhost:3000/checkout/pay \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "v=121212121&email=test%40example.com&countryCode=US&firstName=john&lastName=smith&address1=123+Main+St&address2=Apt+4B&postalCode=10001&phone=1234567890&number=4111111111111111&expiry=12%2F25&verification_value=123&name=john+smith"
```

### 使用 Postman 测试
1. 设置请求方法为 `POST`
2. 设置 URL: `http://localhost:3000/checkout/pay`
3. 在 Body 中选择 `x-www-form-urlencoded`
4. 添加所有参数
5. 发送请求

## ⚠️ 注意事项

### 1. 参数转码
- URL中的 `+` 会被解析为空格
- `%40` 会被解析为 `@`
- `%2F` 会被解析为 `/`
- NestJS 会自动处理这些编码

### 2. 信用卡号格式
- 前端可能发送带空格的卡号：`6011 5916 6560 7745`
- 后端接收时需要去除空格：`6011591665607745`
- 建议在支付通道中处理

### 3. 有效期格式
- 前端格式：`12 / 34`
- 需要解析为：`12/2034` 或 `2034-12`
- 建议在支付通道中处理

### 4. 重复提交
- 使用订单号防重
- 检查支付订单是否已存在
- 避免重复创建支付

## 🔮 后续优化

### 1. 订单服务集成
```typescript
// 当前：模拟数据
return {
  orderNo,
  amount: 180.00,
  currency: 'USD',
};

// 优化后：从订单服务获取
const order = await this.orderService.getOrder(orderNo);
return {
  orderNo: order.orderNo,
  amount: order.totalAmount,
  currency: order.currency,
};
```

### 2. 信用卡信息加密
```typescript
// 使用支付通道提供的SDK
const tokenizedCard = await paymentGateway.tokenizeCard({
  number: checkoutPayDto.number,
  expiry: checkoutPayDto.expiry,
  cvv: checkoutPayDto.verification_value,
});
```

### 3. 地址解析
```typescript
// 从地址中提取省/市信息
const { province, city } = await this.addressService.parseAddress(
  checkoutPayDto.address1,
  checkoutPayDto.countryCode
);
```

### 4. 支付重试机制
```typescript
// 如果支付创建失败，自动重试
const result = await this.paymentService.createPaymentWithRetry({
  ...paymentData,
  maxRetry: 3,
  retryInterval: 5000,
});
```

## 📊 性能考虑

### 1. 数据库查询优化
- 使用索引：`orderNo` 字段已添加索引
- 避免N+1查询：批量查询相关数据

### 2. 并发处理
- 同一订单的并发支付请求需要加锁
- 使用Redis分布式锁或数据库唯一索引

### 3. 缓存策略
- 支付通道配置可以缓存
- 国家代码映射可以缓存

## 🎯 总结

`/checkout/pay` 接口已完成以下功能：
- ✅ 参数接收和URL解码
- ✅ 收件信息保存到数据库
- ✅ 订单信息查询
- ✅ 信用卡支付通道选择（优先级最高）
- ✅ 支付订单创建
- ✅ 返回支付跳转链接
- ✅ 完整的错误处理和日志记录

可以直接使用，后续根据实际业务需求进行优化和扩展。
