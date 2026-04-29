#!/bin/bash

# ========================================
# PM2 启动脚本 - ecosystem.config.js
# 用途: 在 Linux 系统中使用 PM2 启动应用
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 PM2 是否安装
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 未安装，正在安装..."
        npm install -g pm2
        if [ $? -eq 0 ]; then
            print_info "PM2 安装成功"
        else
            print_error "PM2 安装失败，请手动安装: npm install -g pm2"
            exit 1
        fi
    else
        print_info "PM2 已安装: $(pm2 --version)"
    fi
}

# 检查 ecosystem.config.js 是否存在
check_config() {
    if [ ! -f "ecosystem.config.js" ]; then
        print_error "找不到 ecosystem.config.js 文件"
        print_error "请确保在正确的目录下运行此脚本"
        exit 1
    fi
    print_info "找到 ecosystem.config.js 配置文件"
}

# 停止已存在的应用实例
stop_existing() {
    print_info "检查是否存在已运行的应用实例..."
    pm2 list | grep -q "meimei_server"
    if [ $? -eq 0 ]; then
        print_warn "发现已运行的实例，正在停止..."
        pm2 stop meimei_server 2>/dev/null
        pm2 delete meimei_server 2>/dev/null
        print_info "已停止旧实例"
    else
        print_info "没有已运行的实例"
    fi
}

# 启动应用
start_app() {
    print_info "正在启动应用..."
    pm2 start ecosystem.config.js
    
    if [ $? -eq 0 ]; then
        print_info "应用启动成功！"
    else
        print_error "应用启动失败！"
        exit 1
    fi
}

# 保存 PM2 进程列表
save_pm2_list() {
    print_info "保存 PM2 进程列表..."
    pm2 save
    print_info "PM2 进程列表已保存"
}

# 设置 PM2 开机自启
setup_startup() {
    print_info "设置 PM2 开机自启动..."
    pm2 startup
    print_info "请复制并执行上方输出的命令以完成开机自启设置"
}

# 显示应用状态
show_status() {
    print_info "应用状态："
    echo "================================"
    pm2 status
    echo "================================"
}

# 显示日志
show_logs() {
    print_info "查看实时日志 (Ctrl+C 退出)："
    pm2 logs meimei_server --lines 50
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  PM2 应用启动脚本"
    echo "========================================"
    echo ""

    # 切换到脚本所在目录
    cd "$(dirname "$0")"
    print_info "工作目录: $(pwd)"

    # 1. 检查 PM2
    check_pm2

    # 2. 检查配置文件
    check_config

    # 3. 停止已存在的实例
    stop_existing

    # 4. 启动应用
    start_app

    # 5. 保存进程列表
    save_pm2_list

    # 6. 显示状态
    show_status

    echo ""
    print_info "启动完成！"
    echo ""
    print_info "常用命令："
    echo "  查看状态: pm2 status"
    echo "  查看日志: pm2 logs meimei_server"
    echo "  重启应用: pm2 restart meimei_server"
    echo "  停止应用: pm2 stop meimei_server"
    echo "  查看监控: pm2 monit"
    echo ""
}

# 执行主函数
main
