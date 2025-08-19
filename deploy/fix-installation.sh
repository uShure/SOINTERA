#!/bin/bash

# Скрипт исправления установки
echo "🔧 Исправление установки..."

# Переходим в директорию проекта
cd /var/www/sointera-bot

# Создаём базу данных от root
echo "🗄️ Создание базы данных..."
bun run db:push
bun run seed || true

# Устанавливаем правильные права
echo "🔐 Установка прав доступа..."
chown -R www-data:www-data /var/www/sointera-bot
chmod 600 /var/www/sointera-bot/.env.local

# Добавляем токен бота если его нет
if ! grep -q "TELEGRAM_BOT_TOKEN=8128363202" /var/www/sointera-bot/.env.local; then
    echo "📝 Добавляю токен бота..."
    sed -i "s/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=8128363202:AAEZFG-NgADzF5VGwpPskSCafSJgccczdD8/" /var/www/sointera-bot/.env.local
fi

echo ""
echo "✅ Исправления применены!"
echo ""
echo "📝 Теперь добавьте OpenAI ключ:"
echo "   nano /var/www/sointera-bot/.env.local"
echo ""
echo "После добавления ключа запустите бота:"
echo "   systemctl start sointera-bot"
echo "   systemctl enable sointera-bot"
echo ""
