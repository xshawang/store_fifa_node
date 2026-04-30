# FIFA Store 团队协作配置安装脚本 (Windows PowerShell)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "FIFA Store 团队协作配置安装脚本" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 检查Node.js
Write-Host "检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js >= 18.0.0" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 检查Yarn
Write-Host "检查 Yarn..." -ForegroundColor Yellow
try {
    $yarnVersion = yarn -v
    Write-Host "✅ Yarn 版本: $yarnVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Yarn 未安装，请先安装 Yarn" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 检查Git
Write-Host "检查 Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git 版本: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装，请先安装 Git" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 配置后端
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "配置后端 (meimei_server)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Set-Location meimei_server

Write-Host "安装后端依赖..." -ForegroundColor Yellow
yarn install
Write-Host ""

Write-Host "安装 Husky 和 Commitlint..." -ForegroundColor Yellow
yarn add -D husky @commitlint/cli @commitlint/config-conventional
Write-Host ""

Write-Host "初始化 Husky..." -ForegroundColor Yellow
npx husky install
Write-Host ""

Write-Host "添加 commit-msg hook..." -ForegroundColor Yellow
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
Write-Host ""

Write-Host "添加 pre-commit hook..." -ForegroundColor Yellow
npx husky add .husky/pre-commit 'yarn lint'
Write-Host ""

Set-Location ..
Write-Host "✅ 后端配置完成" -ForegroundColor Green
Write-Host ""

# 配置前端
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "配置前端 (meimei_ui_vue3)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Set-Location meimei_ui_vue3

Write-Host "安装前端依赖..." -ForegroundColor Yellow
yarn install
Write-Host ""

Write-Host "安装 Husky 和 Commitlint..." -ForegroundColor Yellow
yarn add -D husky @commitlint/cli @commitlint/config-conventional
Write-Host ""

Write-Host "初始化 Husky..." -ForegroundColor Yellow
npx husky install
Write-Host ""

Write-Host "添加 commit-msg hook..." -ForegroundColor Yellow
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'
Write-Host ""

Write-Host "添加 pre-commit hook..." -ForegroundColor Yellow
npx husky add .husky/pre-commit 'yarn lint'
Write-Host ""

Set-Location ..
Write-Host "✅ 前端配置完成" -ForegroundColor Green
Write-Host ""

# 总结
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ 团队协作配置完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 下一步：" -ForegroundColor Yellow
Write-Host "1. 打开 VS Code，安装推荐的扩展"
Write-Host "2. 阅读 server/AGENTS.md 了解团队规范"
Write-Host "3. 阅读 server/CONTRIBUTING.md 了解如何贡献代码"
Write-Host ""
Write-Host "📚 相关文档：" -ForegroundColor Yellow
Write-Host "- server/AGENTS.md"
Write-Host "- server/CONTRIBUTING.md"
Write-Host "- server/CODE_OF_CONDUCT.md"
Write-Host "- server/团队协作配置安装指南.md"
Write-Host ""
Write-Host "🎉 开始愉快的编码吧！" -ForegroundColor Green
Write-Host ""
