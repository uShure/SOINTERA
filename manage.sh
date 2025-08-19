#!/bin/bash

case "$1" in
    start)
        echo "🚀 Запуск бота..."
        systemctl start sointera-bot
        systemctl status sointera-bot
        ;;
    stop)
        echo "⏹ Остановка бота..."
        systemctl stop sointera-bot
        ;;
    restart)
        echo "🔄 Перезапуск бота..."
        systemctl restart sointera-bot
        systemctl status sointera-bot
        ;;
    status)
        systemctl status sointera-bot
        ;;
    logs)
        journalctl -u sointera-bot -n 100
        ;;
    tail)
        journalctl -u sointera-bot -f
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|status|logs|tail}"
        exit 1
        ;;
esac
