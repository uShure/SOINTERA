#!/bin/bash

# Настройки
BACKUP_DIR="/var/backups/sointera-bot"
PROJECT_DIR="/var/www/sointera-bot"
RESTORE_DIR="/var/www"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    echo -e "${2}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Проверка запуска от root
if [ "$EUID" -ne 0 ]; then 
   log "Запустите скрипт от root: sudo bash restore.sh" "$RED"
   exit 1
fi

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}    🔄 Восстановление из бэкапа${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# Если указан конкретный бэкап
if [ ! -z "$1" ]; then
    BACKUP_FILE="$1"
else
    # Показываем доступные бэкапы
    echo "📁 Доступные бэкапы:"
    echo ""
    
    BACKUPS=($(ls -t ${BACKUP_DIR}/sointera-bot-backup-*.tar.gz 2>/dev/null))
    
    if [ ${#BACKUPS[@]} -eq 0 ]; then
        log "Нет доступных бэкапов!" "$RED"
        exit 1
    fi
    
    for i in "${!BACKUPS[@]}"; do
        BACKUP_NAME=$(basename ${BACKUPS[$i]})
        BACKUP_DATE=$(echo $BACKUP_NAME | sed 's/sointera-bot-backup-//;s/.tar.gz//')
        BACKUP_SIZE=$(du -sh ${BACKUPS[$i]} | cut -f1)
        
        if [ $i -eq 0 ]; then
            echo -e "  ${GREEN}[$i]${NC} ${BACKUP_NAME} (${BACKUP_SIZE}) ${YELLOW}← последний${NC}"
        else
            echo -e "  ${GREEN}[$i]${NC} ${BACKUP_NAME} (${BACKUP_SIZE})"
        fi
        
        # Показываем информацию если есть
        INFO_FILE="${BACKUPS[$i]%.tar.gz}.info"
        if [ -f "$INFO_FILE" ]; then
            echo -e "      📅 $(grep "Backup created:" $INFO_FILE | cut -d: -f2-)"
        fi
    done
    
    echo ""
    read -p "Выберите номер бэкапа для восстановления [0]: " choice
    choice=${choice:-0}
    
    if [ $choice -lt 0 ] || [ $choice -ge ${#BACKUPS[@]} ]; then
        log "Неверный выбор!" "$RED"
        exit 1
    fi
    
    BACKUP_FILE=${BACKUPS[$choice]}
fi

# Проверяем существование файла
if [ ! -f "$BACKUP_FILE" ]; then
    log "Файл бэкапа не найден: $BACKUP_FILE" "$RED"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  ВНИМАНИЕ!${NC}"
echo "Это действие:"
echo "  • Остановит текущего бота"
echo "  • Создаст резервную копию текущего состояния"
echo "  • Восстановит выбранный бэкап"
echo ""
read -p "Продолжить? (yes/no) [no]: " confirm

if [ "$confirm" != "yes" ]; then
    log "Отменено пользователем" "$YELLOW"
    exit 0
fi

# Создаем бэкап текущего состояния перед восстановлением
log "📸 Создаю снимок текущего состояния..." "$YELLOW"
EMERGENCY_BACKUP="${BACKUP_DIR}/emergency-$(date +%Y%m%d_%H%M%S).tar.gz"
cd /var/www
tar -czf ${EMERGENCY_BACKUP} sointera-bot/ 2>/dev/null || true

# Останавливаем бота
log "⏸ Останавливаю бота..." "$YELLOW"
systemctl stop sointera-bot

# Удаляем текущую версию
log "🗑 Удаляю текущую версию..." "$YELLOW"
rm -rf ${PROJECT_DIR}

# Восстанавливаем из бэкапа
log "📦 Восстанавливаю из бэкапа..." "$GREEN"
cd ${RESTORE_DIR}
tar -xzf ${BACKUP_FILE}

# Восстанавливаем права
log "🔐 Восстанавливаю права доступа..." "$YELLOW"
chown -R www-data:www-data ${PROJECT_DIR}
chmod 600 ${PROJECT_DIR}/.env.local 2>/dev/null || true

# Устанавливаем зависимости
log "📦 Устанавливаю зависимости..." "$YELLOW"
cd ${PROJECT_DIR}
sudo -u www-data bun install

# Запускаем бота
log "▶️ Запускаю бота..." "$GREEN"
systemctl start sointera-bot

# Проверяем статус
sleep 3
if systemctl is-active --quiet sointera-bot; then
    log "✅ Восстановление завершено успешно!" "$GREEN"
    log "✅ Бот запущен и работает!" "$GREEN"
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}Восстановлено из: $(basename $BACKUP_FILE)${NC}"
    echo -e "${GREEN}Аварийный бэкап: ${EMERGENCY_BACKUP}${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
else
    log "⚠️ Бот не запустился!" "$RED"
    log "Проверьте логи: journalctl -u sointera-bot -n 50" "$YELLOW"
    
    echo ""
    echo -e "${YELLOW}Для отката к предыдущему состоянию:${NC}"
    echo -e "${YELLOW}bash restore.sh ${EMERGENCY_BACKUP}${NC}"
fi
