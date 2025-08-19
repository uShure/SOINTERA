# 🤖 SOINTERA AI Sales Bot - Telegram Bot API Version

AI-ассистент для школы парикмахерского искусства SOINTERA, работающий через Telegram Bot API.

## ✨ Преимущества Bot API версии

- ✅ **Не требует номера телефона** - работает через токен бота
- ✅ **Простая настройка** - не нужна авторизация через код
- ✅ **Стабильная работа** - использует официальный Bot API
- ✅ **Легкое масштабирование** - может обслуживать тысячи пользователей
- ✅ **Безопасность** - не имеет доступа к личному аккаунту

## 🚀 Быстрый старт на VDS

### 1. Подготовка

Создайте бота в Telegram:
1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Выберите имя и username для бота
4. Сохраните токен

### 2. Установка на сервер

Подключитесь к серверу по SSH и выполните:

```bash
# Клонируйте репозиторий
cd /tmp
git clone https://github.com/uShure/sointera-ai-sales-bot.git
cd sointera-ai-sales-bot
git checkout backup-20250814

# Запустите быструю установку
chmod +x deploy/quick-install.sh
sudo bash deploy/quick-install.sh
```

### 3. Настройка

Добавьте OpenAI API ключ:
```bash
nano /var/www/sointera-bot/.env.local
```

Найдите строку `OPENAI_API_KEY` и добавьте ваш ключ:
```
OPENAI_API_KEY=sk-proj-ваш_ключ_здесь
```

### 4. Запуск

```bash
# Запустите бота
systemctl start sointera-bot
systemctl enable sointera-bot

# Проверьте статус
systemctl status sointera-bot
```

### 5. Проверка

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`
4. Бот должен ответить приветствием

## 📁 Структура проекта

```
sointera-ai-sales-bot/
├── src/
│   ├── telegram-bot.ts      # Основной файл бота (Bot API)
│   ├── telegram-userbot.ts  # Старая версия (userbot)
│   └── lib/
│       ├── ai/              # AI логика
│       ├── database/        # Работа с БД
│       └── telegram/        # Telegram утилиты
├── deploy/
│   ├── install-bot-vds.sh   # Установщик для Bot API
│   ├── quick-install.sh     # Быстрая установка
│   └── sointera-bot.service # Systemd сервис
├── prisma/
│   └── schema.prisma        # Схема базы данных
├── logs/                    # Логи приложения
├── .env.local              # Конфигурация (создается при установке)
└── package.json            # Зависимости
```

## 🛠 Управление ботом

### Команды управления

```bash
# Из директории проекта
cd /var/www/sointera-bot
./manage.sh start    # Запуск
./manage.sh stop     # Остановка
./manage.sh restart  # Перезапуск
./manage.sh status   # Статус
./manage.sh logs     # Логи

# Или через systemctl
systemctl start sointera-bot
systemctl stop sointera-bot
systemctl restart sointera-bot
systemctl status sointera-bot
```

### Просмотр логов

```bash
# Логи в реальном времени
journalctl -u sointera-bot -f

# Логи приложения
tail -f /var/www/sointera-bot/logs/app-*.log

# Ошибки
tail -f /var/www/sointera-bot/logs/error-*.log
```

## 🔧 Конфигурация

Основные настройки в `/var/www/sointera-bot/.env.local`:

```env
# База данных
DATABASE_URL="file:./sointera.db"

# OpenAI API (обязательно)
OPENAI_API_KEY=sk-proj-...

# Telegram Bot Token (обязательно)
TELEGRAM_BOT_TOKEN=123456789:ABC...

# Менеджер для сложных вопросов
MANAGER_USERNAME=natalylini

# Режим сервера
HEADLESS=true
```

## 📋 Команды бота

- `/start` - Начать диалог
- `/help` - Помощь
- `/courses` - Информация о курсах
- `/contact` - Контакты менеджера

## 🔄 Обновление

```bash
# Остановите бота
systemctl stop sointera-bot

# Обновите код
cd /var/www/sointera-bot
git pull

# Установите зависимости
sudo -u www-data bun install

# Запустите бота
systemctl start sointera-bot
```

## 🐛 Решение проблем

### Бот не отвечает

1. Проверьте токен бота:
```bash
grep TELEGRAM_BOT_TOKEN /var/www/sointera-bot/.env.local
```

2. Проверьте логи:
```bash
journalctl -u sointera-bot -n 50
```

3. Перезапустите:
```bash
systemctl restart sointera-bot
```

### Ошибка OpenAI API

1. Проверьте ключ:
```bash
grep OPENAI_API_KEY /var/www/sointera-bot/.env.local
```

2. Убедитесь, что ключ действителен и имеет достаточный баланс

### База данных заблокирована

```bash
systemctl stop sointera-bot
rm /var/www/sointera-bot/sointera.db-journal
systemctl start sointera-bot
```

## 📊 Мониторинг

### Статистика бота

Бот автоматически логирует статистику каждый час:
- Количество обработанных сообщений
- Количество клиентов
- Активные диалоги
- Запросы менеджеру

Просмотр статистики:
```bash
grep "СТАТИСТИКА" /var/www/sointera-bot/logs/app-*.log
```

### Использование ресурсов

```bash
# CPU и память
ps aux | grep node | grep telegram-bot

# Размер БД
du -h /var/www/sointera-bot/sointera.db

# Общая статистика
htop
```

## 🔐 Безопасность

1. **Защитите конфигурацию:**
```bash
chmod 600 /var/www/sointera-bot/.env.local
```

2. **Настройте firewall:**
```bash
ufw allow ssh
ufw enable
```

3. **Регулярно обновляйте:**
```bash
apt update && apt upgrade -y
```

## 📝 Разработка

### Локальный запуск

```bash
# Установите зависимости
bun install

# Создайте .env.local
cp .env.example .env.local
# Отредактируйте .env.local

# Инициализируйте БД
bun run db:push
bun run seed

# Запустите бота
bun run start:bot
```

### Структура кода

- `src/telegram-bot.ts` - Основная логика бота
- `src/lib/ai/sales-agent.ts` - AI агент для обработки сообщений
- `src/lib/database/` - Работа с базой данных
- `prisma/schema.prisma` - Схема БД

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи
2. Убедитесь в правильности токенов и ключей
3. Проверьте права доступа к файлам

## 📄 Лицензия

Проект разработан для SOINTERA - Школы парикмахерского искусства.

---

💛 **SOINTERA** - Трансформируем мастеров в профессионалов
