import { SalesAgent } from './sales-agent';
import { VoiceService } from '../voice/voice-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🎤 Голосовой AI продажник SOINTERA
 * 
 * Расширяет базовый SalesAgent возможностями:
 * - Отвечает голосовыми сообщениями
 * - Понимает голосовые команды клиентов
 * - Автоматически выбирает формат ответа (текст/голос)
 * - Оптимизирует голос для лучшего восприятия
 */
export class VoiceSalesAgent extends SalesAgent {
  private voiceService: VoiceService;
  private voiceEnabled: boolean = true;
  private autoVoiceResponse: boolean = true; // Автоматически отвечать голосом

  constructor() {
    super();
    this.voiceService = new VoiceService();
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
        console.log('🎧 Распознанная речь:', textMessage);
      } catch (error) {
        console.error('Ошибка распознавания речи:', error);
        textMessage = 'Извините, не удалось распознать ваше голосовое сообщение. Можете написать текстом?';
      }
    }

    // Обрабатываем сообщение через базовый SalesAgent
    const result = await super.processMessage(textMessage, context);

    // Определяем, нужно ли отвечать голосом
    const shouldRespondWithVoice = this.shouldRespondWithVoice(context, result.response);

    if (shouldRespondWithVoice && this.voiceEnabled) {
      try {
        // Генерируем голосовой ответ
        const voiceBuffer = await this.generateVoiceResponse(result.response, context);
        result.voiceResponse = voiceBuffer;
      } catch (error) {
        console.error('Ошибка генерации голосового ответа:', error);
        // При ошибке отвечаем только текстом
      }
    }

    return result;
  }

  /**
   * 🗣️ Генерация голосового ответа
   */
  private async generateVoiceResponse(text: string, context: CustomerContext): Promise<Buffer> {
    try {
      // Определяем настройки голоса на основе контекста
      const voiceOptions = this.getVoiceOptionsForContext(context);
      
      // Генерируем базовый аудио
      let audioBuffer = await this.voiceService.textToSpeech(text, voiceOptions);
      
      // Оптимизируем для Telegram
      audioBuffer = await this.voiceService.optimizeForTelegram(audioBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error('Ошибка генерации голосового ответа:', error);
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
  } {
    // Базовые настройки для SOINTERA
    const baseOptions = {
      voice: 'ru-RU-Standard-A',
      language: 'ru-RU',
      speed: 1.0,
      pitch: 0.0
    };

    // Настройки для разных типов клиентов
    if (context.classification === 'beginner') {
      // Для новичков - медленнее и четче
      return {
        ...baseOptions,
        speed: 0.9,
        pitch: -0.5 // Немного ниже для доверительности
      };
    } else if (context.classification === 'experienced') {
      // Для опытных - быстрее и профессиональнее
      return {
        ...baseOptions,
        speed: 1.1,
        pitch: 0.2
      };
    } else if (context.classification === 'ready_to_buy') {
      // Для готовых к покупке - энергично и убедительно
      return {
        ...baseOptions,
        speed: 1.05,
        pitch: 0.3
      };
    }

    return baseOptions;
  }

  /**
   * 🎯 Определение, нужно ли отвечать голосом
   */
  private shouldRespondWithVoice(context: CustomerContext, response: string): boolean {
    if (!this.autoVoiceResponse) return false;

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
    console.log(`🎤 Голосовые ответы ${enabled ? 'включены' : 'выключены'}`);
  }

  /**
   * 🔄 Включение/выключение автоматических голосовых ответов
   */
  toggleAutoVoice(enabled: boolean): void {
    this.autoVoiceResponse = enabled;
    console.log(`🔄 Автоматические голосовые ответы ${enabled ? 'включены' : 'выключены'}`);
  }

  /**
   * 🎵 Получение доступных голосов
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
        console.error('Ошибка генерации голосового приветствия:', error);
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

Вы можете писать текстом или отправлять голосовые сообщения - я понимаю оба формата. 

Расскажите, что вас интересует?`;
  }

  /**
   * 🎵 Генерация голосового ответа с эмоциями
   */
  async generateEmotionalVoiceResponse(text: string, emotion: 'friendly' | 'professional' | 'enthusiastic' | 'calm'): Promise<Buffer> {
    const voiceOptions = this.getVoiceOptionsForEmotion(emotion);
    let audioBuffer = await this.voiceService.textToSpeech(text, voiceOptions);
    audioBuffer = await this.voiceService.optimizeForTelegram(audioBuffer);
    return audioBuffer;
  }

  /**
   * 🎭 Настройки голоса для разных эмоций
   */
  private getVoiceOptionsForEmotion(emotion: string): {
    voice: string;
    language: string;
    speed: number;
    pitch: number;
  } {
    const baseOptions = {
      voice: 'ru-RU-Standard-A',
      language: 'ru-RU'
    };

    switch (emotion) {
      case 'friendly':
        return { ...baseOptions, speed: 1.0, pitch: 0.0 };
      case 'professional':
        return { ...baseOptions, speed: 1.1, pitch: -0.2 };
      case 'enthusiastic':
        return { ...baseOptions, speed: 1.15, pitch: 0.3 };
      case 'calm':
        return { ...baseOptions, speed: 0.9, pitch: -0.1 };
      default:
        return { ...baseOptions, speed: 1.0, pitch: 0.0 };
    }
  }
}
