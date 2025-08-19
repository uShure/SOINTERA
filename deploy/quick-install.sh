#!/bin/bash

# Быстрая установка SOINTERA Bot с предустановленным токеном
# Использование: bash quick-install.sh

set -e

# Токен бота (предоставлен пользователем)
BOT_TOKEN="8128363202:AAEZFG-NgADzF5VGwpPskSCafSJgccczdD8"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Быстрая установка SOINTERA Bot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🤖 Токен бота: ${BOT_TOKEN:0:20}..."
echo ""

# Проверяем что запущено от root
if [ "$EUID" -ne 0 ]; then
   echo "❌ Запустите скрипт от root: sudo bash quick-install.sh"
   exit 1
fi

# Запускаем основной установщик
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
bash "$SCRIPT_DIR/install-bot-vds.sh"

# Автоматически добавляем токен в конфигурацию
echo ""
echo "📝 Добавляю токен бота в конфигурацию..."
sed -i "s/TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=$BOT_TOKEN/" /var/www/sointera-bot/.env.local

echo ""
echo "✅ Токен бота установлен!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  ВАЖНО: Добавьте OpenAI API ключ!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Откройте файл конфигурации:"
echo "  nano /var/www/sointera-bot/.env.local"
echo ""
echo "И добавьте ваш OpenAI API ключ:"
echo "  OPENAI_API_KEY=sk-proj-..."
echo ""
echo "После этого запустите бота:"
echo "  systemctl start sointera-bot"
echo "  systemctl enable sointera-bot"
echo ""
echo "Проверьте статус:"
echo "  systemctl status sointera-bot"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
