# EYPAY 支付通道实现说明

## 概述

EYPAY 是一个支持巴西 PIX 支付的通道，使用 RSA 签名验证确保数据安全。

## 实现文件

### 1. 支付策略
- **文件**: `src/modules/biz/payment/strategies/eypay.strategy.ts`
- **功能**: 实现 EYPAY 支付通道的核心逻辑
  - 创建支付订单
  - 查询支付状态
  - 验证回调签名
  - 处理支付回调

### 2. 模块注册
- **文件**: `src/modules/biz/payment/payment.module.ts`
- **修改**: 添加 EYPayStrategy 到 providers 和策略数组

### 3. 数据库配置
- **文件**: `database/payment_tables.sql`
- **修改**: 添加 EY_PAY 通道配置记录

### 4. 回调处理
- **文件**: `src/modules/biz/payment/controllers/notify.controller.ts`
- **修改**: 添加 `/payment/notify/eypay` 端点处理回调

## 配置信息

### 商户密钥
- **SecretKey**: `23710e8678a74fc0b91f479d730eb3f9`
- **商户私钥**: 用于签名请求数据
- **平台公钥**: 用于验证响应数据（需要向 EYPAY 获取）

### API 端点
- **下单接口**: `https://api.eypays.com/merchant-api/v1/order/create`
- **请求方法**: POST
- **Content-Type**: `application/json;charset=utf-8`

### 回调 IP 白名单
```
54.233.234.196
18.229.23.62
56.125.86.62
18.229.182.144
56.125.155.115
```

## 签名机制

### 请求签名
1. 组装签名字符串：
   ```
   POST
{query_string}
{nonce}
{timestamp}
{Authorization}
{request_body}
   ```
2. 使用商户私钥进行 SHA256WithRSA 签名
3. 将签名结果 Base64 编码后放入 header 的 `sign` 字段

### 响应验签
1. 组装验签字符串：
   ```
   {nonce}\n{timestamp}\n{Authorization}\n{response_data}
   ```
2. 使用平台公钥进行 SHA256WithRSA 验签
3. 对比签名结果与 header 中的 `sign` 字段

## 请求参数

### 下单请求体
```json
{
  "product_desc": "商品描述",
  "user_ip": "用户IP",
  "amount": "1100",
  "time_start": "20250614120042",
  "description": "订单描述",
  "trade_type": "pix",
  "notify_url": "https://merchant.notify.com",
  "merchant_order_no": "商户订单号",
  "product_title": "商品标题"
}
```

### 请求头
```
Content-Type: application/json;charset=utf-8
Authorization: {SecretKey}
nonce: {8-128位随机字符串}
timestamp: {13位时间戳}
sign: {签名数据}
```

## 响应数据

### 成功响应
```json
{
  "credential": {
    "pix": "PIX二维码字符串",
    "cashierUrl": "H5支付链接地址"
  },
  "merchant_order_no": "商户订单号",
  "order_no": "支付平台订单号",
  "return_code": "SUCCESS",
  "return_msg": "OK",
  "status": "SUCCESS",
  "trade_type": "pix"
}
```

## 回调处理

### 回调参数
- `merchant_order_no`: 商户订单号
- `order_no`: 支付平台订单号
- `status`: 支付状态（SUCCESS/PROCESSING/FAILED）
- `amount`: 订单金额
- `trade_type`: 交易类型
- `sign`: 签名
- `nonce`: 随机字符串
- `timestamp`: 时间戳
- `authorization`: 授权密钥

### 状态映射
| EYPAY 状态 | 系统支付状态 | 系统订单状态 |
|-----------|------------|------------|
| SUCCESS | 2 (支付成功) | 1 (已支付) |
| PROCESSING | 1 (支付中) | - |
| FAILED/CLOSED | 3 (支付失败) | 4 (已取消) |

## 环境变量配置

可以在 `.env` 文件中配置以下参数：

```env
EYPAY_PLATFORM_KEY=23710e8678a74fc0b91f479d730eb3f9
EYPAY_PLATFORM_SECRET=
EYPAY_SITE_CODE=
EYPAY_API_BASE_URL=https://api.eypays.com
EYPAY_NOTIFY_URL=https://store.fif.com/api/payment/notify/eypay
```

## 注意事项

1. **平台公钥**: 文档中未提供平台公钥，实际使用时需要向 EYPAY 获取并配置到数据库的 `config` 字段中
2. **签名验证**: 生产环境必须严格验证回调签名，确保数据安全
3. **IP 白名单**: 建议启用 IP 白名单验证，防止伪造回调
4. **金额单位**: EYPAY 使用"分"作为金额单位，需要进行转换
5. **时间格式**: `time_start` 格式为 `yyyyMMddHHmmss`
6. **订单号**: 商户订单号最多 64 个字符，只能是数字、大小写字母和下划线

## 测试

### 创建支付
```bash
POST /checkout/payment
Content-Type: application/x-www-form-urlencoded

v=订单号&email=邮箱&countryCode=BR&firstName=名&lastName=姓&address1=地址&postalCode=邮编&phone=电话
```

### 查询支付状态
```bash
GET /api/payment/query?paymentNo=支付订单号
```

## 待完善

1. 获取并配置平台公钥
2. 完善查询支付状态接口（文档未提供查询接口）
3. 添加更多的错误处理和日志记录
4. 测试完整的支付流程
