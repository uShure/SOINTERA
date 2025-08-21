# 🎤 Настройка голосового сервиса для SOINTERA AI

## 🚀 Возможности

Ваш AI продажник теперь поддерживает:

- **🗣️ Text-to-Speech (TTS)** - отвечает голосовыми сообщениями
- **🎧 Speech-to-Text (STT)** - понимает голосовые команды клиентов
- **🎭 Эмоциональные голоса** - разные тона для разных ситуаций
- **👥 Персонализированные голоса** - адаптация под тип клиента
- **🎵 Оптимизация для Telegram** - лучшее качество аудио

## ⚙️ Требования

### 1. **Google Cloud Platform**
- Аккаунт Google Cloud
- Включенные API:
  - Cloud Text-to-Speech API
  - Cloud Speech-to-Text API
- Сервисный ключ (JSON файл)

### 2. **FFmpeg**
- Установленный FFmpeg для обработки аудио
- Доступен в системном PATH

### 3. **Переменные окружения**
```bash
# Google Cloud
GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Настройки голосового сервиса
VOICE_ENABLED=true
AUTO_VOICE_RESPONSE=true
DEFAULT_VOICE=ru-RU-Standard-A
```

## 🔧 Установка

### 1. **Установка зависимостей**
```bash
bun install
```

### 2. **Настройка Google Cloud**

#### Создание проекта:
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите API:
   - Cloud Text-to-Speech API
   - Cloud Speech-to-Text API

#### Создание сервисного ключа:
1. Перейдите в "IAM & Admin" → "Service Accounts"
2. Создайте новый сервисный аккаунт
3. Скачайте JSON ключ
4. Поместите в папку проекта (например, `google-cloud-key.json`)

### 3. **Установка FFmpeg**

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
2. Добавьте в PATH

### 4. **Настройка переменных окружения**
Создайте файл `.env.local`:
```env
# Google Cloud
GOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Голосовой сервис
VOICE_ENABLED=true
AUTO_VOICE_RESPONSE=true
DEFAULT_VOICE=ru-RU-Standard-A

# Telegram
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_STRING=your_session_string
MANAGER_USERNAME=natalylini

# OpenAI
OPENAI_API_KEY=your_openai_key
```

## 🎯 Использование

### 1. **Запуск с голосовым сервисом**
```bash
bun run start
```

### 2. **Тестирование голосовых функций**
```bash
# Проверка доступных голосов
bun run voice:test

# Тест TTS
bun run voice:tts "Привет! Я AI продажник SOINTERA"

# Тест STT
bun run voice:stt audio-file.mp3
```

### 3. **Управление голосовым сервисом**
```typescript
// Включение/выключение голосовых ответов
salesAgent.toggleVoice(true);

// Включение/выключение автоматических голосовых ответов
salesAgent.toggleAutoVoice(true);

// Получение статистики
const stats = salesAgent.getVoiceStats();

// Очистка временных файлов
await salesAgent.cleanupVoice();
```

## 🎭 Настройка голосов

### 1. **Голоса для разных типов клиентов**
```typescript
// Новички - медленнее и доверительнее
beginner: {
  voice: 'ru-RU-Standard-A',
  speed: 0.9,
  pitch: -0.5
}

// Опытные - быстрее и профессиональнее
experienced: {
  voice: 'ru-RU-Standard-B',
  speed: 1.1,
  pitch: 0.2
}
```

### 2. **Эмоциональные голоса**
```typescript
// Дружелюбный
friendly: { speed: 1.0, pitch: 0.0 }

// Профессиональный
professional: { speed: 1.1, pitch: -0.2 }

// Энергичный
enthusiastic: { speed: 1.15, pitch: 0.3 }

// Спокойный
calm: { speed: 0.9, pitch: -0.1 }
```

### 3. **Голоса для разных типов контента**
```typescript
// Приветствие
greeting: { voice: 'ru-RU-Standard-A', emotion: 'friendly' }

// Описание курса
courseDescription: { voice: 'ru-RU-Standard-B', emotion: 'professional' }

// Цены и условия
pricing: { voice: 'ru-RU-Standard-C', emotion: 'enthusiastic' }
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

### 1. **Ошибка Google Cloud API**
```bash
# Проверьте ключ
cat google-cloud-key.json | jq '.project_id'

# Проверьте права доступа
gcloud auth activate-service-account --key-file=google-cloud-key.json
```

### 2. **Ошибка FFmpeg**
```bash
# Проверьте установку
ffmpeg -version

# Проверьте PATH
which ffmpeg
```

### 3. **Проблемы с качеством аудио**
```typescript
// Уменьшите битрейт
audioSettings: {
  bitrate: '32k',  // вместо '48k'
  sampleRate: 16000 // вместо 22050
}
```

### 4. **Большие файлы**
```typescript
// Увеличьте сжатие
telegramSettings: {
  compressionQuality: 0.6  // вместо 0.8
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
- Храните ключи Google Cloud в безопасном месте
- Ограничьте доступ к API ключам
- Регулярно ротируйте ключи

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

## 🎉 Результат

После настройки ваш AI продажник сможет:

✅ **Отвечать голосовыми сообщениями** на важные вопросы
✅ **Понимать голосовые команды** клиентов
✅ **Адаптировать голос** под тип клиента
✅ **Использовать эмоциональные тона** для лучшего восприятия
✅ **Оптимизировать аудио** для Telegram

Это сделает общение более естественным и доверительным! 🎤✨

---

*Документация создана для SOINTERA AI Продажника*
