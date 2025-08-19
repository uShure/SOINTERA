# 📦 Установка на First VDS - Пошаговая инструкция

## ⚡ Быстрая установка (5 минут)

### Шаг 1: Подключение к серверу

Подключитесь к вашему серверу First VDS через SSH:

```bash
ssh root@ВАШ_IP_АДРЕС
```

### Шаг 2: Загрузка и установка

Выполните следующие команды последовательно:

```bash
# 1. Загрузите проект
cd /tmp
git clone https://github.com/uShure/sointera-ai-sales-bot.git
cd sointera-ai-sales-bot
git checkout backup-20250814

# 2. Запустите установку
chmod +x deploy/quick-install.sh
bash deploy/quick-install.sh
```

### Шаг 3: Добавьте OpenAI ключ

```bash
# Откройте файл конфигурации
nano /var/www/sointera-bot/.env.local
```

Найдите строку:
```
OPENAI_API_KEY=sk-proj-ваш_ключ_openai_здесь
```

Замените на ваш реальный ключ OpenAI и сохраните файл (Ctrl+X, затем Y, затем Enter).

### Шаг 4: Запустите бота

```bash
# Запустите и включите автозапуск
systemctl start sointera-bot
systemctl enable sointera-bot

# Проверьте статус
systemctl status sointera-bot
```

Вы должны увидеть зеленый статус "active (running)".

### Шаг 5: Проверьте работу

1. Откройте Telegram
2. Найдите бота: `@ваш_бот` (или по прямой ссылке `t.me/ваш_бот`)
3. Нажмите START или отправьте `/start`
4. Бот должен ответить приветствием

## ✅ Готово!

Ваш бот установлен и работает!

## 📊 Полезные команды

### Управление ботом

```bash
# Перезапустить бота
systemctl restart sointera-bot

# Остановить бота
systemctl stop sointera-bot

# Посмотреть логи
journalctl -u sointera-bot -f
```

### Просмотр статистики

```bash
# Последние сообщения
grep "Новое сообщение" /var/www/sointera-bot/logs/app-*.log | tail -10

# Статистика
grep "СТАТИСТИКА" /var/www/sointera-bot/logs/app-*.log | tail -1
```

## 🔧 Если что-то пошло не так

### Бот не запускается

```bash
# Проверьте логи
journalctl -u sointera-bot -n 50

# Проверьте токен бота
grep TELEGRAM_BOT_TOKEN /var/www/sointera-bot/.env.local

# Проверьте OpenAI ключ
grep OPENAI_API_KEY /var/www/sointera-bot/.env.local
```

### Бот не отвечает из-за блокировок Telegram

Если Telegram заблокирован в вашем регионе, настройте прокси:

```bash
# Добавьте в файл конфигурации
nano /var/www/sointera-bot/.env.local

# Добавьте строки:
HTTPS_PROXY=http://proxy.server:port
HTTP_PROXY=http://proxy.server:port

# Перезапустите бота
systemctl restart sointera-bot
```

### Бот работает но выдает ошибки

```bash
# Проверьте подробные логи
journalctl -u sointera-bot -n 100

# Проверьте логи приложения
tail -f /var/www/sointera-bot/logs/error-*.log

# Перезапустите
systemctl restart sointera-bot

# Проверьте статус
systemctl status sointera-bot
```

## 📝 Важная информация

**Токен бота:** `8128363202:AAEZFG-NgADzF5VGwpPskSCafSJgccczdD8`
(уже предустановлен в скрипте)

**Требуется добавить:**
- OpenAI API ключ (обязательно)

**Опционально можно изменить:**
- `MANAGER_USERNAME` - username менеджера для передачи сложных вопросов

## 🆘 Помощь

Если возникли проблемы:

1. Убедитесь, что OpenAI ключ добавлен и действителен
2. Проверьте, что бот создан в @BotFather и не заблокирован
3. Просмотрите логи для поиска ошибок

---

**Время установки:** ~5 минут
**Требования к серверу:** Ubuntu/Debian, 1GB RAM, 10GB диск
