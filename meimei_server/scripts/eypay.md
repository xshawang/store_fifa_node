## 新增支付通道 eypay
# 商户私钥
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCKid0goeWZGpKc6o/UsJGYdgeRYX3bpUYE1WhJcX9ilwFEhXh2iXJmR+MCPe/WDE0ZrQokfY2gO4Cknj0+99e1fyXpS/LnJZAzAAG2elaxRXFnmQzPCL8+d15fRDviNEGhLUqfZNxj4rx4jOjNXDS60OtyU/Kqpe4k9CKbEXBfEinUNihPPcxJ+e5B/IDhMHTbr/ssnqaWU4Ku/dWIQJYfJOTW59XQhDYzKYTsBIQx8ZG0yVUTksYTXaCEI1uwukRXbmMIV4T7tlRuhcw4+bsBOT++6kBFCyxPf61NttPn5I4NoICeAbXmxqQXpFPG97Dk2OBAe2Fy5sUljjRlBikjAgMBAAECggEALhMTu9qcJYM054MLOs1OXspCUhN+bCJXWxwuht58YymdflB1c9baeTHHSeOXdDS7H6LxEJnBFF01t4n5DIwY7X/P9/sOWdmgT5Xc+/dMBcD2qmG4ZNKf6AKDHGPxFpYSjawmeURuF7o8vEsA0eusjcUVyPwqZJ6yyQ94wuHV4YgDsd6GtxK9VrAk6zDQVZBjn0kgQGNoPwckZCAWnPkiV8XdxgMxPy4JbjKjBDIGOUOS9byaI7ZM+G9wPOQN2wBenfbaDtPXjfQ8qaLEWmiO+AB35/zGgl/eM5oBIx7bZfxUOOSaoES1F2udnWHnR7/g/nNc48G5aeUdD3CCXPk4AQKBgQDx7zpBRqcPGqVw1UOOkBKvfdzOtVQBO2g4sGAuG4jaUMimPvnhRZZoZQZfYvbVAjrBO1MaKeUYXlSMdrUVooiBsmvsLG3xqa3tvAePiWzckRYKibK5IXS2kOM+tpPMCiu+8FbsAkUSmCVpJJZQDlwU+F4st41FwGjlpWwHM1QfAQKBgQCSl8SZTtr/aVWTO1Mw6iwWFXcYn0bJOFkjPmkY0xetU0R0M0jfU4vvZNoTpjdsDwqIM789fjo8659o8YVDG1Ks0WO3A/cH9BK0zgfeSXMbabUt35v9urKwVhNhI/x6BTBxp5cO18lalDNUTrh0RLchmsZlRlPC9FRaoajZpPHsIwKBgQDI+QoyeWeDY4Y1IeOZxNLQ10QaroSW9WuRU+rBwnu/p0XW3A+lc7ILDIjrqgETV2PJaueQn2bBBHNFr8Kjsz2kR7vhF9NI4cQq7Xx2XxmAbEGcBWDi6wjSM6+iQ/aok3ZdibcbHJOWa68AFbWL0THq9Zr9mIiRfdFlmzIPFTN3AQKBgGrOAuKEDpFKqJvF/H3GD+rjJsucuJFA6ckA3sfEfRq+cUCMYQq9r1XzT+RDFVw4tT65HRvrjPj330QxvBtBnAHn6VPdoq17yelLt3XgY+pUITpUEi5SSYCqpiH/eyNYBoy4QxoAZGcHVUKWvFOSAS+NugDttXd0VsVVxVUVlWGrAoGAJKa1hOBNege4MLLQI51brKcUfdpW/m4AyILDWVIm8KZDDkzJnZZYs2gcIxtVGI5acdEFkfh+qGNFyr+Aya1g6AcrI47nK1bb0V3wgKXBEZ/GqP1HNPnf2C0rlXUjp5KdNbhThLByfcDmL7Dz2veVPauDvfTANojON0RpXG2sFrY=
#　商户公钥
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlee9VLToY5dhZilBk9d2Q6sLDg82Mb3wDISvrIURhVYYN3PHL3Yo6LW2mo+avuzR7GUlYXjExXrO8BZV/oKTr3R9fJFx9pNMePb6X8KLH7Lau0BpV7sHucCdoFI0k6vtTklOYSkNrybROl2wdWiKyTZxiuo+Nv9aPzAk9hfFdJpofRAl3YzeGvTSqq2scT7MN9SExYgrobBgG32RMBEXWjI+wMQvtvVfahAxZAQ0Mqmfb0xfGkFN8rPbBFH9B8gG3utfWZknWhCQe1UmU919fpw3brRN8Xqgr1r2W1JgNTFFvYEJ0zXp1FCP6CoGgnY1pANpM9PF4X/eVBChP+K1pQIDAQAB
# secretKey
23710e8678a74fc0b91f479d730eb3f9
# 商户正式环境的回调IP  54.233.234.196,18.229.23.62,56.125.86.62,18.229.182.144,56.125.155.115

## 下单接口 https://api.eypays.com/merchant-api/v1/order/create POST
下单参数 query_string="",request_body=(请求参数JSON格式)
 header 参数 nonce=(8-128位随机字符串只能是字母数字组成）， timestamp=13位时间戮时区为东八区自1970年1月1日0点0分0秒以来的毫秒数，考虑时区问题） Authorization=23710e8678a74fc0b91f479d730eb3f9

 # request_body请求体参数 {"product_desc":"Recebimento de 10 menos 
1","user_ip":"111.11.32.32","amount":"1100","time_start":"20250614120042","de
scription":"beneficiário","trade_type":"pix","notify_url":"https://merchant.n
otify.com","merchant_order_no":"M1de76cc356684c3cbc5ac59562c5bb48","product_t
itle":"beneficiário"}

# 签名步骤:
组装参数  
以 换⾏符（"\n"） 拼接各个字段 注意: query_string 数值为空 默认为空字符串即
不同的语⾔,换⾏符可能有所不同
组装成要签名的数据,例如:
method+"\n"+query_string+"\n"+nonce+"\n"+timestamp+"\n"+Authorization+"\n"+re
quest_data
# 进⾏编码
以UTF-8编码将待签名字符串转换成字节数组,然后使⽤商户私钥对其签名,签名算法为
SHA256WithRSA,将签名后的结果以Base64编码转码后存放到header中,key为'sign'.
假如签名结果为 

则最后的请求Header是:
 HHYnZ95kceS+ccyYr8lgglWLG8dnO7w3DOZ1Y4x9zh2DoYYVMRoGz/666eLKltHDXrRF1P0TDlMs+
ywYamz+cSWRIDw1HARF7dwTfPvQknasJyGXztraEXhppo/y306/yxzdu1YKCgyQiDVlaWoMCJig8g
AjSBWcCoIKxGAD4PsRfUplB2B0EhckC3xuJgbmdc88OMaA2E3HIHW7WAmycFGMGKCP9TqVDWdlHJ4
aCgNNNwDbD7TY3hcU+lrME+7om6ofB7+hs0Rv3qGiioUbs9YS/+C1jJucQ5HB6NY+c3NtWNvQU1Td
M/8f2K1aerbcyE7wedeCZ0WIEZdDbty0IQ==

则最后的请求Header是
POST /v1/order/create HTTP/1.1
Host: 替换⽀付系统域名地址/merchant-api
ContentType: application/json;charset=utf-8
Authorization: 31a82ecd6a414205bba3f5959787ec9b
nonce: 0d12ef2a0942485cb6ee90e2f6a8dde6
timestamp: 1749873643180
sign: 
HHYnZ95kceS+ccyYr8lgglWLG8dnO7w3DOZ1Y4x9zh2DoYYVMRoGz/666eLKltHDXrRF1P0TDlMs+
ywYamz+cSWRIDw1HARF7dwTfPvQknasJyGXztraEXhppo/y306/yxzdu1YKCgyQiDVlaWoMCJig8g
AjSBWcCoIKxGAD4PsRfUplB2B0EhckC3xuJgbmdc88OMaA2E3HIHW7WAmycFGMGKCP9TqVDWdlHJ4
aCgNNNwDbD7TY3hcU+lrME+7om6ofB7+hs0Rv3qGiioUbs9YS/+C1jJucQ5HB6NY+c3NtWNvQU1Td
M/8f2K1aerbcyE7wedeCZ0WIEZdDbty0IQ==


{"product_desc":"Recebimento de 10 menos 
1","user_ip":"111.11.32.32","amount":"1100","time_start":"20250614120042","de
scription":"beneficiário","trade_type":"pix","notify_url":"https://merchant.n
otify.com","merchant_order_no":"M1de76cc356684c3cbc5ac59562c5bb48","product_t
itle":"beneficiário"}

# 响应数据验签  
 返回的response示例

ContentType: application/json;charset=utf-8
Authorization: 31a82ecd6a414205bba3f5959787ec9b
nonce: 974830e8e50c4b2e9a97dcbe926a03f9
timestamp: 1749873643992
sign: 
lx+eLiAb7unskt32uBM/Jom64AnYFCReayDRHI/EACwGCPPrFp1AdciVwelx+zVMmQGHOnBoXHHXT
e9j4f0++HkS05dqf5SS5TE3DMAJsx7hmOsDVAGvGNFnryxBo8Gm+Woi0TYatQpsJBjk7Si3mHicla
XW37SvzkxKXHm35h68vKvxmliv/ypiZWK+xgv4nRbFkI3J/ZaHY+IZWD7wZ1YaeXw3ftsxPfV9bL7
c5OR+46QAnrTjNASVQVKbSAzAzQlYLtbgtykhahk+qisRda44NevqRp8zwRxshM1P/LRfhkgSaBls
xhm5kHHVhcks+2h7yj7ImONhGmT7QYt0sw==
{"credential":
{"pix":"00020101021226900014br.gov.bcb.pix2568qrcode.siliumpay.com.br/dynamic
/7f47b3e5-b5d1-49a2-b0e7-eb76105cae465204000053039865802BR5907RW LTDA6009Sao 
Paulo62070503***6304F505"},"merchant_order_no":"M1de76cc356684c3cbc5ac59562c5
bb48","order_no":"TD2506141383415859275563008","return_code":"SUCCESS","retur
n_msg":"OK","status":"SUCCESS","trade_type":"pix"}
组装参数  
验签前以 '\n' 拼接各个字段: nonce+'\n'+timestamp+'\n'+Authorization+'\n'+response_data
组装成要验签的数据,例如:
974830e8e50c4b2e9a97dcbe926a03f9
1749873643992
31a82ecd6a414205bba3f5959787ec9b
{"credential":
{"pix":"00020101021226900014br.gov.bcb.pix2568qrcode.siliumpay.com.br/dynamic
/7f47b3e5-b5d1-49a2-b0e7-eb76105cae465204000053039865802BR5907RW LTDA6009Sao 
Paulo62070503***6304F505"},"merchant_order_no":"M1de76cc356684c3cbc5ac59562c5
bb48","order_no":"TD2506141383415859275563008","return_code":"SUCCESS","retur
n_msg":"OK","status":"SUCCESS","trade_type":"pix"}
进⾏编码 
以UTF-8编码将待验签字符串转换成字节数组,然后使⽤⽀付平台公钥对其签名,签名算法为
SHA256WithRSA.
进⾏验签 
将第⼆步的签名结果和Header中取到的sign进⾏⽐对,相同即为验签通过,可以说明该响应数据来
⾃于⽀付平台.
注意事项 
对数据进⾏签名或验签时,字段顺序不能变；
对签名后的值要进⾏Base64编码后才能往header中存放；
验签时对获取到的签名数据【sign】 要进⾏ Base64 解码后再进⾏验证；
验签时要对 签名数据、商户secret key、请求的时效性 进⾏验证

# RSA签名/验签⽅法代码示例
java语⾔
import javax.crypto.Cipher;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
public class RSA {
public static String ALGORITHM = "RSA";
public static String SIGN_ALGORITHMS = "SHA256WithRSA";// 摘要加密算饭
public static String CHAR_SET = "UTF-8";
/**
 * 数据签名
 * 
 * @param content
 *            
 * @param privateKey
 *            
签名内容
私钥
 * @return 返回签名数据
 */
public static String sign(String content, String privateKey) {
try {
PKCS8EncodedKeySpec priPKCS8 = new PKCS8EncodedKeySpec(
Base64.decode(privateKey));
KeyFactory keyf = KeyFactory.getInstance("RSA");
PrivateKey priKey = keyf.generatePrivate(priPKCS8);
java.security.Signature signature = java.security.Signature
.getInstance(SIGN_ALGORITHMS);
signature.initSign(priKey);
signature.update(content.getBytes(CHAR_SET));
byte[] signed = signature.sign();
return Base64.encode(signed);
} catch (Exception e) {
e.printStackTrace();
}
return null;
}
/**
 * 签名验证
 *
 * @param content
 * @param sign
 * @param public_key
 * @return
 */
public static boolean verify(String content, String sign,String 
public_key) {
try {
    KeyFactory keyFactory = KeyFactory.getInstance("RSA");
    byte[] encodedKey = Base64.decode(public_key);
    PublicKey pubKey = keyFactory
    .generatePublic(new X509EncodedKeySpec(encodedKey));
    java.security.Signature signature = java.security.Signature
    .getInstance(SIGN_ALGORITHMS);
    signature.initVerify(pubKey);
    signature.update(content.getBytes(CHAR_SET));
    return signature.verify(Base64.decode(sign));
} catch (Exception e) {
    e.printStackTrace();
}
return false;
}
## 下单 使⽤HTTP协议调⽤下单接⼝发起请求
 
请求参数  
  
POST /v1/order/create HTTP/1.1
Host: 替换⽀付系统域名地址/merchant-api
ContentType: application/json;charset=utf-8
Authorization: {开发者SecretKey}
nonce: {随机字符串}
timestamp: {时间戳}
sign: {签名数据}

请求参数
字段名 变量名 类型 必填 示例值 描述
商户订单号 merchant_order_no String(64) 是 M1de76cc356684c3cbc5ac59562c5bb48 商户系统内部订单号，要求64个字符内，只能是数字、⼤⼩写字⺟_
商品标题 product_title String 是 beneficiário 购买商品的标题
商品描述 product_desc String(128) 是 beneficiário 购买商品的描述信息，要求128个字符内
⾦额 amount Int 是 1000 订单总⾦额，单位为分
订单描述 description String(300) 否 beneficiário 订单描述，要求300个字符内，不能包含特殊字符:英⽂逗号，注意：下载对账单会返回此字段数据
交易类型 trade_type String(30) 是 pix 交易类型:请联系客服获取
接⼝异步通知地址 URL notify_url String(500) 是 http://wwww1344.com/trade/notify ⽀付结果异步通知地址，HTTP/HTTPS开头字符串，注意：订单状态成功才会通知该地址
⽤户下单IP user_ip String 是 123.11.23.13 ⽤户下单实际IP地址
交易创建时间 time_start String(14) 是 20190918112605 订单⽣成时间，格式为yyyyMMddHHmmss

# 返回结果
字
段
名
变量名类型必
填示例值描述
⽹
关
返
回
码
return_code String(16)是SUCCESS
错误代码，详细参⻅下⽂
错误码说明 SUCCESS 
功 其他错误码均为失败
⽹
关
返
回
码
描
述
return_msg String(128)是OK
当return_code
回信息为错误原因
签名失败，参数格式校验
错误
商
户
订
单
号
merchant_order_no String(64)否M1de76cc356684c3cbc5ac59562c5bb48
商户系统内部订单号
注:return_code=SUCCESS
返回
⽀
付
平
台
订
单
号
order_no String(29)否TD2506141383415859275563008
⽀付平台产⽣的订单号
注:return_code=SUCCESS
返回
订
单
⾦
额
amount Int否1000
商户订单⾦额 单位
注:return_code=SUCCESS
返回
交
易
类
型
trade_type String(30)否pix
交易类型:pix⽀付
区分⼤⼩写  
注:return_code=SUCCESS
返回
⽀
付
凭
据
credential String否
pix⽀付返回信息
{"pix":"00020101021226900014br.gov.bcb.pix2568qrcode.siliumpay.com.br/dynamic/7f47b3e5
b5d1-49a2-b0e7-eb76105cae465204000053039865802BR5907RW LTDA6009Sao 
Paulo62070503***6304F505","cashierUrl":"H5⽀付链接地址URL"}
⽀付凭据，返回⽀付链接
URL 数值格式{"
数值":"⽀付链接
URL","cashierUrl":"
H5⽀付链接地址
注:return_code=SUCCESS
返回
订
单
受
理
状
态
status String(16)否PROCESSIN

下单示例  
请求body报⽂(json格式)
{
    "product_desc": "Recebimento de 10 menos 1",
  "user_ip": "111.11.32.32",
  "amount": "1100",
  "time_start": "20250614120042",
  "description": "beneficiário",
  "trade_type": "pix",
  "notify_url": "https://merchant.notify.com",
  "merchant_order_no": "M1de76cc356684c3cbc5ac59562c5bb48",
  "product_title": "beneficiário
}

响应body报⽂(json格式)

{
  "credential": {
  "pix": 
"00020101021226900014br.gov.bcb.pix2568qrcode.siliumpay.com.br/dynamic/7f47b3
e5-b5d1-49a2-b0e7-eb76105cae465204000053039865802BR5907RW LTDA6009Sao 
Paulo62070503***6304F505",
  "cashierUrl":"https://api.xx.com/cashier/pay.html?
orderNo%3DTD2507061391521093667475456%26merchantOrderNo%3DM4ccf039abd9f4ee18c
a538523b513d4b%26orderAmount%3D11.00%26payType%3Dpix%26ts%3D1751806082341%26o
riginalFlag%3D0%26encryptOrderNo%3De88c436c3faa2a4adbe973c95b20d923"
  },
  "merchant_order_no": "M1de76cc356684c3cbc5ac59562c5bb48",
  "order_no": "TD2506141383415859275563008",
  "return_code": "SUCCESS",
  "return_msg": "OK",
  "status": "SUCCESS",
  "trade_type": "pix"
}