# PIX_PAY 支付通道集成 - 实施总结

## 实施时间
2026-04-27

## 已完成的修改

### 1. 新增文件
- **`strategies/pixpay.strategy.ts`** - PIX_PAY 支付策略实现
  - 实现了 `PaymentStrategy` 接口的所有方法
  - 支持 BRL 货币和 PIX 支付方式
  - 集成了 IP 白名单验证（5个正式环境回调IP）
  - 状态映射：PROCESSING→PAYING, SUCCESS→SUCCESS, FAIL→FAILED
  - 使用 MD5 签名算法（与 XPay 一致）
  - 支持环境变量配置敏感信息

### 2. 修改文件

#### `payment.module.ts`
- 导入 `PIXPayStrategy`
- 在 providers 中注册 `PIXPayStrategy`
- 更新 `PAYMENT_STRATEGIES` factory，包含新策略

#### `payment_tables.sql`
- 添加 PIX_PAY 通道配置记录
- 配置支持货币：BRL
- 配置支持支付方式：PIX
- 包含 IP 白名单配置在 config JSON 字段中
- 费率设置为 1.5%

#### `notify.controller.ts`
- 新增 `handlePIXPayNotify()` 方法处理 PIX 回调
- 新增 `isIPAllowed()` 方法验证回调 IP 白名单
- 更新通用回调路由的 switch 分支，添加 'pixpay' 案例
- 导入 `Req` 装饰器以获取请求信息

#### `create-payment.dto.ts`
- 新增 `cpf` 字段（巴西税号）
- 新增 `email` 字段（用户邮箱）

#### `payment.service.ts`
- 更新 `createPayment()` 方法，传递 `cpf` 和 `email` 到策略

## 技术实现要点

### 安全特性
1. **IP 白名单验证**：仅允许 5 个正式环境 IP 发送回调
2. **签名验证**：使用 MD5 签名确保回调数据完整性
3. **环境变量配置**：敏感信息通过环境变量管理

### 配置管理
支持以下环境变量：
- `PIXPAY_PLATFORM_KEY` - 平台公钥
- `PIXPAY_PLATFORM_SECRET` - 平台私钥
- `PIXPAY_SITE_CODE` - 网站编码
- `PIXPAY_API_BASE_URL` - API 基础地址
- `PIXPAY_NOTIFY_URL` - 回调通知地址

### 状态映射
```
PIX_PAY 状态      →      系统状态
PROCESSING       →      PAYING (1)
SUCCESS          →      SUCCESS (2)
FAIL             →      FAILED (3)
```

### 回调 IP 白名单
- 54.233.234.196
- 18.229.23.62
- 56.125.86.62
- 18.229.182.144
- 56.125.155.115

## 编译验证
✅ TypeScript 编译成功，无错误
✅ 所有文件语法正确
✅ 依赖注入配置正确

## 待完成事项（需要额外配置）

### 1. 环境变量配置
在部署环境中设置以下变量：
```bash
PIXPAY_PLATFORM_KEY=pk_live_your_actual_key
PIXPAY_PLATFORM_SECRET=sk_live_your_actual_secret
PIXPAY_API_BASE_URL=https://api.pixpay.com
PIXPAY_NOTIFY_URL=https://store.fif.com/api/payment/notify/pixpay
```

### 2. 数据库迁移
执行 `payment_tables.sql` 中的 INSERT 语句，添加 PIX_PAY 通道配置

### 3. API 文档确认
建议查阅 `scripts/pay_api.pdf` 确认：
- API 端点地址是否正确
- 签名算法是否为 MD5
- 金额单位是否需要转换为分
- 是否需要额外参数（如 CPF 格式要求）
- 支付订单过期时间设置

### 4. 前端集成（Shopify Checkout）
需要在前端添加：
- 检测 BRL 货币时显示 PIX 支付选项
- 调用 `/api/payment/create` 接口创建 PIX 订单
- 展示 PIX 二维码或跳转支付链接
- 处理支付结果回调

### 5. 测试
- 单元测试：`PIXPayStrategy` 各方法
- 集成测试：完整支付流程
- 回调测试：使用白名单 IP 模拟回调
- 端到端测试：从前端到回调的完整链路

## 架构兼容性
✅ 完全遵循现有策略模式架构
✅ 与 XPay、XPayCreditMastercardStrategy 保持一致的实现模式
✅ 支持自动通道选择（根据货币和支付方式）
✅ 支持统一的回调处理机制

## 注意事项

1. **金额精度**：当前实现将 BRL 金额乘以 100 转为分，需确认 API 文档要求
2. **幂等性**：回调处理需要实现幂等性，避免重复处理
3. **日志记录**：已添加详细日志，便于排查问题
4. **错误处理**：所有异步操作都有完整的 try-catch 和错误日志
5. **TypeScript 兼容性**：`CreatePaymentParams` 接口使用 `[key: string]: any` 支持扩展字段

## 下一步建议

1. 获取 PIX_PAY 的正式环境 API 凭证
2. 在测试环境验证支付流程
3. 完成前端 Shopify Checkout 集成
4. 进行完整的端到端测试
5. 配置生产环境环境变量
6. 部署上线并监控日志
