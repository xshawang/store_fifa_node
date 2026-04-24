# 购物车 API 文档

## 概述
购物车模块实现了前端用户添加商品到购物车的功能，用户信息从 cookie 中自动提取。

## 数据库表结构

### biz_cart 表
- **cart_id**: 购物车ID（主键，自增）
- **user_id**: 用户标识（从 cookie `_shopify_essential` 中提取）
- **product_id**: 产品ID
- **variant_id**: 变体ID（对应请求中的 `id` 字段）
- **size**: 尺码
- **form_type**: 表单类型（默认 'product'）
- **quantity**: 数量（默认 1）
- **section_id**: section ID
- **sections**: sections
- **sections_url**: sections URL
- **product_name**: 产品名称（从产品表自动填充）
- **price**: 产品价格（从产品表自动填充）
- **product_url**: 产品URL（从产品表自动填充）
- **status**: 状态（0-已删除，1-正常）
- **create_time**: 创建时间
- **update_time**: 更新时间
- **create_by**: 创建人
- **update_by**: 更新人
- **remark**: 备注
- **version**: 版本号

## API 接口

### 1. 添加商品到购物车

**接口地址**: `POST /cart/add`

**访问权限**: 公开接口（无需 JWT 认证）

**请求头**:
```
Content-Type: application/x-www-form-urlencoded
Cookie: _shopify_essential=:AZ2uljVzAAEAMNcQVE3w9FnH9u7rgsx0...:; _shopify_s=ebcf85d3-0973-455d-aad5-473c525cc025; ...
```

**请求参数** (表单数据):
```
Size-1: S
form_type: product
utf8: ✓
id: 41356756090938
product-id: 7529164767290
section-id: template--16263586480186__main
sections: cart-drawer,cart-icon-bubble
sections_url: /products/2026-world-cup-miami-homestyle-t-shirt-unisex
```

**参数说明**:
- `Size-1`: 尺码（如：S, M, L, XL）
- `form_type`: 表单类型（固定为 'product'）
- `utf8`: UTF-8 编码标记（固定为 '✓'）
- `id`: 变体ID（variant_id）
- `product-id`: 产品ID
- `section-id`: section ID（可选）
- `sections`: sections（可选）
- `sections_url`: sections URL（可选）

**用户信息提取**:
系统会自动从请求的 Cookie 中提取用户标识，优先级如下：
1. `_shopify_essential` - 主要用户标识
2. `_shopify_s` - 备用用户标识
3. `_shopify_analytics` - 分析用户标识

**业务逻辑**:
1. 从 Cookie 中提取用户标识（userId）
2. 检查购物车中是否已存在相同用户、相同产品、相同尺码的记录
3. 如果存在，则增加数量
4. 如果不存在，则创建新的购物车记录
5. 自动从产品表中查询产品信息（产品名称、价格、URL）并填充到购物车记录中

**响应示例**:
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "cartId": 1,
    "userId": "AZ2uljVzAAEAMNcQVE3w9FnH9u7rgsx0WHQSdhuVbf73cUDuziP82Ozmk-nXpXVoDA45vOHHscfw-rrxCnDehPHlf0c6oV7Ree_CEz5GG4zIlP7IBkGvT5sghwPlAa5lMFIssE9Q17lE2SEfCMtUTo_I_VWnBN1Jrp_Vp71DW2RhKpd5dTvlkI3QsZP979RJlVbne29E3DW5bKci5To4-4xEmouvnUxBzFc1rn-rHmofnLRMliBonKEBxgp6c8F8E6iSuuU1bFBrC-iTwtRQ8jK-kh0cRYC-lGEwJkWKQUTyRyojwnX5luKvkLEAd0YPVj7QPQ5y2JB6SlT5VrCwZLn3-5nsxgeAtGtqwUipcyOnT3gMBohmdS59bZuj5OtH_NJMR--JF5KJEEhXAJ3vwwXwk3F-zNxy3OuLaKh2desdeeI__f6i0F02sIe9CBiW4LTwQ0M2-jvH_55b-1wYbmGbqqIvuI6lSKqqDm-EzkkRu-jFxcovKyjaFojD8rGxpD_6SpufRG4PsgC15KBbSEuDVB9BuVRQw5D1C94iEglgg6DjmXNqWNrDDVItxT9y_8YuVSeNPy6tTX3m5aBXhpI36eFX1vjBcMyg98PWgeCqOg-vDgoImBy17JO7nWhlvgskwifjTdKvWkBMCvTZ5jMxzreckOdusKmyoohPVj7frVNli_ST54mYDhB-F10mSFmOiJC4YBjhus_O-gdjuJ2YXoxv4s_9nC8fh6SQUfvtYEeA-Q3aaVHBpq2b-ltDM4kIBitWY6cX1OeHpjxVfHHAtnS93N0tLgjYoKjavOc4I6Z8nvS4-roBheTVx6ooAuUXc5zP_nxGBgEEgGCESNta2rZuRNQl7GPbWpax_0ToVR1VazYa6QJpn576e5-N0I2m77aIC_t92wuLQ4XAix9pPwx9uRyeYpQnWXsPuqGbiDcUfCiJTRx_GCo42gDSzijqsM8RKZscbZwLbG_K69vx7jowEr1OP4eQfFoNe7gc0DPNwmf00_zmDGFycNZ49oTT3IQWFg",
    "productId": 7529164767290,
    "variantId": "41356756090938",
    "size": "S",
    "formType": "product",
    "quantity": 1,
    "sectionId": "template--16263586480186__main",
    "sections": "cart-drawer,cart-icon-bundle",
    "sectionsUrl": "/products/2026-world-cup-miami-homestyle-t-shirt-unisex",
    "productName": "2026 World Cup Miami Homestyle T-Shirt Unisex",
    "price": 45.00,
    "productUrl": "/products/2026-world-cup-miami-homestyle-t-shirt-unisex",
    "status": 1,
    "createTime": "2026-04-24 13:30:00",
    "updateTime": "2026-04-24 13:30:00"
  }
}
```

### 2. 查询购物车列表（公开接口）

**接口地址**: `GET /api/cart/list`

**访问权限**: 公开接口（从 Cookie 自动识别用户）

**请求参数**:
```
pageNum: 1
pageSize: 10
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "rows": [...],
  "total": 10
}
```

### 3. 更新购物车数量

**接口地址**: `PUT /cart`

**访问权限**: 需要管理员权限

**请求参数**:
```json
{
  "cartId": 1,
  "quantity": 5
}
```

### 4. 删除购物车项

**接口地址**: `DELETE /cart/:cartIds`

**访问权限**: 需要管理员权限

**请求示例**: `DELETE /cart/1,2,3`

### 5. 清空购物车

**接口地址**: `POST /cart/clear`

**访问权限**: 需要管理员权限

## 数据库初始化

执行以下 SQL 脚本创建购物车表：

```bash
mysql -u your_username -p your_database < d:\users\download\store-fifa.com\new\server\create_cart_table.sql
```

## 使用示例

### cURL 示例

```bash
curl -X POST http://localhost:3000/cart/add \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Cookie: _shopify_essential=:AZ2uljVzAAEAMNcQVE3w9FnH9u7rgsx0...:; _shopify_s=ebcf85d3-0973-455d-aad5-473c525cc025;" \
  -d "Size-1=S" \
  -d "form_type=product" \
  -d "utf8=✓" \
  -d "id=41356756090938" \
  -d "product-id=7529164767290" \
  -d "section-id=template--16263586480186__main" \
  -d "sections=cart-drawer,cart-icon-bundle" \
  -d "sections_url=/products/2026-world-cup-miami-homestyle-t-shirt-unisex"
```

### JavaScript/Fetch 示例

```javascript
const response = await fetch('http://localhost:3000/cart/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    'Size-1': 'S',
    'form_type': 'product',
    'utf8': '✓',
    'id': '41356756090938',
    'product-id': '7529164767290',
    'section-id': 'template--16263586480186__main',
    'sections': 'cart-drawer,cart-icon-bundle',
    'sections_url': '/products/2026-world-cup-miami-homestyle-t-shirt-unisex',
  }),
  credentials: 'include', // 自动携带 cookie
});

const result = await response.json();
console.log(result);
```

## 注意事项

1. **Cookie 必须存在**: 请求必须携带有效的 Cookie，否则无法识别用户
2. **自动去重**: 同一用户添加相同产品相同尺码时，会自动增加数量而不是创建新记录
3. **产品信息自动填充**: 如果产品存在于 `biz_product` 表中，会自动填充产品名称、价格和URL
4. **软删除**: 删除购物车项时采用软删除（status=0），不会真正删除数据
5. **公开接口**: `/cart/add` 和 `/api/cart/list` 是公开接口，不需要 JWT 认证

## 文件结构

```
server/meimei_server/src/modules/biz/cart/
├── dto/
│   └── req-cart.dto.ts          # 数据传输对象
├── entities/
│   └── cart.entity.ts           # 购物车实体
├── cart-cookie.service.ts       # Cookie 解析服务
├── cart.controller.ts           # 控制器
├── cart.module.ts               # 模块
└── cart.service.ts              # 服务
```
