# 产品管理系统使用说明

## 概述
本系统包含了完整的产品管理功能，包括后端API、数据库导入脚本和前端管理界面。

## 目录结构

### 后端 (meimei_server)
```
meimei_server/
├── src/modules/biz/product/
│   ├── entities/
│   │   └── product.entity.ts          # 产品实体定义
│   ├── dto/
│   │   └── req-product.dto.ts         # 数据传输对象
│   ├── product.service.ts              # 业务逻辑层
│   ├── product.controller.ts           # 控制器（包含公开接口）
│   └── product.module.ts               # 模块配置
├── scripts/
│   └── insert-products.js              # 数据导入脚本生成器
└── insert_products.sql                 # 生成的SQL文件（运行脚本后生成）
```

### 前端 (meimei_ui_vue3)
```
meimei_ui_vue3/
├── src/api/biz/
│   └── product.js                      # 产品API接口
└── src/views/biz/product/
    └── index.vue                       # 产品管理页面
```

## 部署步骤

### 1. 数据库准备

#### 方式一：使用SQL脚本导入（推荐）

1. 生成SQL导入脚本：
```bash
cd d:\users\download\store-fifa.com\new\server\meimei_server
node scripts/insert-products.js
```

这将生成 `insert_products.sql` 文件

2. 执行SQL脚本导入数据：
```bash
mysql -u your_username -p your_database < insert_products.sql
```

或在MySQL客户端中执行：
```sql
source d:/users/download/store-fifa.com/new/server/meimei_server/insert_products.sql;
```

#### 方式二：通过API批量导入

使用后端提供的批量导入接口（需要自行编写导入逻辑）

### 2. 启动后端服务

```bash
cd d:\users\download\store-fifa.com\new\server\meimei_server
npm run start:dev
```

后端服务将在 http://localhost:3000 启动

### 3. 启动前端服务

```bash
cd d:\users\download\store-fifa.com\new\server\meimei_ui_vue3
npm run dev
```

前端服务将在 http://localhost:5173 启动

### 4. 添加菜单权限

登录系统管理后台，在"系统管理 -> 菜单管理"中添加产品管理菜单：

**菜单配置：**
- 菜单名称：产品管理
- 父菜单：业务管理（或根据需要选择）
- 路由地址：/biz/product
- 组件路径：biz/product/index
- 权限标识：biz:product:query
- 菜单类型：目录/菜单
- 显示状态：显示
- 菜单状态：正常

**按钮权限：**
1. 产品查询 - `biz:product:query`
2. 产品新增 - `biz:product:add`
3. 产品修改 - `biz:product:edit`
4. 产品删除 - `biz:product:remove`

## API 接口文档

### 管理后台接口（需要鉴权）

#### 1. 新增产品
- **URL**: `POST /biz/product`
- **权限**: `biz:product:add`
- **请求体**: 
```json
{
  "productId": "7520429834298",
  "productName": "FIFA World Cup 2026™ Colombia Federation Cap",
  "brand": "adidas",
  "category": "Caps",
  "price": "35.0",
  "imageUrl": "https://...",
  "status": 1
}
```

#### 2. 查询产品列表（分页）
- **URL**: `GET /biz/product/list`
- **权限**: `biz:product:query`
- **查询参数**:
  - `pageNum`: 页码
  - `pageSize`: 每页数量
  - `productId`: 产品ID（可选）
  - `productName`: 产品名称（可选，模糊搜索）
  - `brand`: 品牌（可选）
  - `category`: 类别（可选）
  - `status`: 状态（可选）

#### 3. 查询产品详情
- **URL**: `GET /biz/product/:id`
- **权限**: `biz:product:query`

#### 4. 修改产品
- **URL**: `PUT /biz/product`
- **权限**: `biz:product:edit`
- **请求体**: 同新增，需包含 `id` 字段

#### 5. 删除产品
- **URL**: `DELETE /biz/product/:ids`
- **权限**: `biz:product:remove`
- **参数**: ids为逗号分隔的ID字符串

### 公开接口（无需鉴权）

#### 查询上架产品列表
- **URL**: `GET /api/goods/list`
- **权限**: 公开（无需登录）
- **查询参数**:
  - `pageNum`: 页码
  - `pageSize`: 每页数量
  - `productName`: 产品名称（可选，模糊搜索）
  - `brand`: 品牌（可选）
  - `category`: 类别（可选）
  - `collection`: 集合（可选）
- **说明**: 只返回状态为"上架"（status=1）的产品

**示例请求**:
```bash
curl http://localhost:3000/api/goods/list?pageNum=1&pageSize=20&brand=adidas
```

**示例响应**:
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "rows": [
      {
        "id": 1,
        "productId": "7520429834298",
        "productName": "FIFA World Cup 2026™ Colombia Federation Cap",
        "brand": "adidas",
        "category": "Caps",
        "price": "35.0",
        "imageUrl": "https://...",
        "status": 1
      }
    ],
    "total": 100
  }
}
```

## 产品字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 主键ID（自增） |
| productId | string | 产品ID（原始，唯一） |
| productName | string | 产品名称 |
| handle | string | 产品句柄（URL友好名称） |
| productUrl | string | 产品URL |
| price | string | 价格 |
| compareAtPrice | string | 原价/划线价 |
| currency | string | 货币（默认USD） |
| brand | string | 品牌 |
| category | string | 类别 |
| productType | string | 产品类型 |
| gender | string | 性别 |
| nation | string | 国家 |
| tournament | string | 赛事 |
| colour | string | 颜色 |
| size | string | 尺码 |
| sku | string | SKU |
| skuId | string | SKU ID |
| variantId | string | 变体ID |
| barcode | string | 条形码 |
| imageUrl | string | 图片URL |
| description | string | 描述 |
| availability | string | 库存状态 |
| collection | string | 集合/系列 |
| status | number | 状态：0-下架 1-上架 |

## 注意事项

1. **数据库索引**: 系统已为 `product_id`, `brand`, `category`, `collection` 字段创建索引，提升查询性能

2. **批量导入**: SQL脚本采用分批插入（每批100条），避免单次插入数据过大

3. **数据验证**: 
   - `productId` 字段唯一，不允许重复
   - 新增产品时会检查产品ID是否已存在

4. **权限控制**: 
   - 管理接口需要登录并具有相应权限
   - `/api/goods/list` 为公开接口，无需鉴权

5. **分页查询**: 所有列表接口均支持分页，默认每页10条

## 常见问题

### Q: 如何修改默认每页显示数量？
A: 在前端页面的 `queryParams` 中修改 `pageSize` 值

### Q: 如何导出产品数据？
A: 可以基于现有代码添加Excel导出功能，参考系统管理中的导出实现

### Q: 公开接口如何限制只返回上架产品？
A: 后端 `findPublicList` 方法强制设置 `status = 1`，确保只返回上架产品

### Q: 如何批量更新产品状态？
A: 可以在后端添加批量更新接口，或直接在数据库中执行UPDATE语句

## 技术支持

如有问题，请检查：
1. 数据库连接配置是否正确
2. 产品表是否成功创建
3. 后端服务是否正常启动
4. 前端API路径是否正确
5. 权限是否已正确配置
