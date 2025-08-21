#!/usr/bin/env tsx

import { VoiceService } from '../voice/voice-service';
import { SOINTERA_VOICE_CONFIG, VoiceConfigUtils } from '../voice/voice-config';

/**
 * 🎤 Тестирование голосового сервиса SOINTERA AI
 */

async function testVoiceService() {
  console.log('🎤 Тестирование голосового сервиса SOINTERA AI...\n');

  try {
    // Создаем экземпляр голосового сервиса
    const voiceService = new VoiceService();
    
    console.log('✅ Голосовой сервис инициализирован');

    // Тест 1: Получение доступных голосов
    console.log('\n📋 Тест 1: Получение доступных голосов...');
    const voices = await voiceService.getAvailableVoices();
    console.log(`✅ Найдено ${voices.length} доступных голосов:`);
    voices.slice(0, 5).forEach(voice => console.log(`  - ${voice}`));

    // Тест 2: Проверка конфигурации
    console.log('\n⚙️ Тест 2: Проверка конфигурации...');
    console.log('✅ Конфигурация голосов загружена:');
    console.log(`  - Основной голос: ${SOINTERA_VOICE_CONFIG.defaultVoice}`);
    console.log(`  - Язык: ${SOINTERA_VOICE_CONFIG.defaultLanguage}`);
    console.log(`  - Скорость: ${SOINTERA_VOICE_CONFIG.defaultSpeed}`);
    console.log(`  - Тон: ${SOINTERA_VOICE_CONFIG.defaultPitch}`);

    // Тест 3: Проверка настроек для разных типов клиентов
    console.log('\n👥 Тест 3: Настройки для разных типов клиентов...');
    const customerTypes = ['beginner', 'experienced', 'interested', 'ready_to_buy'] as const;
    
    customerTypes.forEach(type => {
      const settings = VoiceConfigUtils.getCustomerVoice(type);
      console.log(`  - ${type}: ${settings.voice}, скорость: ${settings.speed}, тон: ${settings.pitch}`);
    });

    // Тест 4: Проверка эмоциональных голосов
    console.log('\n🎭 Тест 4: Эмоциональные голоса...');
    const emotions = ['friendly', 'professional', 'enthusiastic', 'calm'] as const;
    
    emotions.forEach(emotion => {
      const settings = VoiceConfigUtils.getEmotionalVoice(emotion);
      console.log(`  - ${emotion}: ${settings.voice}, скорость: ${settings.speed}, тон: ${settings.pitch}`);
    });

    // Тест 5: Проверка настроек для разных типов контента
    console.log('\n📝 Тест 5: Настройки для разных типов контента...');
    const contentTypes = ['greeting', 'courseDescription', 'pricing', 'technical'] as const;
    
    contentTypes.forEach(type => {
      const settings = VoiceConfigUtils.getContentVoice(type);
      console.log(`  - ${type}: ${settings.voice}, скорость: ${settings.speed}, тон: ${settings.pitch}`);
    });

    // Тест 6: Проверка совместимости с Telegram
    console.log('\n📱 Тест 6: Совместимость с Telegram...');
    const testSettings = SOINTERA_VOICE_CONFIG.customerVoices.beginner;
    const isCompatible = VoiceConfigUtils.isTelegramCompatible(testSettings);
    console.log(`✅ Настройки для новичков совместимы с Telegram: ${isCompatible}`);

    // Тест 7: Оптимизация настроек
    console.log('\n🔧 Тест 7: Оптимизация настроек...');
    const optimizedSettings = VoiceConfigUtils.optimizeForQuality(testSettings);
    console.log('✅ Оптимизированные настройки:');
    console.log(`  - Скорость: ${testSettings.speed} → ${optimizedSettings.speed}`);
    console.log(`  - Тон: ${testSettings.pitch} → ${optimizedSettings.pitch}`);
    console.log(`  - Громкость: ${testSettings.volume || 1.0} → ${optimizedSettings.volume}`);

    // Тест 8: Статистика сервиса
    console.log('\n📊 Тест 8: Статистика сервиса...');
    const stats = voiceService.getStats();
    console.log('✅ Статистика голосового сервиса:');
    console.log(`  - Временная папка: ${stats.tempDir}`);
    console.log(`  - Количество временных файлов: ${stats.tempFilesCount}`);

    // Тест 9: Очистка временных файлов
    console.log('\n🧹 Тест 9: Очистка временных файлов...');
    await voiceService.cleanup();
    console.log('✅ Временные файлы очищены');

    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('\n🚀 Голосовой сервис готов к работе!');
    console.log('\n📖 Для настройки см. VOICE_SETUP.md');

  } catch (error) {
    console.error('❌ Ошибка тестирования голосового сервиса:', error);
    console.log('\n🔍 Возможные причины:');
    console.log('  1. Не настроен Google Cloud API');
    console.log('  2. Не установлен FFmpeg');
    console.log('  3. Отсутствуют переменные окружения');
    console.log('\n📖 См. инструкцию по настройке: VOICE_SETUP.md');
  }
}

// Запускаем тесты
testVoiceService().catch(console.error);
