#!/bin/bash

echo "======================================"
echo "FIFA Store 团队协作配置安装脚本"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Node.js
echo -e "${YELLOW}检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js >= 18.0.0${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"
echo ""

# 检查Yarn
echo -e "${YELLOW}检查 Yarn...${NC}"
if ! command -v yarn &> /dev/null; then
    echo -e "${RED}❌ Yarn 未安装，请先安装 Yarn${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Yarn 版本: $(yarn -v)${NC}"
echo ""

# 检查Git
echo -e "${YELLOW}检查 Git...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git 未安装，请先安装 Git${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git 版本: $(git --version)${NC}"
echo ""

# 配置后端
echo "======================================"
echo "配置后端 (meimei_server)"
echo "======================================"
echo ""

cd meimei_server

echo -e "${YELLOW}安装后端依赖...${NC}"
yarn install
echo ""

echo -e "${YELLOW}安装 Husky 和 Commitlint...${NC}"
yarn add -D husky @commitlint/cli @commitlint/config-conventional
echo ""

echo -e "${YELLOW}初始化 Husky...${NC}"
npx husky install
echo ""

echo -e "${YELLOW}添加 commit-msg hook...${NC}"
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
echo ""

echo -e "${YELLOW}添加 pre-commit hook...${NC}"
npx husky add .husky/pre-commit 'yarn lint'
echo ""

cd ..
echo -e "${GREEN}✅ 后端配置完成${NC}"
echo ""

# 配置前端
echo "======================================"
echo "配置前端 (meimei_ui_vue3)"
echo "======================================"
echo ""

cd meimei_ui_vue3

echo -e "${YELLOW}安装前端依赖...${NC}"
yarn install
echo ""

echo -e "${YELLOW}安装 Husky 和 Commitlint...${NC}"
yarn add -D husky @commitlint/cli @commitlint/config-conventional
echo ""

echo -e "${YELLOW}初始化 Husky...${NC}"
npx husky install
echo ""

echo -e "${YELLOW}添加 commit-msg hook...${NC}"
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
echo ""

echo -e "${YELLOW}添加 pre-commit hook...${NC}"
npx husky add .husky/pre-commit 'yarn lint'
echo ""

cd ..
echo -e "${GREEN}✅ 前端配置完成${NC}"
echo ""

# 总结
echo "======================================"
echo "✅ 团队协作配置完成！"
echo "======================================"
echo ""
echo "📝 下一步："
echo "1. 打开 VS Code，安装推荐的扩展"
echo "2. 阅读 server/AGENTS.md 了解团队规范"
echo "3. 阅读 server/CONTRIBUTING.md 了解如何贡献代码"
echo ""
echo "📚 相关文档："
echo "- server/AGENTS.md"
echo "- server/CONTRIBUTING.md"
echo "- server/CODE_OF_CONDUCT.md"
echo "- server/团队协作配置安装指南.md"
echo ""
echo "🎉 开始愉快的编码吧！"
echo ""
