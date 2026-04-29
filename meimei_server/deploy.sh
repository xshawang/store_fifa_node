#!/bin/bash

# ========================================
# PM2 管理脚本 - 支持 start/stop/restart/reload/logs/status
# 用法: ./pm2-manage.sh [start|stop|restart|reload|logs|status|monit]
# ========================================
echo ' git update new code '
git pull origin master

echo ' npm run build'
npm run build

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="meimei_server"
CONFIG_FILE="ecosystem.config.js"

# 切换到脚本所在目录
cd "$(dirname "$0")"

case "$1" in
    start)
        echo -e "${GREEN}正在启动 ${APP_NAME}...${NC}"
        pm2 start ${CONFIG_FILE}
        pm2 save
        echo -e "${GREEN}启动完成！${NC}"
        pm2 status
        ;;
    
    stop)
        echo -e "${YELLOW}正在停止 ${APP_NAME}...${NC}"
        pm2 stop ${APP_NAME}
        echo -e "${YELLOW}已停止${NC}"
        ;;
    
    restart)
        echo -e "${BLUE}正在重启 ${APP_NAME}...${NC}"
        pm2 restart ${APP_NAME}
        echo -e "${BLUE}重启完成！${NC}"
        pm2 status
        ;;
    
    reload)
        echo -e "${BLUE}正在重载 ${APP_NAME} (零停机)...${NC}"
        pm2 reload ${APP_NAME}
        echo -e "${BLUE}重载完成！${NC}"
        ;;
    
    logs)
        echo -e "${GREEN}查看实时日志 (Ctrl+C 退出)...${NC}"
        pm2 logs ${APP_NAME} --lines 100
        ;;
    
    status)
        echo -e "${GREEN}应用状态：${NC}"
        pm2 status
        ;;
    
    monit)
        echo -e "${GREEN}打开监控面板 (Ctrl+C 退出)...${NC}"
        pm2 monit
        ;;
    
    delete)
        echo -e "${YELLOW}正在删除 ${APP_NAME}...${NC}"
        pm2 delete ${APP_NAME}
        pm2 save
        echo -e "${YELLOW}已删除${NC}"
        ;;
    
    *)
        echo "用法: $0 {start|stop|restart|reload|logs|status|monit|delete}"
        echo ""
        echo "命令说明："
        echo "  start   - 启动应用"
        echo "  stop    - 停止应用"
        echo "  restart - 重启应用"
        echo "  reload  - 零停机重载应用"
        echo "  logs    - 查看实时日志"
        echo "  status  - 查看应用状态"
        echo "  monit   - 打开监控面板"
        echo "  delete  - 删除应用"
        exit 1
        ;;
esac
