# 🎤 БЕСПЛАТНАЯ настройка голосового сервиса SOINTERA AI

## 🚀 Возможности (БЕСПЛАТНО!)

Ваш AI продажник теперь поддерживает голосовые функции **БЕЗ ПЛАТНЫХ API**:

- **🗣️ Text-to-Speech (TTS)** - отвечает голосовыми сообщениями (eSpeak-ng)
- **🎧 Speech-to-Text (STT)** - понимает голосовые команды (Whisper)
- **🎭 Эмоциональные голоса** - разные тона для разных ситуаций
- **👥 Персонализированные голоса** - адаптация под тип клиента
- **🎵 Оптимизация для Telegram** - лучшее качество аудио

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

## 🔧 Установка (БЕСПЛАТНО!)

### 1. **Установка зависимостей проекта**
```bash
bun install
```

### 2. **Установка eSpeak-ng (TTS)**

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

### 3. **Установка Whisper (STT)**

#### Через pip:
```bash
pip install openai-whisper
```

#### Или через conda:
```bash
conda install -c conda-forge openai-whisper
```

### 4. **Установка FFmpeg**

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

## 🎯 Использование

### 1. **Запуск с бесплатным голосовым сервисом**
```bash
bun run start
```

### 2. **Тестирование голосовых функций**
```bash
# Полное тестирование
bun run voice:test

# Проверка доступности сервисов
bun run voice:check
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

### 4. **Проблемы с качеством аудио**
```typescript
// Уменьшите битрейт
audioSettings: {
  bitrate: '32k',  // вместо '48k'
  sampleRate: 16000 // вместо 22050
}
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

## 📱 Интеграция с Telegram

### 1. **Поддерживаемые форматы**
- MP3 (рекомендуется)
- OGG
- WAV

### 2. **Ограничения**
- Максимальный размер: 50 МБ
- Максимальная длительность: 5 минут
- Оптимальная частота: 22.05 кГц

### 3. **Автоматическая оптимизация**
```typescript
// Автоматическая оптимизация для Telegram
audioBuffer = await voiceService.optimizeForTelegram(audioBuffer);
```

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

## 🎉 Результат

После настройки ваш AI продажник сможет:

✅ **Отвечать голосовыми сообщениями** на важные вопросы (БЕСПЛАТНО!)
✅ **Понимать голосовые команды** клиентов (БЕСПЛАТНО!)
✅ **Адаптировать голос** под тип клиента (БЕСПЛАТНО!)
✅ **Использовать эмоциональные тона** для лучшего восприятия (БЕСПЛАТНО!)
✅ **Оптимизировать аудио** для Telegram (БЕСПЛАТНО!)

## 🔄 Переключение между платным и бесплатным

Если у вас есть Google Cloud API ключ, вы можете легко переключиться:

```typescript
// В telegram-userbot.ts замените:
import { FreeVoiceSalesAgent } from './lib/ai/free-voice-sales-agent';
// на:
import { VoiceSalesAgent } from './lib/ai/voice-sales-agent';

// И в конструкторе:
this.salesAgent = new VoiceSalesAgent(); // вместо FreeVoiceSalesAgent
```

## 📋 Быстрая установка

### macOS:
```bash
brew install espeak-ng ffmpeg
pip install openai-whisper
bun install
bun run voice:test
```

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install espeak-ng ffmpeg
pip install openai-whisper
bun install
bun run voice:test
```

### Windows:
1. Скачайте eSpeak-ng, FFmpeg и установите Python
2. `pip install openai-whisper`
3. `bun install`
4. `bun run voice:test`

---

**🎤 Теперь ваш AI продажник может общаться голосом БЕСПЛАТНО!**

*Документация создана для SOINTERA AI Продажника*
