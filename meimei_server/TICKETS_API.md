# 票务订单创建接口 - /checkout/tickets

## 📋 概述

创建了票务订单创建接口,用于从前端接收票务订单信息,创建订单并保存收货信息。

## 🌐 接口信息

- **URL**: `POST /checkout/tickets`
- **认证**: 无需认证 (@Public)
- **Content-Type**: `application/x-www-form-urlencoded` 或 `application/json`

## 📥 入参说明

### 收货信息

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| first-name | string | 是 | 名 | Wang |
| last-name | string | 是 | 姓 | xuan |
| email | string | 是 | 邮箱 | wwww@ewe |
| phone | string | 是 | 电话 | 2222333323 |
| company | string | 否 | 公司 | - |
| address | string | 是 | 地址 | 3577 Polk Street |
| address2 | string | 否 | 地址2 | - |
| city | string | 是 | 城市 | Tucson |
| state | string | 是 | 州/省 | Arizona |
| zip | string | 是 | 邮编 | 85701 |
| country | string | 是 | 国家 | 美国 |
| instructions | string | 否 | 备注说明 | 1212121212 |

### 支付信息

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| paymentmethod | string | 否 | 支付方式 | hehei |
| paymentmethod_select | string | 否 | 支付方式选择 | stripe |
| discount_total_price | number | 否 | 折扣总金额(美元) | 0 |

### 订单物品信息

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| fifaShowOrderSummary | string | 是 | JSON数组字符串,每5个元素为一个物品 | `["物品1名称","详情1","详情2","详情3","详情4","物品2名称",...]` |
| fifaShowOrderSummaryImgs | string | 否 | JSON数组字符串,物品图片URL | `["url1","url2",...]` |

## 📤 出参说明

### 成功响应

```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "orderNo": "1777432785547587198021356353",
    "itemCount": 2,
    "totalAmount": 0
  }
}
```

### 失败响应

```json
{
  "success": false,
  "message": "错误信息"
}
```

## 🔄 业务流程

1. **获取用户ID** - 从 cookie `_shopify_y` 中提取用户标识
2. **解析订单摘要** - 解析 `fifaShowOrderSummary` JSON数组
3. **解析图片数组** - 解析 `fifaShowOrderSummaryImgs` JSON数组
4. **计算物品数量** - 每5个元素为一个物品: `itemCount = ceil(summary.length / 5)`
5. **生成订单号** - 使用时间戳+随机数生成32位订单号
6. **创建订单主表** - 保存到 `biz_order` 表
7. **创建订单项** - 每5个元素创建一个订单项,保存到 `biz_order_item` 表
   - 物品名称: 使用第1个元素
   - 物品规格: 使用第2-5个元素组合
   - 物品图片: 对应 `fifaShowOrderSummaryImgs` 的索引位置,如不足则为空
8. **保存收货信息** - 保存到 `biz_deliver` 表
9. **返回成功响应**

## 📝 请求示例

### cURL

```bash
curl -X POST http://localhost:3000/checkout/tickets \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "first-name=Wang" \
  -d "last-name=xuan" \
  -d "email=wwww@ewe" \
  -d "phone=2222333323" \
  -d "address=3577 Polk Street" \
  -d "city=Tucson" \
  -d "state=Arizona" \
  -d "zip=85701" \
  -d "country=美国" \
  -d "instructions=1212121212" \
  -d "paymentmethod=hehei" \
  -d "paymentmethod_select=stripe" \
  -d "discount_total_price=0" \
  -d 'fifaShowOrderSummary=["FIFA WORLD CUP 26T opening ceremony","Match start time: 2026-06-11 08:00","Seating Section: VIP","$1,566.00","Qty:1","FIFA WORLD CUP 26T Final","Match start time: 2026-07-19 08:00","Seating Section: VIP","$2,566.00","Qty:1"]' \
  -d 'fifaShowOrderSummaryImgs=["https://example.com/img1.png","https://example.com/img2.png"]'
```

### JavaScript (Fetch)

```javascript
const formData = new URLSearchParams();
formData.append('first-name', 'Wang');
formData.append('last-name', 'xuan');
formData.append('email', 'wwww@ewe');
formData.append('phone', '2222333323');
formData.append('address', '3577 Polk Street');
formData.append('city', 'Tucson');
formData.append('state', 'Arizona');
formData.append('zip', '85701');
formData.append('country', '美国');
formData.append('instructions', '1212121212');
formData.append('paymentmethod', 'hehei');
formData.append('paymentmethod_select', 'stripe');
formData.append('discount_total_price', '0');
formData.append('fifaShowOrderSummary', JSON.stringify([
  "FIFA WORLD CUP 26T opening ceremony",
  "Match start time: 2026-06-11 08:00",
  "Seating Section: VIP",
  "$1,566.00",
  "Qty:1",
  "FIFA WORLD CUP 26T Final",
  "Match start time: 2026-07-19 08:00",
  "Seating Section: VIP",
  "$2,566.00",
  "Qty:1"
]));
formData.append('fifaShowOrderSummaryImgs', JSON.stringify([
  "https://example.com/img1.png",
  "https://example.com/img2.png"
]));

fetch('http://localhost:3000/checkout/tickets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: formData,
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

## 📦 数据存储

### biz_order (订单主表)

- `order_no`: 订单编号
- `user_id`: 用户ID (从 cookie 获取)
- `order_status`: 0 (待支付)
- `payment_status`: 0 (未支付)
- `total_amount`: 0 (分)
- `currency`: USD
- `email`, `first_name`, `last_name`, `phone`, `address1`, `city`, `province`, `postal_code`, `country`: 收货信息

### biz_order_item (订单明细表)

每个物品一条记录:
- `order_id`: 关联订单ID
- `order_no`: 订单编号
- `product_name`: 物品名称 (第1个元素)
- `variant_name`: 物品规格 (第2-5个元素组合)
- `quantity`: 1
- `sale_price`: 0
- `subtotal_amount`: 0
- `product_image`: 物品图片URL
- `product_url`: 物品图片URL

### biz_deliver (收货信息表)

- `order_no`: 订单编号
- `user_id`: 用户ID
- `recipient_name`: 收件人姓名
- `recipient_phone`: 收件人电话
- `recipient_email`: 收件人邮箱
- `country`, `province`, `city`, `address`, `postal_code`: 地址信息
- `remark`: 备注说明

## 🔧 技术实现

### 文件清单

1. **DTO**: `src/modules/biz/payment/dto/create-tickets.dto.ts`
   - 定义入参验证规则
   - 使用 `@Transform` 自动处理 URL 解码和空格修剪

2. **Controller**: `src/modules/biz/payment/controllers/tickets.controller.ts`
   - 处理 `/checkout/tickets` 请求
   - 业务逻辑实现

3. **Module**: `src/modules/biz/payment/payment.module.ts`
   - 注册 TicketsController

### 关键代码

```typescript
// 物品数量计算
const itemCount = Math.ceil(orderSummary.length / 5);

// 物品信息解析
for (let i = 0; i < itemCount; i++) {
  const startIndex = i * 5;
  const endIndex = Math.min(startIndex + 5, orderSummary.length);
  const itemElements = orderSummary.slice(startIndex, endIndex);
  
  const productName = itemElements[0]; // 名称
  const variantName = itemElements.slice(1).join(', '); // 规格
  const productImage = orderImgs[i] || ''; // 图片
}
```

## ⚠️ 注意事项

1. **Cookie 依赖**: 必须携带 `_shopify_y` cookie,否则返回 400 错误
2. **JSON 格式**: `fifaShowOrderSummary` 和 `fifaShowOrderSummaryImgs` 必须是有效的 JSON 数组字符串
3. **金额单位**: 当前默认为 0,需要从订单摘要中解析实际金额
4. **图片匹配**: 图片数量应与物品数量一致,不足则为空字符串
5. **字符编码**: 所有字符串参数会自动进行 URL 解码和空格修剪

## 🚀 后续优化建议

1. **金额解析** - 从 `fifaShowOrderSummary` 中解析实际金额
2. **数据验证** - 增加更多业务规则验证
3. **事务处理** - 使用数据库事务保证数据一致性
4. **日志记录** - 添加更详细的操作日志
5. **错误处理** - 优化错误信息和状态码

---

**版本**: v1.0  
**创建日期**: 2026-05-06  
**状态**: ✅ 已完成并部署
