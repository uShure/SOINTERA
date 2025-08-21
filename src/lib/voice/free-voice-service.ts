import fs from 'fs';
import path from 'path';
import { exec, execSync as cpExecSync } from 'child_process';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';

const execAsync = promisify(exec);

/**
 * 🎤 БЕСПЛАТНЫЙ голосовой сервис SOINTERA AI
 * 
 * Использует:
 * - eSpeak-ng для Text-to-Speech (бесплатно)
 * - Whisper для Speech-to-Text (бесплатно)
 * - FFmpeg для обработки аудио
 * 
 * НЕ требует платных API ключей!
 */
export class FreeVoiceService {
  private tempDir: string;
  private espeakPath: string;
  private whisperPath: string;

  constructor() {
    // Создаем временную папку для аудио файлов
    this.tempDir = path.join(process.cwd(), 'temp', 'voice');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Пути к исполняемым файлам
    this.espeakPath = this.findEspeakPath();
    this.whisperPath = this.findWhisperPath();
  }

  /**
   * 🔍 Поиск пути к eSpeak
   */
  private findEspeakPath(): string {
    // 1) Env override
    const envEspeak = process.env.ESPEAK_PATH || process.env.ESPEAK_NG_PATH;
    if (envEspeak) {
      try {
        cpExecSync(`"${envEspeak}" --version`, { stdio: 'ignore' });
        return envEspeak;
      } catch {}
    }

    // 2) Use shell resolution if available
    try {
      const resolved = cpExecSync('command -v espeak-ng', { encoding: 'utf8' }).toString().trim();
      if (resolved) {
        return resolved;
      }
    } catch {}

    const possiblePaths = [
      'espeak-ng',
      'espeak',
      '/usr/bin/espeak-ng',
      '/bin/espeak-ng',
      '/usr/local/bin/espeak-ng',
      'C:\\Program Files\\eSpeak\\espeak.exe',
      'C:\\Program Files (x86)\\eSpeak\\espeak.exe'
    ];

    for (const path of possiblePaths) {
      try {
        console.log(`🔍 Проверяю путь: ${path}`);
        // Проверяем доступность
        cpExecSync(`"${path}" --version`, { stdio: 'ignore' });
        console.log(`✅ Найден eSpeak: ${path}`);
        return path;
      } catch (error) {
        console.log(`❌ Не найден: ${path}`);
        continue;
      }
    }

    throw new Error('eSpeak не найден. Установите eSpeak-ng для TTS функциональности.');
  }

  /**
   * 🔍 Поиск пути к Whisper
   */
  private findWhisperPath(): string {
    // 1) Env override
    const envWhisper = process.env.WHISPER_PATH;
    if (envWhisper) {
      try {
        cpExecSync(`"${envWhisper}" --version`, { stdio: 'ignore' });
        return envWhisper;
      } catch {}
    }

    // 2) Use shell resolution if available
    try {
      const resolved = cpExecSync('command -v whisper', { encoding: 'utf8' }).toString().trim();
      if (resolved) {
        return resolved;
      }
    } catch {}

    const possiblePaths = [
      'whisper',
      'whisper-ai',
      '/opt/whisper-venv/bin/whisper',
      '/usr/local/bin/whisper',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python39\\Scripts\\whisper.exe'
    ];

    for (const path of possiblePaths) {
      try {
        // Проверяем доступность
        // У некоторых сборок whisper нет ключа --version, используем --help
        cpExecSync(`"${path}" --help`, { stdio: 'ignore' });
        return path;
      } catch {
        continue;
      }
    }

    throw new Error('Whisper не найден. Установите Whisper для STT функциональности.');
  }

  /**
   * 🗣️ Text-to-Speech с eSpeak (БЕСПЛАТНО)
   */
  async textToSpeech(text: string, options: {
    voice?: string;
    language?: string;
    speed?: number;
    pitch?: number;
    volume?: number;
  } = {}): Promise<Buffer> {
    try {
      const {
        voice = 'ru',
        language = 'ru',
        speed = 150, // слова в минуту
        pitch = 50,  // 0-100
        volume = 100 // 0-100
      } = options;

      const outputFile = path.join(this.tempDir, `tts_${Date.now()}.wav`);
      
      // Команда eSpeak с настройками
      const command = `"${this.espeakPath}" -v ${voice} -s ${speed} -p ${pitch} -a ${volume} -w "${outputFile}" "${text}"`;
      
      await execAsync(command);
      
      // Проверяем, что файл создан
      if (!fs.existsSync(outputFile)) {
        throw new Error('Не удалось создать аудио файл');
      }

      // Читаем файл в буфер
      const audioBuffer = fs.readFileSync(outputFile);
      
      // Удаляем временный файл
      fs.unlinkSync(outputFile);
      
      return audioBuffer;
    } catch (error) {
      console.error('Ошибка TTS (eSpeak):', error);
      throw error;
    }
  }

  /**
   * 🎧 Speech-to-Text с Whisper (БЕСПЛАТНО)
   */
  async speechToText(audioBuffer: Buffer, options: {
    language?: string;
    model?: string;
  } = {}): Promise<string> {
    try {
      const {
        language = 'ru',
        model = 'base' // tiny, base, small, medium, large
      } = options;

      const inputFile = path.join(this.tempDir, `stt_input_${Date.now()}.wav`);
      const outputFile = path.join(this.tempDir, `stt_output_${Date.now()}.txt`);
      
      // Записываем аудио во временный файл
      fs.writeFileSync(inputFile, audioBuffer);
      
      // Команда Whisper
      const command = `"${this.whisperPath}" "${inputFile}" --language ${language} --model ${model} --output_dir "${this.tempDir}" --output_format txt`;
      
      await execAsync(command);
      
      // Читаем результат
      let transcript = '';
      if (fs.existsSync(outputFile)) {
        transcript = fs.readFileSync(outputFile, 'utf-8').trim();
      }
      
      // Удаляем временные файлы
      try {
        fs.unlinkSync(inputFile);
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      } catch {}
      
      return transcript || 'Не удалось распознать речь';
    } catch (error) {
      console.error('Ошибка STT (Whisper):', error);
      throw error;
    }
  }

  /**
   * 🔄 Конвертация аудио в нужный формат
   */
  async convertAudio(inputBuffer: Buffer, outputFormat: 'mp3' | 'ogg' | 'wav' = 'mp3'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputPath = path.join(this.tempDir, `input_${Date.now()}.tmp`);
      const outputPath = path.join(this.tempDir, `output_${Date.now()}.${outputFormat}`);

      // Записываем входной буфер во временный файл
      fs.writeFileSync(inputPath, inputBuffer);

      ffmpeg(inputPath)
        .toFormat(outputFormat)
        .audioChannels(1)
        .audioFrequency(16000)
        .audioBitrate('64k')
        .on('end', () => {
          try {
            const outputBuffer = fs.readFileSync(outputPath);
            
            // Удаляем временные файлы
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
            
            resolve(outputBuffer);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          // Удаляем временные файлы при ошибке
          try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch {}
          
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * 🎵 Оптимизация аудио для Telegram
   */
  async optimizeForTelegram(audioBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputPath = path.join(this.tempDir, `input_${Date.now()}.tmp`);
      const outputPath = path.join(this.tempDir, `optimized_${Date.now()}.mp3`);

      fs.writeFileSync(inputPath, audioBuffer);

      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioChannels(1)
        .audioFrequency(22050)
        .audioBitrate('48k')
        .audioCodec('libmp3lame')
        .audioFilters([
          'highpass=f=200',
          'lowpass=f=8000',
          'volume=1.2'
        ])
        .on('end', () => {
          try {
            const outputBuffer = fs.readFileSync(outputPath);
            
            // Удаляем временные файлы
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
            
            resolve(outputBuffer);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch {}
          
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * 🎭 Генерация голоса с эмоциями
   */
  async generateEmotionalVoice(text: string, emotion: 'friendly' | 'professional' | 'enthusiastic' | 'calm'): Promise<Buffer> {
    const voiceSettings = this.getVoiceSettingsForEmotion(emotion);
    return await this.textToSpeech(text, voiceSettings);
  }

  /**
   * 🎭 Настройки голоса для разных эмоций
   */
  private getVoiceSettingsForEmotion(emotion: string): {
    voice: string;
    language: string;
    speed: number;
    pitch: number;
    volume: number;
  } {
    const baseSettings = {
      voice: 'ru',
      language: 'ru'
    };

    switch (emotion) {
      case 'friendly':
        return { ...baseSettings, speed: 140, pitch: 55, volume: 100 };
      case 'professional':
        return { ...baseSettings, speed: 160, pitch: 45, volume: 95 };
      case 'enthusiastic':
        return { ...baseSettings, speed: 170, pitch: 60, volume: 110 };
      case 'calm':
        return { ...baseSettings, speed: 130, pitch: 40, volume: 90 };
      default:
        return { ...baseSettings, speed: 150, pitch: 50, volume: 100 };
    }
  }

  /**
   * 👥 Настройки голоса для разных типов клиентов
   */
  async generateCustomerVoice(text: string, customerType: 'beginner' | 'experienced' | 'interested' | 'ready_to_buy'): Promise<Buffer> {
    const voiceSettings = this.getVoiceSettingsForCustomer(customerType);
    return await this.textToSpeech(text, voiceSettings);
  }

  /**
   * 👥 Настройки голоса для разных типов клиентов
   */
  private getVoiceSettingsForCustomer(customerType: string): {
    voice: string;
    language: string;
    speed: number;
    pitch: number;
    volume: number;
  } {
    const baseSettings = {
      voice: 'ru',
      language: 'ru'
    };

    switch (customerType) {
      case 'beginner':
        return { ...baseSettings, speed: 130, pitch: 45, volume: 105 }; // Медленнее, доверительнее
      case 'experienced':
        return { ...baseSettings, speed: 170, pitch: 55, volume: 100 }; // Быстрее, профессиональнее
      case 'interested':
        return { ...baseSettings, speed: 150, pitch: 50, volume: 100 }; // Стандартно
      case 'ready_to_buy':
        return { ...baseSettings, speed: 160, pitch: 60, volume: 110 }; // Энергично, убедительно
      default:
        return { ...baseSettings, speed: 150, pitch: 50, volume: 100 };
    }
  }

  /**
   * 🎤 Получение доступных голосов eSpeak
   */
  async getAvailableVoices(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`"${this.espeakPath}" --voices`);
      
      return stdout
        .split('\n')
        .filter(line => line.trim() && line.includes('ru'))
        .map(line => {
          const parts = line.split(/\s+/);
          return parts[1] || 'ru'; // Извлекаем код языка
        })
        .filter((voice, index, arr) => arr.indexOf(voice) === index); // Убираем дубликаты
    } catch (error) {
      console.error('Ошибка получения голосов eSpeak:', error);
      return ['ru']; // Возвращаем базовый русский голос
    }
  }

  /**
   * 📊 Получение статистики использования
   */
  getStats(): {
    tempDir: string;
    tempFilesCount: number;
    espeakPath: string;
    whisperPath: string;
  } {
    try {
      const files = fs.readdirSync(this.tempDir);
      return {
        tempDir: this.tempDir,
        tempFilesCount: files.length,
        espeakPath: this.espeakPath,
        whisperPath: this.whisperPath
      };
    } catch (error) {
      return {
        tempDir: this.tempDir,
        tempFilesCount: 0,
        espeakPath: this.espeakPath,
        whisperPath: this.whisperPath
      };
    }
  }

  /**
   * 🧹 Очистка временных файлов
   */
  async cleanup(): Promise<void> {
    try {
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Ошибка очистки временных файлов:', error);
    }
  }

  /**
   * ✅ Проверка доступности сервисов
   */
  async checkAvailability(): Promise<{
    espeak: boolean;
    whisper: boolean;
    ffmpeg: boolean;
  }> {
    const result = {
      espeak: false,
      whisper: false,
      ffmpeg: false
    };

    try {
      // Проверяем eSpeak
      await execAsync(`"${this.espeakPath}" --version`);
      result.espeak = true;
    } catch {
      result.espeak = false;
    }

    try {
      // Проверяем Whisper (используем --help вместо --version)
      await execAsync(`"${this.whisperPath}" --help`);
      result.whisper = true;
    } catch {
      result.whisper = false;
    }

    try {
      // Проверяем FFmpeg
      await execAsync('ffmpeg -version');
      result.ffmpeg = true;
    } catch {
      result.ffmpeg = false;
    }

    return result;
  }

  /**
   * 📁 Создание временного файла для отправки через Bot API
   */
  async createTempAudioFile(audioBuffer: Buffer, filename?: string): Promise<string> {
    const tempFileName = filename || `voice_${Date.now()}.wav`;
    const tempFilePath = path.join(this.tempDir, tempFileName);
    
    try {
      fs.writeFileSync(tempFilePath, audioBuffer);
      return tempFilePath;
    } catch (error) {
      console.error('Ошибка создания временного аудио файла:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Удаление временного аудио файла
   */
  async removeTempAudioFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Ошибка удаления временного аудио файла:', error);
    }
  }
}

// Вспомогательная функция для execSync
function execSync(command: string, options: any): void {
  const { execSync: execSyncFn } = require('child_process');
  execSyncFn(command, options);
}
