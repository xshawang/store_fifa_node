# 产品模块简化 - sku_id 作为主键

## 📋 变更说明

产品表结构已简化，**`sku_id` 现在是主键**（自增），不再使用原来的 `id` 字段。

## 🗄️ 数据库表结构

```sql
CREATE TABLE biz_product (
  sku_id BIGINT PRIMARY KEY AUTO_INCREMENT,  -- 主键（自增）
  product_id VARCHAR(50),                     -- 产品ID（原始，非唯一）
  product_name VARCHAR(100),
  handle VARCHAR(100),
  product_url VARCHAR(1000),
  price DECIMAL(12,2),
  compare_at_price DECIMAL(12,2),
  brand VARCHAR(50),
  category VARCHAR(50),
  product_type VARCHAR(100),
  gender VARCHAR(10),
  nation VARCHAR(20),
  tournament VARCHAR(50),
  colour VARCHAR(100),
  size VARCHAR(100),
  sku VARCHAR(50),
  barcode VARCHAR(10),
  image_url VARCHAR(1000),
  description VARCHAR(1000),
  availability VARCHAR(10),
  collection VARCHAR(200),
  status VARCHAR(10),
  create_by VARCHAR(50),
  update_by VARCHAR(50),
  remark VARCHAR(150),
  create_time DATETIME,
  update_time DATETIME
) COMMENT '产品表';
```

## 🔄 主要变更

### 1. Entity 层 (product.entity.ts)
- ✅ 表名: `product` → `biz_product`
- ✅ 主键: `id` → `sku_id` (自增)
- ✅ 移除: `product_id` 的唯一索引
- ✅ 移除: `variant_id` 字段
- ✅ 类型调整: `price`, `compare_at_price` 改为 string 类型

### 2. DTO 层 (req-product.dto.ts)
- ✅ `UpdateProductDto`: 使用 `skuId` 替代 `id`
- ✅ `QueryProductDto`: 新增 `skuId` 查询条件
- ✅ `CreateProductDto`: 新增可选的 `skuId` 字段

### 3. Service 层 (product.service.ts)
- ✅ `findOne()`: 参数从 `id` 改为 `skuId`
- ✅ `update()`: 参数从 `id` 改为 `skuId`
- ✅ `remove()`: 参数从 `ids` 改为 `skuIds`
- ✅ `findAll()`: 排序从 `id` 改为 `skuId`，新增 `skuId` 过滤条件

### 4. Controller 层 (product.controller.ts)
- ✅ GET `/biz/product/:skuId` - 查询单个产品
- ✅ PUT `/biz/product` - 更新产品（使用 `skuId`）
- ✅ DELETE `/biz/product/:skuIds` - 删除产品（支持批量）

### 5. 数据导入脚本 (insert-products.js)
- ✅ 移除 `sku_id` 和 `variant_id` 字段插入
- ✅ `sku_id` 由数据库自增生成
- ✅ 字段顺序调整以匹配新表结构

## 📡 API 接口

### 管理后台接口（需要鉴权）

| 方法 | 路径 | 说明 | 主键参数 |
|------|------|------|----------|
| POST | `/biz/product` | 新增产品 | - |
| GET | `/biz/product/list` | 分页查询 | 支持 `skuId` 过滤 |
| GET | `/biz/product/:skuId` | 查询详情 | `skuId` (number) |
| PUT | `/biz/product` | 更新产品 | `skuId` (body) |
| DELETE | `/biz/product/:skuIds` | 删除产品 | `skuIds` (逗号分隔) |

### 公开接口（无需鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/goods/list` | 查询上架产品列表 |

## 🚀 数据导入

### 重新生成 SQL 文件

```bash
cd d:\users\download\store-fifa.com\new\server\meimei_server
node scripts/insert-products.js
```

### 导入数据库

```bash
mysql -u your_username -p your_database < insert-products.sql
```

## ⚠️ 注意事项

1. **主键变更**: 所有通过 ID 查询/更新/删除的操作现在使用 `skuId`
2. **product_id 不再唯一**: 同一个产品可能有多个 SKU 变体
3. **sku_id 自增**: 导入数据时不要手动指定 `sku_id`，由数据库自动生成
4. **variant_id 已移除**: 该字段已从表结构中删除
5. **前端适配**: 前端页面需要更新所有使用 `id` 的地方改为 `skuId`

## 📝 查询示例

### 查询 sku_id 为空或重复的产品

```sql
-- 空 sku_id（理论上不应该有，因为是自增主键）
SELECT * FROM biz_product WHERE sku_id IS NULL;

-- 重复的 product_id（正常，一个产品多个SKU）
SELECT product_id, COUNT(*) as count
FROM biz_product
GROUP BY product_id
HAVING COUNT(*) > 1;

-- 按 sku_id 查询
SELECT * FROM biz_product WHERE sku_id = 12345;
```

## ✅ 已完成的文件更新

- [x] product.entity.ts
- [x] req-product.dto.ts
- [x] product.service.ts
- [x] product.controller.ts
- [x] insert-products.js
- [x] insert-products.sql (重新生成)

## 🔄 后续工作

如需更新前端页面，请参考以下文件：
- `src/views/biz/product/index.vue` - 产品管理页面
- `src/api/biz/product.js` - API 接口文件

前端需要将所有的 `id` 引用改为 `skuId`。
