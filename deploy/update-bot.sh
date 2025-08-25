#!/bin/bash

# Скрипт для обновления SOINTERA Bot на сервере
# Использование: bash update-bot.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Обновление SOINTERA Bot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверяем что запущено от root
if [ "$EUID" -ne 0 ]; then
   echo "❌ Запустите скрипт от root: sudo bash update-bot.sh"
   exit 1
fi

# Останавливаем бота
echo "⏹ Останавливаю бота..."
systemctl stop sointera-bot || true

# Переходим в директорию бота
cd /var/www/sointera-bot

# Обновляем код из Git
echo "📥 Обновляю код из Git..."
git fetch origin
git reset --hard origin/main

# Устанавливаем зависимости
echo "📦 Устанавливаю зависимости..."
npm install

# Генерируем Prisma клиент
echo "🔧 Генерирую Prisma клиент..."
npx prisma generate

# Применяем миграции базы данных
echo "🗄️ Применяю миграции базы данных..."
npx prisma db push

# Запускаем бота
echo "🚀 Запускаю бота..."
systemctl start sointera-bot
systemctl enable sointera-bot

# Проверяем статус
echo ""
echo "📊 Статус бота:"
systemctl status sointera-bot

echo ""
echo "✅ Обновление завершено!"
echo ""
echo "Проверить логи:"
echo "  journalctl -u sointera-bot -f"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
