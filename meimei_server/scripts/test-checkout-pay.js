/**
 * /checkout/pay 接口测试脚本
 * 
 * 使用方法:
 * node test-checkout-pay.js
 */

const http = require('http');
const querystring = require('querystring');

// 配置
const HOST = 'localhost';
const PORT = 3000;
const PATH = '/checkout/pay';

// 测试数据
const testData = {
  v: '121212121',
  email: 'wwww@124.com',
  countryCode: 'US',
  firstName: 'john',
  lastName: 'smith',
  address1: 'fource',
  address2: 'dsdsf',
  postalCode: '2323',
  phone: '1232342',
  number: '6011 5916 6560 7745',
  expiry: '12 / 34',
  verification_value: '234',
  name: 'john smith',
  phone2: '2323232323'
};

console.log('========================================');
console.log('测试 /checkout/pay 接口');
console.log('========================================\n');

console.log('测试数据:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n');

// 将数据编码为 URL 格式
const postData = querystring.stringify(testData);

console.log('编码后的数据:');
console.log(postData);
console.log('\n');

// 构建请求选项
const options = {
  hostname: HOST,
  port: PORT,
  path: PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'Cookie': '_shopify_y=test_user_123; token=test_token_456'
  }
};

console.log('发送请求...');
console.log(`URL: http://${HOST}:${PORT}${PATH}`);
console.log(`Method: POST`);
console.log(`Headers: ${JSON.stringify(options.headers, null, 2)}`);
console.log('\n');

// 发送请求
const req = http.request(options, (res) => {
  console.log('========================================');
  console.log('响应状态码:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers, null, 2));
  console.log('========================================\n');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('响应数据:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log(data);
    }

    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================');
  });
});

req.on('error', (error) => {
  console.error('请求失败:');
  console.error(error.message);
  console.error(error.stack);
});

// 写入请求体
req.write(postData);
req.end();

console.log('等待响应...\n');
