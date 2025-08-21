import { SalesAgent } from './sales-agent';
import { FreeVoiceService } from '../voice/free-voice-service';

/**
 * 🎤 БЕСПЛАТНЫЙ голосовой AI продажник SOINTERA
 * 
 * Расширяет базовый SalesAgent возможностями:
 * - Отвечает голосовыми сообщениями (БЕСПЛАТНО с eSpeak)
 * - Понимает голосовые команды клиентов (БЕСПЛАТНО с Whisper)
 * - Автоматически выбирает формат ответа (текст/голос)
 * - Оптимизирует голос для лучшего восприятия
 * 
 * НЕ требует платных API ключей!
 */
export class FreeVoiceSalesAgent extends SalesAgent {
  private voiceService: FreeVoiceService;
  private voiceEnabled: boolean = true;
  private autoVoiceResponse: boolean = true; // Автоматически отвечать голосом

  constructor() {
    super();
    this.voiceService = new FreeVoiceService();
  }

  /**
   * 🎯 Обработка входящего сообщения (текст или голос)
   */
  async processIncomingMessage(message: string | Buffer, context: CustomerContext, isVoice: boolean = false): Promise<{
    response: string;
    voiceResponse?: Buffer;
    callManager: boolean;
    classification?: string;
    managerInfo?: {
      customerName: string;
      customerUsername?: string;
      request: string;
      classification?: string;
    };
  }> {
    let textMessage = message as string;

    // Если это голосовое сообщение - распознаем речь
    if (isVoice && Buffer.isBuffer(message)) {
      try {
        textMessage = await this.voiceService.speechToText(message);
        console.log('🎧 Распознанная речь (Whisper):', textMessage);
        
        // Проверяем, что распознанный текст не пустой
        if (!textMessage || textMessage.trim() === '') {
          console.warn('Whisper вернул пустой текст');
          textMessage = 'Извините, не удалось распознать ваше голосовое сообщение. Можете написать текстом?';
        } else {
          // Если получилось распознать голосовое сообщение, автоматически включаем голосовой ответ
          context.isVoiceMessage = true;
        }
      } catch (error) {
        console.error('Ошибка распознавания речи (Whisper):', error);
        textMessage = 'Извините, не удалось распознать ваше голосовое сообщение. Можете написать текстом?';
      }
    }

    // Обрабатываем сообщение через базовый SalesAgent
    const result = await super.processMessage(textMessage, context);

    // Определяем, нужно ли отвечать голосом
    const shouldRespondWithVoice = this.shouldRespondWithVoice(context, result.response, isVoice);

    // Если клиент отправил голосовое сообщение, ВСЕГДА пытаемся ответить голосом
    if ((shouldRespondWithVoice || isVoice) && this.voiceEnabled) {
      try {
        console.log('🎤 Генерирую голосовой ответ...');
        // Генерируем голосовой ответ
        const voiceBuffer = await this.generateVoiceResponse(result.response, context);
        result.voiceResponse = voiceBuffer;
        console.log('✅ Голосовой ответ сгенерирован успешно');
      } catch (error) {
        console.error('Ошибка генерации голосового ответа (eSpeak):', error);
        // При ошибке отвечаем только текстом, но логируем проблему
        console.warn('⚠️ Голосовой ответ недоступен, отправляю только текст');
      }
    }

    return result;
  }

  /**
   * 🗣️ Генерация голосового ответа с eSpeak
   */
  private async generateVoiceResponse(text: string, context: CustomerContext): Promise<Buffer> {
    try {
      // Определяем настройки голоса на основе контекста
      const voiceOptions = this.getVoiceOptionsForContext(context);
      
      // Генерируем базовый аудио с eSpeak
      let audioBuffer = await this.voiceService.textToSpeech(text, voiceOptions);
      
      // Оптимизируем для Telegram
      audioBuffer = await this.voiceService.optimizeForTelegram(audioBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error('Ошибка генерации голосового ответа (eSpeak):', error);
      throw error;
    }
  }

  /**
   * 🎭 Определение настроек голоса для контекста
   */
  private getVoiceOptionsForContext(context: CustomerContext): {
    voice: string;
    language: string;
    speed: number;
    pitch: number;
    volume: number;
  } {
    // Базовые настройки для SOINTERA с eSpeak - более естественные
    const baseOptions = {
      voice: 'ru',
      language: 'ru',
      speed: 140, // Немного медленнее для естественности
      pitch: 48,  // Более нейтральный тон
      volume: 95  // Немного тише для естественности
    };

    // Настройки для разных типов клиентов
    if (context.classification === 'beginner') {
      // Для новичков - медленнее и четче, но естественно
      return {
        ...baseOptions,
        speed: 125,
        pitch: 46,
        volume: 98
      };
    } else if (context.classification === 'experienced') {
      // Для опытных - уверенно, но не роботизированно
      return {
        ...baseOptions,
        speed: 155,
        pitch: 50,
        volume: 92
      };
    } else if (context.classification === 'ready_to_buy') {
      // Для готовых к покупке - энергично, но человечно
      return {
        ...baseOptions,
        speed: 150,
        pitch: 52,
        volume: 96
      };
    } else if (context.classification === 'interested') {
      // Для заинтересованных - дружелюбно и естественно
      return {
        ...baseOptions,
        speed: 135,
        pitch: 47,
        volume: 94
      };
    }

    return baseOptions;
  }

  /**
   * 🎯 Определение, нужно ли отвечать голосом
   */
  private shouldRespondWithVoice(context: CustomerContext, response: string, isVoiceMessage: boolean = false): boolean {
    if (!this.autoVoiceResponse) return false;

    // Если клиент отправил голосовое сообщение, всегда отвечаем голосом
    if (isVoiceMessage || context.isVoiceMessage) {
      return true;
    }

    // Всегда голосом для важных ответов
    if (response.includes('Парикмахер с нуля') || 
        response.includes('Федеральная программа') ||
        response.includes('Наставник по')) {
      return true;
    }

    // Голосом для длинных ответов (более 100 символов)
    if (response.length > 100) {
      return true;
    }

    // Голосом для ответов с ценами
    if (response.includes('₽') || response.includes('руб')) {
      return true;
    }

    // Голосом для ответов с датами
    if (response.includes('сентябрь') || response.includes('октябрь') || 
        response.includes('ноябрь') || response.includes('декабрь')) {
      return true;
    }

    return false;
  }

  /**
   * 🎤 Включение/выключение голосовых ответов
   */
  toggleVoice(enabled: boolean): void {
    this.voiceEnabled = enabled;
    console.log(`🎤 Голосовые ответы ${enabled ? 'включены' : 'выключены'} (eSpeak)`);
  }

  /**
   * 🔄 Включение/выключение автоматических голосовых ответов
   */
  toggleAutoVoice(enabled: boolean): void {
    this.autoVoiceResponse = enabled;
    console.log(`🔄 Автоматические голосовые ответы ${enabled ? 'включены' : 'выключены'} (eSpeak)`);
  }

  /**
   * 🎵 Получение доступных голосов eSpeak
   */
  async getAvailableVoices(): Promise<string[]> {
    return await this.voiceService.getAvailableVoices();
  }

  /**
   * 📊 Получение статистики голосового сервиса
   */
  getVoiceStats() {
    return this.voiceService.getStats();
  }

  /**
   * 🧹 Очистка временных файлов
   */
  async cleanupVoice(): Promise<void> {
    await this.voiceService.cleanup();
  }

  /**
   * ✅ Проверка доступности бесплатных сервисов
   */
  async checkVoiceServicesAvailability(): Promise<{
    espeak: boolean;
    whisper: boolean;
    ffmpeg: boolean;
    allAvailable: boolean;
  }> {
    const availability = await this.voiceService.checkAvailability();
    
    return {
      ...availability,
      allAvailable: availability.espeak && availability.whisper && availability.ffmpeg
    };
  }

  /**
   * 🎭 Генерация персонализированного голосового приветствия
   */
  async generatePersonalizedGreeting(context: CustomerContext): Promise<{
    text: string;
    voice?: Buffer;
  }> {
    const greeting = this.getPersonalizedGreeting(context);
    
    if (this.voiceEnabled) {
      try {
        const voiceBuffer = await this.generateVoiceResponse(greeting, context);
        return { text: greeting, voice: voiceBuffer };
      } catch (error) {
        console.error('Ошибка генерации голосового приветствия (eSpeak):', error);
      }
    }

    return { text: greeting };
  }

  /**
   * 👋 Персонализированное приветствие
   */
  private getPersonalizedGreeting(context: CustomerContext): string {
    const time = new Date().getHours();
    let timeGreeting = '';

    if (time >= 5 && time < 12) {
      timeGreeting = 'Доброе утро';
    } else if (time >= 12 && time < 18) {
      timeGreeting = 'Добрый день';
    } else {
      timeGreeting = 'Добрый вечер';
    }

    let nameGreeting = '';
    if (context.firstName) {
      nameGreeting = `, ${context.firstName}`;
    } else if (context.username) {
      nameGreeting = `, @${context.username}`;
    }

    return `${timeGreeting}${nameGreeting}! 👋 

Я - AI-ассистент школы парикмахерского искусства SOINTERA. Готов помочь вам выбрать подходящий курс и ответить на все вопросы!

Вы можете писать текстом или отправлять голосовые сообщения - я понимаю оба формата (бесплатно с Whisper и eSpeak).

Расскажите, что вас интересует?`;
  }

  /**
   * 🎵 Генерация голосового ответа с эмоциями
   */
  async generateEmotionalVoiceResponse(text: string, emotion: 'friendly' | 'professional' | 'enthusiastic' | 'calm'): Promise<Buffer> {
    return await this.voiceService.generateEmotionalVoice(text, emotion);
  }

  /**
   * 👥 Генерация голосового ответа для типа клиента
   */
  async generateCustomerVoiceResponse(text: string, customerType: 'beginner' | 'experienced' | 'interested' | 'ready_to_buy'): Promise<Buffer> {
    return await this.voiceService.generateCustomerVoice(text, customerType);
  }

  /**
   * 📁 Создание временного файла для отправки через Bot API
   */
  async createTempAudioFile(audioBuffer: Buffer, filename?: string): Promise<string> {
    return await this.voiceService.createTempAudioFile(audioBuffer, filename);
  }

  /**
   * 🗑️ Удаление временного аудио файла
   */
  async removeTempAudioFile(filePath: string): Promise<void> {
    await this.voiceService.removeTempAudioFile(filePath);
  }

  /**
   * 🔧 Установка голосового сервиса
   */
  async setupVoiceService(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      // Проверяем доступность сервисов
      const availability = await this.checkVoiceServicesAvailability();
      
      if (availability.allAvailable) {
        return {
          success: true,
          message: '✅ Все голосовые сервисы доступны!',
          details: availability
        };
      } else {
        const missing = [];
        if (!availability.espeak) missing.push('eSpeak-ng');
        if (!availability.whisper) missing.push('Whisper');
        if (!availability.ffmpeg) missing.push('FFmpeg');
        
        return {
          success: false,
          message: `❌ Отсутствуют необходимые компоненты: ${missing.join(', ')}`,
          details: availability
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '❌ Ошибка проверки голосовых сервисов',
        details: { error: error.message }
      };
    }
  }

  /**
   * 📋 Инструкции по установке
   */
  getInstallationInstructions(): string {
    return `
🎤 Установка бесплатного голосового сервиса SOINTERA AI

Для работы голосовых функций необходимо установить:

1. eSpeak-ng (Text-to-Speech):
   macOS: brew install espeak-ng
   Ubuntu: sudo apt install espeak-ng
   Windows: скачать с https://github.com/espeak-ng/espeak-ng/releases

2. Whisper (Speech-to-Text):
   pip install openai-whisper
   
3. FFmpeg (обработка аудио):
   macOS: brew install ffmpeg
   Ubuntu: sudo apt install ffmpeg
   Windows: скачать с https://ffmpeg.org/download.html

После установки запустите:
bun run voice:test

Подробнее см. VOICE_SETUP.md
    `.trim();
  }
}
