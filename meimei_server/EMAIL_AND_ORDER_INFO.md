# 邮件服务与订单查看功能说明

## 功能概述

本次更新新增了以下两个核心功能:

1. **邮件通知服务** - 订单支付成功后自动发送邮件通知
2. **订单查看接口** - 公开接口,无需校验即可查看订单详情

---

## 一、邮件服务配置

### 1.1 环境配置

需要在 `.env.development` 或 `.env.production` 中配置 AWS SES 邮件服务信息:

```env
# AWS SES 邮件配置
SES_SMTP_HOST=email-smtp.eu-central-1.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USER=AKIA2RHXRVZLOFLIPK7J
SES_SMTP_PASS=BKtlekRRYTMRYqnMf5TJ2RCNKCQTrMgBgUF9ulds8yfj
SES_FROM_EMAIL=support@baietong.com
SES_FROM_NAME=FIFA Official Store
APP_URL='https://store.fafbuy.store'
```

### 1.2 AWS SES 配置说明

**SMTP 端点:**
- 美国东部 (弗吉尼亚北部): `email-smtp.us-east-1.amazonaws.com`
- 美国西部 (俄勒冈): `email-smtp.us-west-2.amazonaws.com`
- 欧洲 (法兰克福): `email-smtp.eu-central-1.amazonaws.com`
- 亚太地区 (新加坡): `email-smtp.ap-southeast-1.amazonaws.com`

**获取 SMTP 凭据:**
1. 登录 AWS SES 控制台
2. 导航到 "SMTP Settings"
3. 点击 "Create SMTP Credentials"
4. 下载 SMTP 用户名和密码

**端口说明:**
- 587: STARTTLS (推荐)
- 465: SSL/TLS
- 25: 不推荐使用

---

## 二、订单查看接口

### 2.1 接口信息

- **接口地址**: `GET /order/info`
- **参数**: `sign` (订单编号)
- **认证**: 无需认证(公开接口)
- **响应**: HTML页面

### 2.2 使用示例

```
https://store.fafbuy.store/order/info?sign=12345678901234567890123456789012
```

### 2.3 展示内容

订单详情页面包含以下信息:

1. **订单基本信息**
   - 订单编号
   - 订单状态
   - 支付状态

2. **商品列表**
   - 商品图片
   - 商品名称
   - 尺码/规格
   - 数量
   - 单价和小计

3. **收货信息**
   - 收件人姓名
   - 联系电话
   - 邮箱地址
   - 详细地址

4. **费用明细**
   - 商品小计
   - 配送费用
   - 税费
   - 折扣金额
   - 总计金额

5. **支付信息**
   - 支付方式
   - 支付时间
   - 已支付金额

### 2.4 页面样式

订单详情页面采用与 `payment_pt_br_01.html` 相同的Shopify风格设计:
- 响应式布局
- 现代化卡片式设计
- 清晰的信息层次
- 支持移动端访问

---

## 三、手动发送邮件接口

### 3.1 接口信息

- **接口地址**: `POST /order/send-email`
- **认证**: 无需认证(公开接口)
- **请求体**: JSON格式
- **响应**: JSON格式

### 3.2 请求参数

```json
{
  "orderNo": "订单编号"
}
```

### 3.3 使用示例

**使用 curl:**
```bash
curl -X POST https://store.fafbuy.store/order/send-email \
  -H "Content-Type: application/json" \
  -d '{"orderNo": "12345678901234567890123456789012"}'
```

**使用 Postman:**
- Method: POST
- URL: `https://store.fafbuy.store/order/send-email`
- Body: raw (JSON)
```json
{
  "orderNo": "12345678901234567890123456789012"
}
```

### 3.4 响应示例

**成功响应:**
```json
{
  "success": true,
  "message": "邮件发送成功",
  "data": {
    "orderNo": "12345678901234567890123456789012",
    "email": "customer@example.com"
  }
}
```

**失败响应:**
```json
{
  "success": false,
  "message": "订单不存在"
}
```

### 3.5 使用场景

1. **测试邮件功能**: 开发或部署后测试邮件发送是否正常
2. **补发邮件**: 订单支付成功但邮件未发送时手动补发
3. **重新发送**: 客户未收到邮件时重新发送

### 3.6 注意事项

- 订单必须有邮箱地址才能发送
- 邮件发送失败会返回具体错误信息
- 可以多次调用,没有发送次数限制
- 建议在测试环境先验证

---

## 四、邮件通知

### 4.1 触发时机

邮件在以下情况下自动发送:
- LPAY支付渠道 - 支付成功时(status='1')
- EYPAY支付渠道 - 支付成功时(status='SUCCESS')

### 4.2 邮件内容

邮件包含以下内容:

1. **邮件标题**: `订单确认 - {订单编号}`

2. **邮件正文**:
   - 订单成功确认信息
   - 订单基本信息
   - 商品列表(含图片、名称、规格、数量、价格)
   - 收货地址信息
   - 费用汇总
   - 订单查看按钮(链接到 `/order/info?sign=订单编号`)

### 4.3 邮件样式

- 采用响应式设计,支持移动端查看
- 蓝色主题,与FIFA品牌色一致
- 清晰的订单信息展示
- 醒目的订单查看按钮

---

## 五、文件结构

```
server/meimei_server/src/modules/biz/
├── email/                          # 邮件服务模块
│   ├── email.module.ts            # 邮件模块
│   └── email.service.ts           # 邮件服务
├── order/
│   ├── order.module.ts            # 订单模块(已更新)
│   ├── order-info.controller.ts   # 订单查看控制器(新增)
│   └── ...
└── payment/
    └── controllers/
        └── notify.controller.ts   # 支付回调控制器(已更新)
```

---

## 六、测试验证

### 6.1 测试订单查看接口

```bash
# 使用curl测试
curl http://localhost:3000/order/info?sign=YOUR_ORDER_NO

# 或在浏览器中直接访问
http://localhost:3000/order/info?sign=YOUR_ORDER_NO
```

### 6.2 测试手动发送邮件

**使用 curl:**
```bash
curl -X POST http://localhost:3000/order/send-email \
  -H "Content-Type: application/json" \
  -d '{"orderNo": "YOUR_ORDER_NO"}'
```

**成功响应:**
```json
{
  "success": true,
  "message": "邮件发送成功",
  "data": {
    "orderNo": "YOUR_ORDER_NO",
    "email": "customer@example.com"
  }
}
```

### 6.3 测试自动邮件发送

1. 配置正确的 AWS SES 信息
2. 创建一个测试订单
3. 通过支付回调触发邮件发送
4. 检查日志确认邮件发送状态

### 6.4 查看日志

邮件发送相关日志:
```
✅ 订单成功邮件发送成功: {订单号}
❌ 发送邮件失败 - 订单号: {订单号}
```

---

## 七、注意事项

1. **AWS SES 配置**
   - 确保发件邮箱已在 AWS SES 中验证
   - 如果在沙盒模式,只能向已验证的邮箱发送邮件
   - 建议申请生产访问权限以解除限制
   - 使用 SMTP 凭据而非 AWS Access Key

2. **性能考虑**
   - 邮件发送为异步操作,不阻塞支付流程
   - 邮件发送失败不影响订单状态更新
   - 失败信息会记录到日志中

3. **安全性**
   - 订单查看接口为公开接口,无需认证
   - 订单编号为32位随机字符串,难以猜测
   - 建议在生产环境启用HTTPS
   - SMTP 密码存储在环境变量中,不要提交到代码库

4. **定制化**
   - 邮件模板可在 `email.service.ts` 中修改
   - 订单页面样式可在 `order-info.controller.ts` 中调整
   - 支持自定义品牌色和Logo

---

## 八、故障排查

### 7.1 邮件发送失败

**问题**: 日志显示邮件发送失败

**解决方案**:
1. 检查 AWS SES SMTP 配置是否正确
2. 验证 SMTP 凭据(用户名和密码)是否有效
3. 确认 AWS SES 邮箱地址已验证
4. 检查 AWS SES 账户是否在沙盒模式
5. 查看完整的错误日志信息
6. 确认网络连接可以访问 AWS SES 端点

### 7.2 订单查看页面无法访问

**问题**: 访问 `/order/info` 返回404

**解决方案**:
1. 确认订单编号是否正确
2. 检查订单是否存在于数据库
3. 验证服务是否正常启动
4. 查看接口路由是否正确注册

### 7.3 页面样式异常

**问题**: 订单查看页面样式显示不正常

**解决方案**:
1. 检查浏览器是否支持现代CSS
2. 清除浏览器缓存
3. 确认HTML模板完整
4. 检查是否有CSS冲突

---

## 九、后续优化建议

1. **邮件模板优化**
   - 支持多语言(葡萄牙语、英语等)
   - 添加品牌Logo和社交媒体链接
   - 优化移动端显示效果

2. **功能增强**
   - 支持订单状态变更邮件通知
   - 添加物流跟踪信息
   - 支持邮件模板自定义

3. **性能优化**
   - 使用消息队列处理邮件发送
   - 添加邮件发送重试机制
   - 实现邮件发送限流

4. **监控告警**
   - 添加邮件发送成功率监控
   - 失败邮件告警通知
   - 邮件发送统计报表

---

## 更新日志

**2026-05-05**
- ✅ 新增邮件服务模块
- ✅ 新增订单查看公开接口
- ✅ 集成支付成功邮件通知
- ✅ 优化订单详情展示页面
