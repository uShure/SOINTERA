#!/bin/bash

# Настройки
PROJECT_DIR="/var/www/sointera-bot"
BACKUP_DIR="/var/backups/sointera-bot"
MAX_BACKUPS=7  # Хранить последние 7 бэкапов
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="sointera-bot-backup-${TIMESTAMP}"

# Создаем директорию для бэкапов если её нет
mkdir -p ${BACKUP_DIR}

# Логирование
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${BACKUP_DIR}/backup.log
}

log "🔄 Начинаю резервное копирование..."

# Останавливаем бота для консистентности данных
log "⏸ Останавливаю бота..."
systemctl stop sointera-bot

# Создаем бэкап
log "📦 Создаю архив ${BACKUP_NAME}.tar.gz..."
cd /var/www
tar -czf ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz \
    --exclude='sointera-bot/node_modules' \
    --exclude='sointera-bot/logs/*.log' \
    --exclude='sointera-bot/.git' \
    sointera-bot/

# Сохраняем информацию о версии
cat > ${BACKUP_DIR}/${BACKUP_NAME}.info << INFO
Backup created: $(date)
Project directory: ${PROJECT_DIR}
Bot status before backup: $(systemctl is-active sointera-bot)
Disk usage: $(du -sh ${PROJECT_DIR} | cut -f1)
Database size: $(du -sh ${PROJECT_DIR}/sointera.db 2>/dev/null | cut -f1 || echo "N/A")
Node version: $(node --version)
NPM packages: $(cd ${PROJECT_DIR} && npm list --depth=0 2>/dev/null | wc -l) packages
Last 5 commits:
$(cd ${PROJECT_DIR} && git log --oneline -5 2>/dev/null || echo "No git history")
INFO

# Запускаем бота обратно
log "▶️ Запускаю бота..."
systemctl start sointera-bot

# Проверяем статус
if systemctl is-active --quiet sointera-bot; then
    log "✅ Бот успешно запущен после бэкапа"
else
    log "⚠️ Внимание: бот не запустился после бэкапа!"
fi

# Ротация старых бэкапов
log "🗑 Удаляю старые бэкапы (оставляю последние ${MAX_BACKUPS})..."
cd ${BACKUP_DIR}
ls -t sointera-bot-backup-*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f

# Создаем симлинк на последний бэкап для удобства
ln -sf ${BACKUP_NAME}.tar.gz ${BACKUP_DIR}/latest.tar.gz
ln -sf ${BACKUP_NAME}.info ${BACKUP_DIR}/latest.info

# Подсчитываем размер и статистику
BACKUP_SIZE=$(du -sh ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz | cut -f1)
TOTAL_BACKUPS=$(ls ${BACKUP_DIR}/sointera-bot-backup-*.tar.gz 2>/dev/null | wc -l)

log "✅ Бэкап завершен!"
log "📊 Размер: ${BACKUP_SIZE}"
log "📁 Всего бэкапов: ${TOTAL_BACKUPS}"
log "📍 Расположение: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Отправляем уведомление в Telegram (опционально)
if [ ! -z "${TELEGRAM_ADMIN_CHAT_ID}" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_ADMIN_CHAT_ID}" \
        -d "text=✅ Резервное копирование завершено
📦 Размер: ${BACKUP_SIZE}
📁 Всего бэкапов: ${TOTAL_BACKUPS}
⏰ Время: $(date '+%Y-%m-%d %H:%M:%S')" > /dev/null 2>&1
fi
