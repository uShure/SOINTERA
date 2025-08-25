#!/bin/bash

# Скрипт для проверки уведомлений менеджеру
# Использование: bash check-manager-notifications.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Проверка уведомлений менеджеру"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверяем переменные окружения
echo "🔍 Проверяю переменные окружения..."
if [ -z "$MANAGER_USERNAME" ]; then
    echo "❌ MANAGER_USERNAME не установлен"
    echo "Добавьте в .env.local: MANAGER_USERNAME=natalylini"
else
    echo "✅ MANAGER_USERNAME: $MANAGER_USERNAME"
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN не установлен"
else
    echo "✅ TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:0:20}..."
fi

echo ""

# Проверяем логи бота
echo "📋 Последние логи бота (уведомления менеджеру):"
journalctl -u sointera-bot -n 50 | grep -E "(менеджер|уведомлен|запрос менеджеру)" || echo "Нет логов об уведомлениях менеджеру"

echo ""

# Проверяем базу данных
echo "🗄️ Запросы менеджеру в базе данных:"
cd /var/www/sointera-bot
npx prisma studio --port 5555 &
echo "Prisma Studio запущен на порту 5555"
echo "Откройте http://localhost:5555 в браузере для просмотра базы данных"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Для остановки Prisma Studio: pkill -f 'prisma studio'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
