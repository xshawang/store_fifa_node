# 贡献指南

感谢你对本项目感兴趣！我们欢迎所有形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境搭建](#开发环境搭建)
- [提交流程](#提交流程)
- [代码规范](#代码规范)
- [测试指南](#测试指南)
- [问题反馈](#问题反馈)

## 行为准则

本项目采用 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。请保持尊重、包容的协作环境。

## 如何贡献

### 1. 报告 Bug

使用 Issue 模板报告 Bug，包含：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（OS、Node版本等）
- 截图（如适用）

### 2. 提出新功能

创建 Issue 讨论新功能：
- 功能描述
- 使用场景
- 实现方案（可选）
- 相关参考

### 3. 提交代码

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开发环境搭建

### 前置要求

- Node.js >= 18.0.0
- Yarn >= 1.22.0
- MySQL >= 8.0
- Git >= 2.0

### 后端 (meimei_server)

```bash
cd server/meimei_server

# 安装依赖
yarn install

# 配置环境变量
cp .env.development .env

# 初始化数据库
mysql -u root -p < init.sql

# 启动开发服务器
yarn start:dev
```

### 前端 (meimei_ui_vue3)

```bash
cd server/meimei_ui_vue3

# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

## 提交流程

### 1. 选择正确的分支

- `main`: 生产环境代码
- `develop`: 开发环境代码
- 功能开发基于 `develop` 分支

### 2. 创建分支

```bash
# 功能分支
git checkout -b feature/模块名-功能描述 develop

# 修复分支
git checkout -b bugfix/问题描述 develop
```

### 3. 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 格式
<type>(<scope>): <subject>

# 示例
feat(order): 添加订单批量导入功能
fix(payment): 修复PIX支付回调处理错误
docs(readme): 更新贡献指南
```

#### Type 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式 |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

#### Scope 范围

**后端**:
- `order`, `product`, `payment`, `user`, `auth`, `config`

**前端**:
- `order`, `product`, `dashboard`, `layout`, `api`, `utils`

### 4. 代码审查

- 至少1人 Review 通过
- CI/CD 流水线通过
- 所有评论已解决

### 5. 合并

维护者审核后合并到 `develop` 分支。

## 代码规范

### 后端规范

#### 目录结构
```
src/modules/
├── order/
│   ├── order.controller.ts
│   ├── order.service.ts
│   ├── order.module.ts
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   └── update-order.dto.ts
│   └── entities/
│       └── order.entity.ts
```

#### 命名规范
- 文件: `kebab-case`
- 类名: `PascalCase`
- 方法: `camelCase`
- 常量: `UPPER_SNAKE_CASE`

#### API 响应格式
```typescript
{
  code: 200,
  message: 'success',
  data: {...},
  timestamp: 1714377600000
}
```

### 前端规范

#### 组件结构
```vue
<template>
  <!-- 模板 -->
</template>

<script setup lang="ts">
// 逻辑代码
</script>

<style scoped>
/* 样式 */
</style>
```

#### 命名规范
- 组件文件: `PascalCase.vue`
- 组合式函数: `usePascalCase.ts`
- 工具函数: `camelCase.ts`

### 代码检查

```bash
# 后端
yarn lint
yarn format

# 前端
yarn lint
yarn format
```

## 测试指南

### 后端测试

```bash
# 运行所有测试
yarn test

# 运行单个测试文件
yarn test order.service.spec.ts

# 覆盖率测试
yarn test:cov

# E2E 测试
yarn test:e2e
```

### 前端测试

```bash
# 单元测试
yarn test:unit

# E2E 测试
yarn test:e2e
```

### 测试覆盖率要求

- 核心业务逻辑: >= 80%
- 工具函数: >= 90%
- API 接口: >= 70%

## 问题反馈

### Bug 报告

使用 Issue 模板，包含：
1. 问题描述
2. 复现步骤
3. 预期行为
4. 实际行为
5. 环境信息
6. 截图/日志

### 功能请求

1. 功能描述
2. 使用场景
3. 实现建议（可选）
4. 相关参考

## 📚 学习资源

- [NestJS 文档](https://docs.nestjs.com/)
- [Vue 3 文档](https://vuejs.org/)
- [TypeORM 文档](https://typeorm.io/)
- [Element Plus 文档](https://element-plus.org/)

## 🤝 成为贡献者

1. 找到感兴趣的 Issue 或创建新 Issue
2. 在 Issue 中说明你想处理
3. Fork 仓库并创建分支
4. 开发并测试
5. 提交 Pull Request
6. 参与 Code Review
7. 合并成功 🎉

## 📞 联系方式

- Issue: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: team@example.com
- 讨论区: [GitHub Discussions](https://github.com/your-repo/discussions)

---

感谢你的贡献！🙏
