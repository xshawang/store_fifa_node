# FIFA Store 项目团队协作配置

本文档包含 meimei_server（后端）和 meimei_ui_vue3（前端）项目的团队协作规范和配置。

## 📁 项目结构

```
store-fifa.com/
├── server/
│   ├── meimei_server/          # NestJS 后端 API 服务
│   └── meimei_ui_vue3/         # Vue3 前端管理界面
├── html/                       # FIFA商店静态页面（数据源）
└── 分析过程/                   # 数据提取和分析文档
```

## 🎯 技术栈

### 后端 (meimei_server)
- **框架**: NestJS (Node.js)
- **数据库**: MySQL 8.0+
- **ORM**: TypeORM
- **包管理**: Yarn
- **部署**: PM2 + Docker

### 前端 (meimei_ui_vue3)
- **框架**: Vue 3 + Vite
- **UI库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **包管理**: Yarn
- **构建**: Vite

## 👥 团队协作规范

### Git 工作流

#### 分支策略
```
main                    # 生产环境（稳定版本）
├── develop            # 开发环境（集成分支）
├── feature/xxx        # 功能分支
├── bugfix/xxx         # 修复分支
└── release/v1.x.x     # 发布分支
```

#### 分支命名规范
- **功能分支**: `feature/模块名-功能描述` 
  - 例: `feature/order-payment`、`feature/product-import`
- **修复分支**: `bugfix/问题描述`
  - 例: `bugfix/order-status-update`、`bugfix/sql-injection`
- **发布分支**: `release/版本号`
  - 例: `release/v1.0.0`、`release/v1.2.0`

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动
- `ci`: CI/CD配置变更

#### Scope 范围
**后端 (meimei_server)**:
- `order`: 订单模块
- `product`: 商品模块
- `payment`: 支付模块
- `user`: 用户模块
- `auth`: 认证授权
- `config`: 配置相关

**前端 (meimei_ui_vue3)**:
- `order`: 订单管理
- `product`: 商品管理
- `dashboard`: 仪表盘
- `layout`: 布局组件
- `api`: API接口
- `utils`: 工具函数

#### 示例
```bash
# 后端提交
feat(order): 添加订单批量导入功能
fix(payment): 修复PIX支付回调处理错误
refactor(product): 优化SKU去重逻辑

# 前端提交
feat(order): 添加订单列表筛选功能
fix(dashboard): 修复统计数据计算错误
style(product): 统一商品卡片样式
```

### 代码审查 (Code Review)

#### PR/MR 规范
1. **标题**: 使用提交信息规范的格式
2. **描述**: 
   - 变更内容概述
   - 影响范围
   - 测试情况
   - 相关Issue链接

3. **必需检查项**:
   - [ ] 代码符合编码规范
   - [ ] 已添加必要的单元测试
   - [ ] 本地测试通过
   - [ ] 文档已更新
   - [ ] 无敏感信息泄露

#### Review 流程
1. 创建PR/MR到 `develop` 分支
2. 至少1人Review通过
3. CI/CD流水线通过
4. 合并到 `develop`
5. 定期合并到 `main` 发布

## 📝 编码规范

### 后端规范 (NestJS)

#### 目录结构
```
src/
├── modules/          # 业务模块
│   ├── order/       # 订单模块
│   ├── product/     # 商品模块
│   └── payment/     # 支付模块
├── common/          # 公共模块
│   ├── filters/     # 异常过滤器
│   ├── guards/      # 守卫
│   ├── interceptors/# 拦截器
│   └── utils/       # 工具函数
└── config/          # 配置文件
```

#### 命名规范
- **文件**: `kebab-case` (例: `order.controller.ts`)
- **类名**: `PascalCase` (例: `OrderController`)
- **方法名**: `camelCase` (例: `createOrder`)
- **常量**: `UPPER_SNAKE_CASE` (例: `MAX_RETRY_COUNT`)

#### API 响应格式
```typescript
{
  code: number;        // 状态码
  message: string;     // 提示信息
  data: any;          // 数据
  timestamp: number;   // 时间戳
}
```

### 前端规范 (Vue3)

#### 目录结构
```
src/
├── api/             # API接口
├── views/           # 页面组件
├── components/      # 公共组件
├── router/          # 路由配置
├── store/           # 状态管理
├── utils/           # 工具函数
└── styles/          # 样式文件
```

#### 命名规范
- **组件文件**: `PascalCase.vue` (例: `OrderList.vue`)
- **组合式函数**: `use` + `PascalCase` (例: `useOrder.ts`)
- **工具函数**: `camelCase` (例: `formatDate`)

#### 组件编写规范
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 组合式API
import { ref, onMounted } from 'vue'

// 响应式数据
const orderList = ref([])

// 方法
const fetchOrders = async () => {
  // ...
}

// 生命周期
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
/* 样式 */
</style>
```

## 🧪 测试规范

### 后端测试
```bash
# 单元测试
yarn test

# 覆盖率测试
yarn test:cov

# E2E测试
yarn test:e2e
```

### 前端测试
```bash
# 单元测试
yarn test:unit

# E2E测试
yarn test:e2e
```

## 🚀 部署规范

### 环境配置
- **开发环境**: `.env.development`
- **测试环境**: `.env.test`
- **生产环境**: `.env.production`

### 部署流程
1. 合并代码到 `main` 分支
2. 打版本标签: `git tag v1.x.x`
3. CI/CD自动构建和部署
4. 验证生产环境

### 后端部署
```bash
# PM2部署
pm2 start ecosystem.config.js --env production

# Docker部署
docker-compose up -d
```

### 前端部署
```bash
# 构建
yarn build

# 部署dist目录到服务器
```

## 🔐 安全规范

### 敏感信息
- ❌ **禁止**在代码中硬编码密码、密钥、Token
- ✅ 使用环境变量 `.env` 文件
- ✅ 使用密钥管理服务

### 数据验证
- 后端必须进行参数验证
- 使用 `class-validator` 进行DTO验证
- 防止SQL注入、XSS攻击

### 权限控制
- 使用JWT认证
- 实施RBAC权限模型
- 敏感操作需要二次验证

## 📊 代码质量

### ESLint + Prettier
```bash
# 检查代码
yarn lint

# 格式化代码
yarn format
```

### 提交前检查
已配置 Husky + lint-staged，提交前自动：
1. ESLint 检查
2. Prettier 格式化
3. 单元测试运行

### 代码复杂度
- 函数圈复杂度 <= 10
- 函数长度 <= 50行
- 文件长度 <= 300行

## 📚 文档规范

### API 文档
- 使用 Swagger/OpenAPI
- 每个接口必须有描述
- 包含请求/响应示例

### 代码注释
- 复杂逻辑必须注释
- 使用 JSDoc 格式
- 说明 why，而不是 what

### CHANGELOG
使用 [Keep a Changelog](https://keepachangelog.com/) 格式：
```markdown
## [1.0.0] - 2026-04-29

### Added
- 订单管理功能
- 商品导入功能

### Fixed
- 修复支付回调问题
```

## 🤝 协作工具

### 沟通
- 日常沟通: 企业微信/钉钉
- 代码讨论: GitLab/GitHub Comments
- 技术分享: 每周技术会议

### 项目管理
- 任务管理: Jira/Tapd
- 文档协作: 语雀/Notion
- 代码托管: GitLab/GitHub

### 监控告警
- 应用监控: Sentry
- 性能监控: New Relic
- 日志管理: ELK Stack

## 📋 检查清单

### 新功能开发
- [ ] 需求评审通过
- [ ] 技术方案设计
- [ ] 数据库设计（如需要）
- [ ] API 接口设计
- [ ] 单元测试编写
- [ ] 代码审查通过
- [ ] 文档更新完成

### Bug 修复
- [ ] 问题复现步骤
- [ ] 根本原因分析
- [ ] 修复方案评估
- [ ] 测试用例补充
- [ ] 回归测试通过
- [ ] 影响范围评估

### 版本发布
- [ ] 功能测试完成
- [ ] 性能测试通过
- [ ] 安全扫描通过
- [ ] 文档更新完成
- [ ] 回滚方案准备
- [ ] 发布通知发送

## 🎓 学习资源

### 官方文档
- [NestJS](https://docs.nestjs.com/)
- [Vue 3](https://vuejs.org/)
- [TypeORM](https://typeorm.io/)
- [Element Plus](https://element-plus.org/)

### 团队Wiki
- 技术栈使用指南
- 最佳实践总结
- 常见问题FAQ

---

**最后更新**: 2026-04-29  
**维护者**: 开发团队  
**版本**: v1.0.0
