# 手动发送邮件接口测试示例

## 接口信息

- **URL**: `POST /order/send-email`
- **Content-Type**: `application/json`
- **认证**: 无需认证

## 测试示例

### 1. 使用 curl

```bash
# 测试发送邮件
curl.exe -X POST http://localhost:3000/api/order/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "orderNo": "12345678901234567890123456789012"
  }'
```

### 2. 使用 Postman

1. 创建新请求
2. Method: `POST`
3. URL: `http://localhost:3000/order/send-email`
4. Headers:
   - Key: `Content-Type`
   - Value: `application/json`
5. Body -> raw -> JSON:
```json
{
  "orderNo": "12345678901234567890123456789012"
}
```

### 3. 使用 JavaScript (Fetch API)

```javascript
fetch('http://localhost:3000/order/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderNo: '12345678901234567890123456789012'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

### 4. 使用 Python (requests)

```python
import requests

url = "http://localhost:3000/order/send-email"
payload = {
    "orderNo": "12345678901234567890123456789012"
}

response = requests.post(url, json=payload)
print(response.json())
```

## 响应示例

### 成功响应 (200)

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

### 错误响应

**订单不存在 (404):**
```json
{
  "success": false,
  "message": "订单不存在"
}
```

**缺少邮箱地址 (400):**
```json
{
  "success": false,
  "message": "订单没有邮箱地址，无法发送邮件"
}
```

**缺少参数 (400):**
```json
{
  "success": false,
  "message": "订单编号不能为空"
}
```

**服务器错误 (500):**
```json
{
  "success": false,
  "message": "邮件发送失败: connection timeout"
}
```

## 注意事项

1. 订单必须存在且有邮箱地址
2. AWS SES 配置必须正确
3. 可以多次调用,没有发送次数限制
4. 建议在测试环境先验证
5. 检查服务器日志查看详细的发送状态

## 常见问题

**Q: 邮件发送失败怎么办?**
A: 检查以下几点:
- AWS SES 配置是否正确
- 发件邮箱是否已验证
- 网络连接是否正常
- 查看服务器日志获取详细错误信息

**Q: 可以批量发送邮件吗?**
A: 当前接口只支持单个订单,如需批量发送,可以循环调用此接口。

**Q: 是否需要认证?**
A: 不需要,这是公开接口。但建议在生产环境添加认证或限制访问IP。
