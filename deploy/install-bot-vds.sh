#!/bin/bash

# Скрипт установки SOINTERA AI Продажника (Bot API версия) на VDS сервер
# Для Ubuntu/Debian

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Установка SOINTERA AI Продажника"
echo "         (Telegram Bot API)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверяем что запущено от root
if [ "$EUID" -ne 0 ]; then
   echo "❌ Запустите скрипт от root: sudo bash install-bot-vds.sh"
   exit 1
fi

# Обновляем систему
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Устанавливаем необходимые пакеты
echo "📦 Установка зависимостей..."
apt install -y curl git unzip build-essential

# Устанавливаем Node.js если его нет
if ! command -v node &> /dev/null; then
    echo "📦 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Устанавливаем Bun если его нет
if ! command -v bun &> /dev/null; then
    echo "📦 Установка Bun..."
    curl -fsSL https://bun.sh/install | bash
    source /root/.bashrc
    ln -s /root/.bun/bin/bun /usr/local/bin/bun 2>/dev/null || true
fi

# Создаём директории
echo "📁 Создание директорий..."
mkdir -p /var/www/sointera-bot
mkdir -p /var/log/sointera-bot
mkdir -p /var/www/sointera-bot/logs
mkdir -p /var/www/sointera-bot/backups

# Создаём пользователя www-data если его нет
id -u www-data &>/dev/null || useradd -r -s /bin/false www-data

# Устанавливаем права
chown -R www-data:www-data /var/www/sointera-bot
chown -R www-data:www-data /var/log/sointera-bot

# Копируем файлы проекта
echo "📋 Копирование файлов проекта..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Копируем все файлы
cp -r "$PROJECT_DIR"/* /var/www/sointera-bot/ 2>/dev/null || true
cp -r "$PROJECT_DIR"/.* /var/www/sointera-bot/ 2>/dev/null || true

cd /var/www/sointera-bot

# Создаём базовый .env файл для установки
echo "📝 Создание временного .env файла..."
echo 'DATABASE_URL="file:./sointera.db"' > .env

# Устанавливаем зависимости
echo "📦 Установка зависимостей проекта..."
bun install

# Создаём базу данных (от root сначала, потом передаем права)
echo "🗄️ Инициализация базы данных..."
bun run db:push
bun run seed || true  # Игнорируем ошибку если seed уже был выполнен

# Устанавливаем права на все файлы после создания БД
chown -R www-data:www-data /var/www/sointera-bot

# Создаём .env.local из примера если его нет
if [ ! -f "/var/www/sointera-bot/.env.local" ]; then
    echo "📝 Создание .env.local..."

    cat > /var/www/sointera-bot/.env.local << 'EOF'
# Database
DATABASE_URL="file:./sointera.db"

# OpenAI API
OPENAI_API_KEY=sk-proj-ваш_ключ_openai_здесь

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=ваш_токен_бота_здесь

# Менеджер для передачи сложных вопросов
MANAGER_USERNAME=natalylini

# Для работы на VDS сервере
HEADLESS=true
EOF

    echo ""
    echo "⚠️  ВАЖНО: Отредактируйте файл /var/www/sointera-bot/.env.local"
    echo "   и добавьте:"
    echo "   1. Ваш ключ OpenAI API"
    echo "   2. Токен Telegram бота"
    echo ""
    echo "Команда для редактирования:"
    echo "  nano /var/www/sointera-bot/.env.local"
    echo ""
fi

# Устанавливаем права доступа
chown -R www-data:www-data /var/www/sointera-bot
chmod 600 /var/www/sointera-bot/.env.local

# Создаём systemd сервис для бота
echo "⚙️ Создание systemd сервиса..."
cat > /etc/systemd/system/sointera-bot.service << 'EOF'
[Unit]
Description=SOINTERA AI Sales Bot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/sointera-bot
ExecStart=/usr/local/bin/bun run start:bot
Restart=always
RestartSec=10

# Логирование
StandardOutput=append:/var/log/sointera-bot/service.log
StandardError=append:/var/log/sointera-bot/error.log

# Переменные окружения
Environment="NODE_ENV=production"
Environment="HEADLESS=true"

# Ограничения
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Перезагружаем systemd
systemctl daemon-reload

# Создаём скрипт управления
echo "📝 Создание скрипта управления..."
cat > /var/www/sointera-bot/manage.sh << 'EOF'
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
EOF

chmod +x /var/www/sointera-bot/manage.sh

echo ""
echo "✅ Установка завершена!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 ВАЖНО! Дальнейшие шаги:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Добавьте токен бота и OpenAI API ключ:"
echo "   nano /var/www/sointera-bot/.env.local"
echo ""
echo "   TELEGRAM_BOT_TOKEN=$1"
echo "   OPENAI_API_KEY=sk-proj-..."
echo ""
echo "2. Запустите бота:"
echo "   systemctl start sointera-bot"
echo "   systemctl enable sointera-bot"
echo ""
echo "3. Проверьте статус:"
echo "   systemctl status sointera-bot"
echo ""
echo "4. Смотрите логи:"
echo "   journalctl -u sointera-bot -f"
echo ""
echo "5. Управление ботом:"
echo "   /var/www/sointera-bot/manage.sh {start|stop|restart|status|logs}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🤖 Не забудьте начать диалог с ботом в Telegram!"
echo "   Найдите его по username и отправьте /start"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
