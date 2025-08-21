#!/usr/bin/env tsx

import { FreeVoiceService } from '../voice/free-voice-service';
import { FreeVoiceSalesAgent } from '../ai/free-voice-sales-agent';

/**
 * 🔍 Проверка доступности бесплатных голосовых сервисов SOINTERA AI
 */

async function checkVoiceServices() {
  console.log('🔍 Проверка доступности бесплатных голосовых сервисов...\n');

  try {
    // Создаем экземпляр бесплатного голосового сервиса
    const voiceService = new FreeVoiceService();
    const salesAgent = new FreeVoiceSalesAgent();
    
    console.log('✅ Голосовые сервисы инициализированы');

    // Проверяем доступность всех сервисов
    console.log('\n📋 Проверка доступности сервисов...');
    const availability = await voiceService.checkAvailability();
    
    console.log('📊 Результаты проверки:');
    console.log(`  - eSpeak-ng (TTS): ${availability.espeak ? '✅ Доступен' : '❌ Недоступен'}`);
    console.log(`  - Whisper (STT): ${availability.whisper ? '✅ Доступен' : '❌ Недоступен'}`);
    console.log(`  - FFmpeg: ${availability.ffmpeg ? '✅ Доступен' : '❌ Недоступен'}`);
    
    const allAvailable = availability.espeak && availability.whisper && availability.ffmpeg;
    console.log(`\n🎯 Общий статус: ${allAvailable ? '✅ Все сервисы доступны!' : '❌ Не все сервисы доступны'}`);

    if (allAvailable) {
      console.log('\n🎉 Отлично! Все голосовые сервисы готовы к работе!');
      
      // Дополнительные проверки
      console.log('\n🔍 Дополнительные проверки...');
      
      // Проверяем доступные голоса eSpeak
      try {
        const voices = await voiceService.getAvailableVoices();
        console.log(`  - Доступные голоса eSpeak: ${voices.length}`);
        voices.slice(0, 3).forEach(voice => console.log(`    * ${voice}`));
        if (voices.length > 3) console.log(`    ... и еще ${voices.length - 3}`);
      } catch (error) {
        console.log('  - Ошибка получения голосов eSpeak:', error.message);
      }
      
      // Проверяем статистику
      const stats = voiceService.getStats();
      console.log(`  - Временная папка: ${stats.tempDir}`);
      console.log(`  - Количество временных файлов: ${stats.tempFilesCount}`);
      
      // Проверяем через SalesAgent
      console.log('\n🤖 Проверка через AI SalesAgent...');
      const agentAvailability = await salesAgent.checkVoiceServicesAvailability();
      console.log(`  - Статус через агента: ${agentAvailability.allAvailable ? '✅ OK' : '❌ Проблемы'}`);
      
      console.log('\n🚀 Голосовой сервис готов к работе!');
      console.log('\n💡 Теперь можете:');
      console.log('  1. Запустить бота: bun run start');
      console.log('  2. Протестировать голос: bun run voice:test');
      console.log('  3. Отправлять голосовые сообщения в Telegram');
      
    } else {
      console.log('\n⚠️ Для работы голосового сервиса необходимо установить:');
      
      if (!availability.espeak) {
        console.log('\n🗣️ eSpeak-ng (Text-to-Speech):');
        console.log('  macOS: brew install espeak-ng');
        console.log('  Ubuntu: sudo apt install espeak-ng');
        console.log('  Windows: скачать с https://github.com/espeak-ng/espeak-ng/releases');
      }
      
      if (!availability.whisper) {
        console.log('\n🎧 Whisper (Speech-to-Text):');
        console.log('  pip install openai-whisper');
        console.log('  или conda install -c conda-forge openai-whisper');
      }
      
      if (!availability.ffmpeg) {
        console.log('\n🎵 FFmpeg (обработка аудио):');
        console.log('  macOS: brew install ffmpeg');
        console.log('  Ubuntu: sudo apt install ffmpeg');
        console.log('  Windows: скачать с https://ffmpeg.org/download.html');
      }
      
      console.log('\n📖 Подробные инструкции см. в VOICE_SETUP_FREE.md');
    }

    // Очистка
    await voiceService.cleanup();
    console.log('\n🧹 Временные файлы очищены');

  } catch (error) {
    console.error('❌ Ошибка проверки голосовых сервисов:', error);
    console.log('\n🔍 Возможные причины:');
    console.log('  1. Не установлены необходимые компоненты');
    console.log('  2. Проблемы с PATH');
    console.log('  3. Ошибки в конфигурации');
    console.log('\n📖 См. инструкцию по настройке: VOICE_SETUP_FREE.md');
  }
}

// Запускаем проверку
checkVoiceServices().catch(console.error);
