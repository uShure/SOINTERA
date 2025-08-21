/**
 * 🎤 Конфигурация голосового сервиса SOINTERA AI
 */

export interface VoiceConfig {
  // Основные настройки TTS
  defaultVoice: string;
  defaultLanguage: string;
  defaultSpeed: number;
  defaultPitch: number;
  
  // Настройки для разных типов клиентов
  customerVoices: {
    beginner: VoiceSettings;
    experienced: VoiceSettings;
    interested: VoiceSettings;
    ready_to_buy: VoiceSettings;
  };
  
  // Настройки для разных эмоций
  emotionalVoices: {
    friendly: VoiceSettings;
    professional: VoiceSettings;
    enthusiastic: VoiceSettings;
    calm: VoiceSettings;
  };
  
  // Настройки аудио
  audioSettings: {
    format: 'mp3' | 'ogg' | 'wav';
    sampleRate: number;
    bitrate: string;
    channels: number;
  };
  
  // Настройки для Telegram
  telegramSettings: {
    maxDuration: number; // максимальная длительность в секундах
    maxFileSize: number; // максимальный размер файла в байтах
    compressionQuality: number; // качество сжатия 0-1
  };
}

export interface VoiceSettings {
  voice: string;
  language: string;
  speed: number;
  pitch: number;
  volume?: number;
}

/**
 * 🎭 Конфигурация голосов для SOINTERA
 */
export const SOINTERA_VOICE_CONFIG: VoiceConfig = {
  // Основные настройки
  defaultVoice: 'ru-RU-Standard-A',
  defaultLanguage: 'ru-RU',
  defaultSpeed: 1.0,
  defaultPitch: 0.0,
  
  // Голоса для разных типов клиентов
  customerVoices: {
    beginner: {
      voice: 'ru-RU-Standard-A',
      language: 'ru-RU',
      speed: 0.9,      // Медленнее для лучшего понимания
      pitch: -0.5,     // Немного ниже для доверительности
      volume: 1.1
    },
    experienced: {
      voice: 'ru-RU-Standard-B',
      language: 'ru-RU',
      speed: 1.1,      // Быстрее для профессионалов
      pitch: 0.2,      // Немного выше для уверенности
      volume: 1.0
    },
    interested: {
      voice: 'ru-RU-Standard-A',
      language: 'ru-RU',
      speed: 1.0,      // Стандартная скорость
      pitch: 0.0,      // Нейтральный тон
      volume: 1.0
    },
    ready_to_buy: {
      voice: 'ru-RU-Standard-C',
      language: 'ru-RU',
      speed: 1.05,     // Энергично
      pitch: 0.3,      // Убедительно
      volume: 1.2
    }
  },
  
  // Голоса для разных эмоций
  emotionalVoices: {
    friendly: {
      voice: 'ru-RU-Standard-A',
      language: 'ru-RU',
      speed: 1.0,
      pitch: 0.0,
      volume: 1.0
    },
    professional: {
      voice: 'ru-RU-Standard-B',
      language: 'ru-RU',
      speed: 1.1,
      pitch: -0.2,
      volume: 0.95
    },
    enthusiastic: {
      voice: 'ru-RU-Standard-C',
      language: 'ru-RU',
      speed: 1.15,
      pitch: 0.3,
      volume: 1.1
    },
    calm: {
      voice: 'ru-RU-Standard-A',
      language: 'ru-RU',
      speed: 0.9,
      pitch: -0.1,
      volume: 0.9
    }
  },
  
  // Настройки аудио
  audioSettings: {
    format: 'mp3',
    sampleRate: 22050,  // Оптимально для Telegram
    bitrate: '48k',
    channels: 1         // Моно для лучшего качества
  },
  
  // Настройки для Telegram
  telegramSettings: {
    maxDuration: 300,   // 5 минут максимум
    maxFileSize: 50 * 1024 * 1024, // 50 МБ
    compressionQuality: 0.8
  }
};

/**
 * 🎵 Доступные голоса Google Cloud TTS
 */
export const AVAILABLE_VOICES = [
  'ru-RU-Standard-A',    // Женский голос, стандартный
  'ru-RU-Standard-B',    // Мужской голос, стандартный
  'ru-RU-Standard-C',    // Женский голос, альтернативный
  'ru-RU-Standard-D',    // Мужской голос, альтернативный
  'ru-RU-Standard-E',    // Женский голос, нейтральный
  'ru-RU-Wavenet-A',     // Женский голос, нейронная сеть
  'ru-RU-Wavenet-B',     // Мужской голос, нейронная сеть
  'ru-RU-Wavenet-C',     // Женский голос, нейронная сеть
  'ru-RU-Wavenet-D'      // Мужской голос, нейронная сеть
];

/**
 * 🎯 Настройки для разных типов контента
 */
export const CONTENT_VOICE_SETTINGS = {
  // Приветствие
  greeting: {
    voice: 'ru-RU-Standard-A',
    speed: 0.95,
    pitch: 0.0,
    emotion: 'friendly'
  },
  
  // Описание курса
  courseDescription: {
    voice: 'ru-RU-Standard-B',
    speed: 1.0,
    pitch: 0.1,
    emotion: 'professional'
  },
  
  // Цены и условия
  pricing: {
    voice: 'ru-RU-Standard-C',
    speed: 1.05,
    pitch: 0.2,
    emotion: 'enthusiastic'
  },
  
  // Техническая информация
  technical: {
    voice: 'ru-RU-Standard-A',
    speed: 0.9,
    pitch: -0.1,
    emotion: 'calm'
  }
};

/**
 * 🔧 Утилиты для работы с голосовыми настройками
 */
export class VoiceConfigUtils {
  /**
   * Получить настройки голоса для типа клиента
   */
  static getCustomerVoice(customerType: keyof typeof SOINTERA_VOICE_CONFIG.customerVoices): VoiceSettings {
    return SOINTERA_VOICE_CONFIG.customerVoices[customerType];
  }
  
  /**
   * Получить настройки голоса для эмоции
   */
  static getEmotionalVoice(emotion: keyof typeof SOINTERA_VOICE_CONFIG.emotionalVoices): VoiceSettings {
    return SOINTERA_VOICE_CONFIG.emotionalVoices[emotion];
  }
  
  /**
   * Получить настройки голоса для типа контента
   */
  static getContentVoice(contentType: keyof typeof CONTENT_VOICE_SETTINGS): VoiceSettings {
    return CONTENT_VOICE_SETTINGS[contentType];
  }
  
  /**
   * Проверить, подходит ли голос для Telegram
   */
  static isTelegramCompatible(voiceSettings: VoiceSettings): boolean {
    // Проверяем базовые требования
    return voiceSettings.speed >= 0.5 && 
           voiceSettings.speed <= 2.0 &&
           voiceSettings.pitch >= -20.0 && 
           voiceSettings.pitch <= 20.0;
  }
  
  /**
   * Оптимизировать настройки для лучшего качества
   */
  static optimizeForQuality(voiceSettings: VoiceSettings): VoiceSettings {
    return {
      ...voiceSettings,
      speed: Math.max(0.8, Math.min(1.2, voiceSettings.speed)),
      pitch: Math.max(-0.5, Math.min(0.5, voiceSettings.pitch)),
      volume: Math.max(0.8, Math.min(1.2, voiceSettings.volume || 1.0))
    };
  }
}
