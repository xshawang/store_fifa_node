支付通道LPAY 聚合支付 

根据项目支付结构，实现功能，根据订单编号查询商品价格，创建付款订单，调用通道方的请求规则，生成请求字符串，获取返回数据，根据响应结果，获取支付跳转地址，进行302跳转同时更新支付订单状态。

1,签名规则
将所有请求参数（除sign外）按参数名ASCII码从小到大排序
为空参数不参与签名
将排序后的参数用&连接成字符串
在字符串末尾加上&和商户密钥
对整个字符串进行MD5加密并转大写
// 示例
参数: api_key=test123&amount=100&merchant_order_no=ORDER001
密钥: 123456
签名字符串: amount=100&api_key=test123&merchant_order_no=ORDER001&123456
签名结果: MD5(签名字符串).toUpperCase()
2,支付接口
POST /api/v2/pay/in
代收支付接口

请求参数
参数名	类型	必填	说明
api_key	string	是	商户号（纯数字）
amount	string	是	支付金额（元）
code	string	是	通道编码 （商户后台获取）
merchant_order_no	string	是	商户订单号（唯一）
notify_url	string	是	异步通知地址
sign	string	是	请求签名
请求示例
POST /api/v1/pay/in
Content-Type: application/json

{
    "api_key": "test123",
    "amount": 100.00,
    "code": "ALIPAY",
    "merchant_order_no": "ORDER001",
    "notify_url": "https://example.com/notify",
    "sign": "ABC123DEF456"
}
响应示例
200成功响应
{
    "code": 1,
    "msg": "OK",
    "data": {
        "order_no": "LI202401011234567890", // 平台单号
        "merchant_order_no": "ORDER001", // 商户单号
        "pay_url": "https://pay.example.com/pay?order=LI202401011234567890", // 支付地址
        "pay_data": ""                       //支付参数（巴西地区有值其他地区为空）
        "amount":"100.00", // 订单金额
        "status": 0, // 状态 0 代支付，1 已支付，2 失败，3 退款
        "msg": ""
    }
}

