# 🚀 Развёртывание Telegram Bot API версии на VDS сервере

Полная инструкция по установке SOINTERA AI Продажника (Bot API версия) на VDS сервер.

## 📋 Требования к серверу

- **ОС**: Ubuntu 20.04+ / Debian 11+
- **RAM**: минимум 1 GB (рекомендуется 2 GB)
- **CPU**: 1 vCPU
- **Диск**: 10 GB свободного места
- **Доступ**: root или sudo
- **Сеть**: Открытый доступ к интернету для Telegram API

## 🤖 Предварительная подготовка

### Создание Telegram бота

1. Откройте Telegram и найдите @BotFather
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "SOINTERA Sales Bot")
4. Введите username бота (должен заканчиваться на `bot`, например: `sointera_sales_bot`)
5. Сохраните полученный токен (выглядит как: `8128363202:AAEZFG-NgADzF5VGwpPskSCafSJgccczdD8`)

## 🛠 Установка на VDS

### Шаг 1: Подключитесь к серверу

```bash
ssh root@ваш_сервер
```

### Шаг 2: Загрузите проект

Вариант А - Клонирование из GitHub:
```bash
cd /tmp
git clone https://github.com/uShure/sointera-ai-sales-bot.git
cd sointera-ai-sales-bot
git checkout backup-20250814
```

Вариант Б - Загрузка архива:
```bash
cd /tmp
# Загрузите архив проекта на сервер любым удобным способом
# Например, через wget или scp
unzip sointera-bot.zip
cd sointera-ai-sales-bot
```

### Шаг 3: Запустите установщик

```bash
chmod +x deploy/install-bot-vds.sh
sudo bash deploy/install-bot-vds.sh "ВАШ_ТОКЕН_БОТА"
```

Замените `ВАШ_ТОКЕН_БОТА` на токен, полученный от @BotFather.

Скрипт автоматически:
- ✅ Установит все зависимости (Node.js, Bun)
- ✅ Создаст директории и установит права
- ✅ Скопирует файлы проекта
- ✅ Создаст базу данных
- ✅ Настроит systemd сервис
- ✅ Создаст скрипты управления

### Шаг 4: Настройте переменные окружения

Откройте файл конфигурации:
```bash
nano /var/www/sointera-bot/.env.local
```

Добавьте или обновите следующие переменные:
```env
# Database
DATABASE_URL="file:./sointera.db"

# OpenAI API
OPENAI_API_KEY=sk-proj-ваш_ключ_openai_здесь

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=8128363202:AAEZFG-NgADzF5VGwpPskSCafSJgccczdD8

# Менеджер для передачи сложных вопросов
MANAGER_USERNAME=natalylini

# Для работы на VDS сервере
HEADLESS=true
```

Сохраните файл (Ctrl+X, затем Y, затем Enter).

### Шаг 5: Запустите бота

```bash
# Запуск бота
systemctl start sointera-bot

# Включение автозапуска при старте системы
systemctl enable sointera-bot

# Проверка статуса
systemctl status sointera-bot
```

### Шаг 6: Проверьте работу бота

1. Откройте Telegram
2. Найдите вашего бота по username
3. Отправьте команду `/start`
4. Бот должен ответить приветственным сообщением

## 📊 Управление ботом

### Использование скрипта управления

```bash
cd /var/www/sointera-bot

# Команды:
./manage.sh start    # Запустить бота
./manage.sh stop     # Остановить бота
./manage.sh restart  # Перезапустить бота
./manage.sh status   # Проверить статус
./manage.sh logs     # Показать последние логи
./manage.sh tail     # Следить за логами в реальном времени
```

### Прямые команды systemctl

```bash
# Управление сервисом
systemctl start sointera-bot    # Запуск
systemctl stop sointera-bot     # Остановка
systemctl restart sointera-bot  # Перезапуск
systemctl status sointera-bot   # Статус

# Логи
journalctl -u sointera-bot -f        # Следить за логами
journalctl -u sointera-bot -n 100    # Последние 100 строк
journalctl -u sointera-bot --since "1 hour ago"  # За последний час
```

## 📁 Структура файлов на сервере

```
/var/www/sointera-bot/
├── src/                    # Исходный код
│   ├── telegram-bot.ts     # Основной файл бота
│   └── lib/               # Библиотеки
├── logs/                  # Логи приложения
│   ├── app-YYYY-MM-DD.log
│   └── error-YYYY-MM-DD.log
├── backups/              # Резервные копии БД
├── sointera.db          # База данных SQLite
├── .env.local           # Настройки
├── package.json         # Зависимости
└── manage.sh           # Скрипт управления

/var/log/sointera-bot/
├── service.log         # Системные логи
└── error.log          # Системные ошибки

/etc/systemd/system/
└── sointera-bot.service  # Systemd сервис
```

## 🔧 Обслуживание

### Обновление бота

```bash
# Остановите бота
systemctl stop sointera-bot

# Обновите код
cd /var/www/sointera-bot
git pull  # или загрузите новую версию

# Обновите зависимости
sudo -u www-data bun install

# Запустите бота
systemctl start sointera-bot
```

### Резервное копирование

Создайте задание cron для автоматического бэкапа:
```bash
crontab -e

# Добавьте строку для ежедневного бэкапа в 3:00
0 3 * * * cp /var/www/sointera-bot/sointera.db /var/www/sointera-bot/backups/sointera-$(date +\%Y\%m\%d).db
```

### Мониторинг

Проверка использования ресурсов:
```bash
# CPU и память процесса
ps aux | grep node | grep telegram-bot

# Размер базы данных
du -h /var/www/sointera-bot/sointera.db

# Размер логов
du -sh /var/www/sointera-bot/logs/

# Общая статистика сервера
htop
```

## 🚨 Решение проблем

### Бот не запускается

1. **Проверьте логи:**
```bash
journalctl -u sointera-bot -n 50
tail -100 /var/www/sointera-bot/logs/error-*.log
```

2. **Проверьте конфигурацию:**
```bash
# Убедитесь, что токен бота указан правильно
grep TELEGRAM_BOT_TOKEN /var/www/sointera-bot/.env.local

# Проверьте OpenAI ключ
grep OPENAI_API_KEY /var/www/sointera-bot/.env.local
```

3. **Проверьте права доступа:**
```bash
ls -la /var/www/sointera-bot/
chown -R www-data:www-data /var/www/sointera-bot/
```

### Бот не отвечает на сообщения

1. **Проверьте статус:**
```bash
systemctl status sointera-bot
```

2. **Проверьте подключение к Telegram:**
   - Убедитесь, что токен правильный
   - Проверьте, что бот не заблокирован в Telegram

3. **Проверьте OpenAI API:**
   - Убедитесь, что ключ действителен
   - Проверьте лимиты API

### База данных заблокирована

```bash
systemctl stop sointera-bot
rm /var/www/sointera-bot/sointera.db-journal
systemctl start sointera-bot
```

### Высокое использование CPU

1. Проверьте количество обработанных сообщений:
```bash
grep "Обработано сообщений" /var/www/sointera-bot/logs/app-*.log | tail -1
```

2. Перезапустите бота:
```bash
systemctl restart sointera-bot
```

## 🔐 Безопасность

### Настройка Firewall

```bash
# Установите ufw если не установлен
apt install ufw

# Разрешите SSH
ufw allow ssh

# Включите firewall
ufw enable
```

### Ограничение доступа к файлам

```bash
# Защитите файл с конфигурацией
chmod 600 /var/www/sointera-bot/.env.local
```

### Регулярные обновления

```bash
# Обновляйте систему
apt update && apt upgrade -y

# Обновляйте зависимости Node.js
cd /var/www/sointera-bot
sudo -u www-data bun update
```

## 📋 Команды бота

После запуска бот поддерживает следующие команды:

- `/start` - Начать общение с ботом
- `/help` - Показать список команд
- `/courses` - Информация о курсах
- `/contact` - Контакты менеджера

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи приложения и системы
2. Убедитесь, что все API ключи актуальны
3. Проверьте права доступа к файлам
4. Убедитесь, что бот запущен и работает

## 📝 Примечания

- Бот использует polling для получения сообщений (не требует webhook)
- База данных SQLite хранится локально
- Логи ротируются автоматически
- Бот автоматически перезапускается при сбоях

---

💛 SOINTERA - Школа парикмахерского искусства
