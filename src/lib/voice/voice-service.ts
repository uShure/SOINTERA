import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * 🎤 Сервис для работы с голосовыми сообщениями
 * 
 * Возможности:
 * - Text-to-Speech (TTS) - преобразование текста в речь
 * - Speech-to-Text (STT) - распознавание речи
 * - Конвертация аудио форматов
 * - Оптимизация качества голоса
 */
export class VoiceService {
  private ttsClient: TextToSpeechClient;
  private speechClient: SpeechClient;
  private tempDir: string;

  constructor() {
    // Инициализируем Google Cloud клиенты
    this.ttsClient = new TextToSpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || undefined,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || undefined,
    });

    this.speechClient = new SpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || undefined,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || undefined,
    });

    // Создаем временную папку для аудио файлов
    this.tempDir = path.join(process.cwd(), 'temp', 'voice');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 🗣️ Преобразование текста в речь (TTS)
   */
  async textToSpeech(text: string, options: {
    voice?: string;
    language?: string;
    speed?: number;
    pitch?: number;
  } = {}): Promise<Buffer> {
    try {
      const {
        voice = 'ru-RU-Standard-A',
        language = 'ru-RU',
        speed = 1.0,
        pitch = 0.0
      } = options;

      const request = {
        input: { text },
        voice: {
          languageCode: language,
          name: voice,
          ssmlGender: 'FEMALE' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: speed,
          pitch: pitch,
          effectsProfileId: ['headphone-class-device'], // Оптимизация для наушников
        },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      if (response.audioContent) {
        return Buffer.from(response.audioContent);
      } else {
        throw new Error('Не удалось получить аудио контент');
      }
    } catch (error) {
      console.error('Ошибка TTS:', error);
      throw error;
    }
  }

  /**
   * 🎧 Распознавание речи (STT)
   */
  async speechToText(audioBuffer: Buffer, options: {
    language?: string;
    encoding?: string;
    sampleRateHertz?: number;
  } = {}): Promise<string> {
    try {
      const {
        language = 'ru-RU',
        encoding = 'MP3',
        sampleRateHertz = 16000
      } = options;

      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: encoding as any,
          sampleRateHertz,
          languageCode: language,
          enableAutomaticPunctuation: true,
          model: 'latest_long', // Лучшая модель для длинных аудио
        },
      };

      const [response] = await this.speechClient.recognize(request);
      
      if (response.results && response.results.length > 0) {
        const transcript = response.results
          .map(result => result.alternatives?.[0]?.transcript)
          .filter(Boolean)
          .join(' ');
        
        return transcript;
      } else {
        return '';
      }
    } catch (error) {
      console.error('Ошибка STT:', error);
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
        .audioChannels(1) // Моно для лучшего качества
        .audioFrequency(16000) // Частота для STT
        .audioBitrate('64k') // Битрейт для оптимизации
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
        .audioFrequency(22050) // Оптимальная частота для Telegram
        .audioBitrate('48k') // Оптимальный битрейт
        .audioCodec('libmp3lame')
        .audioFilters([
          'highpass=f=200', // Убираем низкие частоты
          'lowpass=f=8000',  // Убираем высокие частоты
          'volume=1.2'       // Немного увеличиваем громкость
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
   * 🎤 Получение доступных голосов
   */
  async getAvailableVoices(): Promise<string[]> {
    try {
      const [response] = await this.ttsClient.listVoices({});
      
      if (response.voices) {
        return response.voices
          .filter(voice => voice.languageCodes?.includes('ru-RU'))
          .map(voice => voice.name || '')
          .filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка получения голосов:', error);
      return [];
    }
  }

  /**
   * 📊 Получение статистики использования
   */
  getStats(): {
    tempDir: string;
    tempFilesCount: number;
  } {
    try {
      const files = fs.readdirSync(this.tempDir);
      return {
        tempDir: this.tempDir,
        tempFilesCount: files.length
      };
    } catch (error) {
      return {
        tempDir: this.tempDir,
        tempFilesCount: 0
      };
    }
  }
}
