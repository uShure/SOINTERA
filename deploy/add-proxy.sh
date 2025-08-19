#!/bin/bash

# Скрипт для добавления прокси в конфигурацию бота

echo "🌐 Настройка прокси для Telegram Bot"
echo ""

# Проверяем существование файла конфигурации
if [ ! -f "/var/www/sointera-bot/.env.local" ]; then
    echo "❌ Файл конфигурации не найден!"
    echo "   Сначала установите бота: bash deploy/quick-install.sh"
    exit 1
fi

# Добавляем прокси настройки
echo "📝 Добавляю прокси настройки..."

# Проверяем, не добавлены ли уже настройки прокси
if grep -q "HTTPS_PROXY" /var/www/sointera-bot/.env.local; then
    echo "⚠️  Прокси уже настроен. Для изменения отредактируйте файл вручную:"
    echo "   nano /var/www/sointera-bot/.env.local"
else
    # Добавляем настройки прокси
    cat >> /var/www/sointera-bot/.env.local << 'EOF'

# Прокси для обхода блокировок (опционально)
# Раскомментируйте и укажите ваш прокси если нужно
# HTTPS_PROXY=http://user:pass@proxy.server:port
# HTTP_PROXY=http://user:pass@proxy.server:port
EOF

    echo "✅ Настройки прокси добавлены!"
fi

echo ""
echo "📝 Для включения прокси:"
echo "1. Отредактируйте файл конфигурации:"
echo "   nano /var/www/sointera-bot/.env.local"
echo ""
echo "2. Раскомментируйте и укажите ваш прокси:"
echo "   HTTPS_PROXY=http://proxy.server:port"
echo ""
echo "3. Перезапустите бота:"
echo "   systemctl restart sointera-bot"
echo ""
echo "🆓 Бесплатные прокси для Telegram (не всегда работают):"
echo "   - http://proxy.digitalresistance.dog:443"
echo "   - http://51.75.126.150:9999"
echo ""
echo "💡 Рекомендуется использовать платные прокси для стабильной работы"
echo ""
