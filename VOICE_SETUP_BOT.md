# 🎤 Голосовой сервис для Telegram Bot API SOINTERA AI

## 🚀 Возможности (БЕСПЛАТНО!)

Ваш AI продажник теперь поддерживает голосовые функции **БЕЗ ПЛАТНЫХ API**:

- **🗣️ Text-to-Speech (TTS)** - отвечает голосовыми сообщениями (eSpeak-ng)
- **🎧 Speech-to-Text (STT)** - понимает голосовые команды (Whisper)
- **🎭 Эмоциональные голоса** - разные тона для разных ситуаций
- **👥 Персонализированные голоса** - адаптация под тип клиента
- **🎵 Оптимизация для Telegram Bot API** - лучшее качество аудио

## 🔍 Разница между Userbot и Bot API

### 🤖 **Telegram Bot API (рекомендуется)**
- ✅ **Официальный способ** создания ботов
- ✅ **Безопасность** - работает через BotFather
- ✅ **Масштабируемость** - можно добавлять в группы
- ✅ **Голосовые сообщения** - полная поддержка
- ✅ **Простота настройки** - только токен бота

### 👤 **Userbot (личный аккаунт)**
- ⚠️ **Неофициальный** способ
- ⚠️ **Риск блокировки** аккаунта
- ⚠️ **Ограничения** - только личные чаты
- ✅ **Голосовые сообщения** - полная поддержка
- ❌ **Сложность настройки** - API ID, API Hash, сессия

## ⚙️ Требования (ВСЕ БЕСПЛАТНО!)

### 1. **eSpeak-ng** (Text-to-Speech)
- Бесплатный TTS движок
- Поддержка русского языка
- Высокое качество синтеза речи

### 2. **Whisper** (Speech-to-Text)
- Бесплатное распознавание речи от OpenAI
- Поддержка русского языка
- Высокая точность

### 3. **FFmpeg**
- Бесплатная обработка аудио
- Конвертация форматов
- Оптимизация качества

### 4. **Telegram Bot Token**
- Получить у @BotFather
- Бесплатно и безопасно

## 🔧 Установка (БЕСПЛАТНО!)

### 1. **Создание бота через BotFather**
```
1. Напишите @BotFather в Telegram
2. Команда: /newbot
3. Название бота: SOINTERA AI Продажник
4. Username: sointera_ai_bot
5. Получите токен: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. **Установка зависимостей проекта**
```bash
bun install
```

### 3. **Установка eSpeak-ng (TTS)**

#### macOS:
```bash
brew install espeak-ng
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install espeak-ng
```

#### Windows:
1. Скачайте с [GitHub Releases](https://github.com/espeak-ng/espeak-ng/releases)
2. Распакуйте в `C:\Program Files\eSpeak\`
3. Добавьте в PATH

### 4. **Установка Whisper (STT)**

#### Через pip:
```bash
pip install openai-whisper
```

#### Или через conda:
```bash
conda install -c conda-forge openai-whisper
```

### 5. **Установка FFmpeg**

#### macOS:
```bash
brew install ffmpeg
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows:
1. Скачайте с [ffmpeg.org](https://ffmpeg.org/download.html)
2. Распакуйте и добавьте в PATH

### 6. **Настройка переменных окружения**
Создайте файл `.env.local`:
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# OpenAI
OPENAI_API_KEY=your_openai_key

# Менеджер
MANAGER_USERNAME=natalylini
```

## 🎯 Использование

### 1. **Запуск с голосовым сервисом**
```bash
bun run start:bot
```

### 2. **Тестирование голосовых функций**
```bash
# Проверка доступности сервисов
bun run voice:check

# Полное тестирование
bun run voice:test
```

### 3. **Управление голосовым сервисом**
```typescript
// Включение/выключение голосовых ответов
salesAgent.toggleVoice(true);

// Включение/выключение автоматических голосовых ответов
salesAgent.toggleAutoVoice(true);

// Получение статистики
const stats = salesAgent.getVoiceStats();

// Проверка доступности сервисов
const availability = await salesAgent.checkVoiceServicesAvailability();
```

## 🎭 Настройка голосов

### 1. **Голоса для разных типов клиентов**
```typescript
// Новички - медленнее и доверительнее
beginner: { speed: 130, pitch: 45, volume: 105 }

// Опытные - быстрее и профессиональнее
experienced: { speed: 170, pitch: 55, volume: 100 }

// Готовые к покупке - энергично и убедительно
ready_to_buy: { speed: 160, pitch: 60, volume: 110 }
```

### 2. **Эмоциональные голоса**
```typescript
// Дружелюбный
friendly: { speed: 140, pitch: 55, volume: 100 }

// Профессиональный
professional: { speed: 160, pitch: 45, volume: 95 }

// Энергичный
enthusiastic: { speed: 170, pitch: 60, volume: 110 }

// Спокойный
calm: { speed: 130, pitch: 40, volume: 90 }
```

## 📱 Интеграция с Telegram Bot API

### 1. **Поддерживаемые типы сообщений**
- **Текст** - обычные текстовые сообщения
- **Голос** - голосовые сообщения (`.ogg`)
- **Аудио** - аудио файлы (`.mp3`, `.wav`, `.ogg`)

### 2. **Отправка голосовых ответов**
```typescript
// Создаем временный файл
const tempVoicePath = await salesAgent.createTempAudioFile(voiceBuffer);

// Отправляем через Bot API
await bot.sendVoice(chatId, tempVoicePath, {
  caption: '🎤 Ответ SOINTERA AI'
});

// Удаляем временный файл
await salesAgent.removeTempAudioFile(tempVoicePath);
```

### 3. **Ограничения Bot API**
- Максимальный размер файла: 50 МБ
- Максимальная длительность: 5 минут
- Поддерживаемые форматы: MP3, OGG, WAV

## 📊 Мониторинг

### 1. **Логи голосового сервиса**
```bash
# Просмотр логов
tail -f logs/app-$(date +%Y-%m-%d).log | grep -E "🎤|🎧|🗣️"

# Статистика использования
bun run voice:stats
```

### 2. **Метрики качества**
- Время генерации голосового ответа
- Качество распознавания речи
- Размер аудио файлов
- Количество ошибок

## 🔍 Решение проблем

### 1. **Ошибка eSpeak**
```bash
# Проверьте установку
espeak-ng --version

# Проверьте PATH
which espeak-ng

# Установите заново
brew reinstall espeak-ng  # macOS
sudo apt reinstall espeak-ng  # Ubuntu
```

### 2. **Ошибка Whisper**
```bash
# Проверьте установку
whisper --version

# Установите заново
pip install --upgrade openai-whisper

# Проверьте Python версию (нужен Python 3.7+)
python --version
```

### 3. **Ошибка FFmpeg**
```bash
# Проверьте установку
ffmpeg -version

# Проверьте PATH
which ffmpeg

# Установите заново
brew reinstall ffmpeg  # macOS
sudo apt reinstall ffmpeg  # Ubuntu
```

### 4. **Ошибка Telegram Bot API**
```bash
# Проверьте токен
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"

# Проверьте права бота
# Убедитесь, что бот не заблокирован
```

## 🚀 Оптимизация

### 1. **Производительность**
- Используйте кэширование для часто используемых фраз
- Оптимизируйте размер аудио файлов
- Настройте пул голосовых потоков

### 2. **Качество**
- Выберите подходящие голоса для разных ситуаций
- Настройте скорость и тон для лучшего восприятия
- Используйте эмоциональные голоса для важных сообщений

### 3. **Безопасность**
- Регулярно обновляйте eSpeak-ng и Whisper
- Проверяйте целостность установленных пакетов
- Используйте только официальные источники

## 💰 Преимущества бесплатного решения

### ✅ **Бесплатно навсегда**
- Никаких ежемесячных платежей
- Никаких лимитов на количество запросов
- Полный контроль над данными

### ✅ **Локальная работа**
- Работает без интернета (кроме Whisper)
- Быстрая обработка
- Конфиденциальность

### ✅ **Открытый код**
- Возможность модификации
- Прозрачность работы
- Сообщество поддержки

### ✅ **Высокое качество**
- eSpeak-ng - профессиональный TTS
- Whisper - лучшая модель STT
- FFmpeg - индустриальный стандарт

### ✅ **Безопасность Bot API**
- Официальная поддержка Telegram
- Никаких рисков для личного аккаунта
- Простота настройки и управления

## 🎉 Результат

После настройки ваш AI продажник сможет:

✅ **Отвечать голосовыми сообщениями** на важные вопросы (БЕСПЛАТНО!)
✅ **Понимать голосовые команды** клиентов (БЕСПЛАТНО!)
✅ **Адаптировать голос** под тип клиента (БЕСПЛАТНО!)
✅ **Использовать эмоциональные тона** для лучшего восприятия (БЕСПЛАТНО!)
✅ **Оптимизировать аудио** для Telegram Bot API (БЕСПЛАТНО!)
✅ **Работать безопасно** через официальный Bot API

## 🔄 Переключение между userbot и bot

### Для обычного бота (рекомендуется):
```typescript
// В telegram-bot.ts
import { BotVoiceSalesAgent } from './lib/ai/bot-voice-sales-agent.js';
this.salesAgent = new BotVoiceSalesAgent();
```

### Для userbot (личный аккаунт):
```typescript
// В telegram-userbot.ts
import { FreeVoiceSalesAgent } from './lib/ai/free-voice-sales-agent';
this.salesAgent = new FreeVoiceSalesAgent();
```

## 📋 Быстрая установка

### macOS:
```bash
brew install espeak-ng ffmpeg
pip install openai-whisper
bun install
# Создайте бота через @BotFather
# Добавьте TELEGRAM_BOT_TOKEN в .env.local
bun run voice:check
bun run start:bot
```

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install espeak-ng ffmpeg
pip install openai-whisper
bun install
# Создайте бота через @BotFather
# Добавьте TELEGRAM_BOT_TOKEN в .env.local
bun run voice:check
bun run start:bot
```

### Windows:
1. Скачайте eSpeak-ng, FFmpeg и установите Python
2. `pip install openai-whisper`
3. `bun install`
4. Создайте бота через @BotFather
5. Добавьте TELEGRAM_BOT_TOKEN в .env.local
6. `bun run voice:check`
7. `bun run start:bot`

---

**🎤 Теперь ваш AI продажник может общаться голосом БЕСПЛАТНО через безопасный Bot API!**

*Документация создана для SOINTERA AI Продажника*
