import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import { FreeVoiceSalesAgent } from './lib/ai/free-voice-sales-agent.js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createWriteStream } from 'fs';
import { format } from 'util';

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

// Создаём папку для логов если её нет
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Создаём потоки для записи логов
const logFile = createWriteStream(path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`), { flags: 'a' });
const errorFile = createWriteStream(path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`), { flags: 'a' });

// Функция для логирования
const log = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = format(`[${timestamp}] [${level}] ${message}`, ...args);

  // Выводим в консоль
  if (level === 'ERROR') {
    console.error(formattedMessage);
  } else {
    console.log(formattedMessage);
  }

  // Записываем в файл
  if (level === 'ERROR') {
    errorFile.write(formattedMessage + '\n');
  }
  logFile.write(formattedMessage + '\n');
};

class TelegramBotService {
  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN не установлен в переменных окружения');
    }

    // Создаем бота без прокси
    this.bot = new TelegramBot(token, {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });

    this.salesAgent = new FreeVoiceSalesAgent();
    this.activeConversations = new Map();
    this.isRunning = false;
    this.messagesProcessed = 0;
    this.sessionStartTime = new Date();
    this.processedMessages = new Set(); // Защита от дублирования
  }

  async start() {
    log('INFO', '🚀 Запуск SOINTERA AI Продажника (Bot API)...');

    // Получаем информацию о боте
    try {
      const me = await this.bot.getMe();
      log('INFO', `🤖 Бот запущен: @${me.username} (${me.first_name})`);
      log('INFO', `📊 ID бота: ${me.id}`);
    } catch (error) {
    log('ERROR', 'Детали ошибки:', error.message);
    log('ERROR', 'Stack:', error.stack);
      log('ERROR', 'Ошибка при получении информации о боте:', error);
      throw error;
    }

    // Обработка всех сообщений (текст, голос, аудио)
    this.bot.on('message', async (msg) => {
      // Игнорируем сообщения от групп/каналов если они не приватные
      if (msg.chat.type !== 'private') {
        return;
      }

      // Обрабатываем текстовые, голосовые и аудио сообщения
      if (msg.text || msg.voice || msg.audio) {
        await this.handleMessage(msg);
      }
    });

    // Обработка ошибок polling
    this.bot.on('polling_error', (error) => {
      log('ERROR', 'Polling error:', error);
    });

    this.isRunning = true;
    this.sessionStartTime = new Date();

    log('INFO', '✅ AI Продажник активен и готов отвечать на сообщения!');
    log('INFO', '📨 Ожидание входящих сообщений...');
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id?.toString();
    
    // Защита от дублирования сообщений
    const messageKey = `${userId}_${msg.message_id}`;
    if (this.processedMessages.has(messageKey)) {
      log('WARN', `Дублирующееся сообщение ${messageKey}, игнорирую`);
      return;
    }
    this.processedMessages.add(messageKey);
    
    // Проверяем тип сообщения: текст, голос или аудио
    let text = msg.text;
    let isVoiceMessage = false;
    let voiceBuffer: Buffer | undefined;
    
    // ЛОГИКА ОТВЕТОВ:
    // 🎤 Голосовое сообщение → ТОЛЬКО голосовой ответ (без текста)
    // 📝 Текстовое сообщение → ТОЛЬКО текстовый ответ (без голоса)

    if (!text && (msg.voice || msg.audio)) {
      // Это голосовое или аудио сообщение
      isVoiceMessage = true;
      log('INFO', `🎤 Обнаружено голосовое сообщение: voice=${!!msg.voice}, audio=${!!msg.audio}`);
      
      try {
        // Скачиваем голосовое сообщение
        const fileId = msg.voice?.file_id || msg.audio?.file_id;
        log('INFO', `🎤 File ID: ${fileId}`);
        
        if (fileId) {
          const file = await this.bot.getFile(fileId);
          log('INFO', `🎤 Файл получен: ${file.file_path}`);
          
          const fileStream = await this.bot.getFileStream(fileId);
          
          // Читаем файл в буфер
          const chunks: Buffer[] = [];
          for await (const chunk of fileStream) {
            chunks.push(chunk);
          }
          voiceBuffer = Buffer.concat(chunks);
          
          log('INFO', `🎤 Получено голосовое сообщение размером ${voiceBuffer.length} байт`);
          log('INFO', `🎤 Первые 100 байт: ${voiceBuffer.slice(0, 100).toString('hex')}`);
        } else {
          log('ERROR', '🎤 File ID не найден');
        }
      } catch (error) {
        log('ERROR', 'Ошибка скачивания голосового сообщения:', error);
      }
    }

    if (!userId || (!text && !isVoiceMessage)) return;

    // Получаем информацию об отправителе
    const senderName = msg.from?.first_name || msg.from?.username || 'Клиент';
    const username = msg.from?.username;

    log('INFO', `💬 Новое сообщение от ${senderName} (@${username || 'без username'}): "${text}"`);

    // Обработка команды /start
    if (text === '/start') {
      const welcomeMessage = `Привет! 👋

Я помогу подобрать для вас идеальный курс в SOINTERA.

Расскажите, что вас интересует? Например:
• "Хочу научиться стричь с нуля"
• "Уже работаю мастером, хочу повысить уровень"
• "Интересуют онлайн курсы"
• "Когда ближайшее очное обучение?"

Или просто напишите свой вопрос - отвечу с удовольствием 😊`;
      
      await this.bot.sendMessage(chatId, welcomeMessage);
      return;
    }

    try {
      // Показываем, что бот печатает
      await this.bot.sendChatAction(chatId, 'typing');

      // Получаем или создаем клиента в базе
      const customer = await this.getOrCreateCustomer(userId, msg.from);

      // Получаем ID активной беседы
      const conversationId = this.activeConversations.get(userId);

      // Обрабатываем сообщение через AI агента
      log('DEBUG', 'Анализирую сообщение через AI...');
      
      let result;
      if (isVoiceMessage && voiceBuffer) {
        // Обрабатываем голосовое сообщение
        result = await this.salesAgent.processIncomingMessage(voiceBuffer, {
          telegramId: userId,
          username: customer.username || undefined,
          firstName: customer.firstName || undefined,
          classification: customer.classification || undefined,
          stage: customer.stage || undefined,
          conversationId: conversationId,
        }, true); // isVoice = true
      } else {
        // Обрабатываем текстовое сообщение
        result = await this.salesAgent.processIncomingMessage(text, {
          telegramId: userId,
          username: customer.username || undefined,
          firstName: customer.firstName || undefined,
          classification: customer.classification || undefined,
          stage: customer.stage || undefined,
          conversationId: conversationId,
        }, false); // isVoice = false
      }

      // Сохраняем беседу
      const messageToSave = isVoiceMessage ? `[Голосовое сообщение]` : text;
      const newConversationId = await this.salesAgent.saveConversation(
        customer.id,
        messageToSave,
        result.response,
        conversationId
      );

      this.activeConversations.set(userId, newConversationId);

      // Обновляем классификацию клиента
      if (result.classification) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            classification: result.classification,
            stage: result.classification === 'ready_to_buy' ? 'ready_to_buy' : customer.stage,
            lastInteraction: new Date()
          }
        });
        log('INFO', `📊 Классификация клиента: ${result.classification}`);
      }

            // Отправляем ответ
      log('INFO', `🤖 Отправляю ответ: "${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}"`);

      if (result.response && result.response !== '') {
        // Если это голосовое сообщение - отправляем ТОЛЬКО голосовой ответ
        if (isVoiceMessage && result.voiceResponse) {
          try {
            log('INFO', '🎤 Отправляю ТОЛЬКО голосовой ответ на голосовое сообщение...');
            log('INFO', `🎤 Тип чата: ${msg.chat.type}, ID чата: ${chatId}`);
            
            // Создаем временный файл для голосового сообщения
            const tempVoicePath = await this.salesAgent.createTempAudioFile(result.voiceResponse);
            
            // Пробуем отправить как голосовое сообщение
            try {
              await this.bot.sendVoice(chatId, tempVoicePath, {
                caption: '🎤 Ответ SOINTERA AI'
              });
              log('INFO', '✅ Голосовой ответ отправлен (только голос, без текста)');
            } catch (voiceError) {
              log('WARN', 'Не удалось отправить как голосовое сообщение, пробуем как аудио:', voiceError.message);
              
              // Если не получилось, отправляем как аудио файл с имитацией голосового сообщения
              try {
                await this.bot.sendAudio(chatId, tempVoicePath, {
                  caption: '🎤 Ответ SOINTERA AI',
                  title: 'Голосовое сообщение',
                  performer: 'SOINTERA AI',
                  duration: 30 // Примерная длительность
                });
                log('INFO', '✅ Голосовой ответ отправлен как аудио (имитация голосового сообщения)');
              } catch (audioError) {
                log('WARN', 'Не удалось отправить как аудио, пробуем как документ:', audioError.message);
                
                // Последняя попытка - отправляем как документ
                await this.bot.sendDocument(chatId, tempVoicePath, {
                  caption: '🎤 Ответ SOINTERA AI (голосовое сообщение)'
                });
                log('INFO', '✅ Голосовой ответ отправлен как документ');
              }
            }
            
            // Удаляем временный файл
            await this.salesAgent.removeTempAudioFile(tempVoicePath);
            
          } catch (error) {
            log('ERROR', 'Ошибка отправки голосового ответа:', error);
            // При ошибке отправляем текстовый ответ
            await this.sendLongMessage(chatId, result.response);
          }
        } else {
          // Для текстовых сообщений отправляем ТОЛЬКО текстовый ответ
          log('INFO', '📝 Отправляю ТОЛЬКО текстовый ответ на текстовое сообщение');
          await this.sendLongMessage(chatId, result.response);
          
          // НЕ отправляем голосовой ответ на текстовые сообщения!
          // Голосовые ответы только на голосовые сообщения
        }
      } else {
        log('ERROR', 'Пустой ответ от AI агента');
        await this.bot.sendMessage(chatId, 'Здравствуйте! К сожалению, произошла техническая ошибка. Пожалуйста, повторите ваш вопрос или обратитесь к менеджеру @natalylini');
      }
      
      this.messagesProcessed++;
      log('INFO', `✅ Ответ отправлен. Всего обработано сообщений: ${this.messagesProcessed}`);

      // Если нужен менеджер, уведомляем
      if (result.callManager && result.managerInfo) {
        log('INFO', `⚠️ Требуется помощь менеджера! Передаю @${process.env.MANAGER_USERNAME}`);
        await this.bot.sendMessage(chatId, 
          `⚠️ Я передам ваш вопрос менеджеру @${process.env.MANAGER_USERNAME}, она свяжется с вами в ближайшее время для подробной консультации.`
        );
      }

    } catch (error) {
      log('ERROR', 'Ошибка обработки сообщения:', error);
      try {
        await this.bot.sendMessage(chatId,
          'Извините, произошла техническая ошибка. Наш менеджер @natalylini свяжется с вами в ближайшее время.'
        );
      } catch (sendError) {
        log('ERROR', 'Не удалось отправить сообщение об ошибке:', sendError);
      }
    }
  }

  async sendLongMessage(chatId, text) {
    const maxLength = 4096;
    
    if (text.length <= maxLength) {
      await this.bot.sendMessage(chatId, text);
      return;
    }

    // Разбиваем длинное сообщение на части
    const parts = [];
    let currentPart = '';
    const lines = text.split('\n');

    for (const line of lines) {
      if ((currentPart + '\n' + line).length > maxLength) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = line;
        } else {
          let remainingLine = line;
          while (remainingLine.length > maxLength) {
            parts.push(remainingLine.substring(0, maxLength));
            remainingLine = remainingLine.substring(maxLength);
          }
          if (remainingLine) {
            currentPart = remainingLine;
          }
        }
      } else {
        currentPart = currentPart ? currentPart + '\n' + line : line;
      }
    }

    if (currentPart) {
      parts.push(currentPart);
    }

    // Отправляем части с небольшой задержкой
    for (const part of parts) {
      await this.bot.sendMessage(chatId, part);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async getOrCreateCustomer(telegramId, sender) {
    let customer = await prisma.customer.findUnique({
      where: { telegramId }
    });

    if (!customer) {
      log('INFO', `📝 Новый клиент! Добавляю в базу...`);
      customer = await prisma.customer.create({
        data: {
          telegramId,
          username: sender.username || null,
          firstName: sender.first_name || null,
          lastName: sender.last_name || null,
          phoneNumber: null,
        }
      });
    }

    return customer;
  }

  async stop() {
    this.isRunning = false;
    log('INFO', '⏹ Остановка AI Продажника...');
    
    await this.bot.stopPolling();
    await prisma.$disconnect();
    log('INFO', '👋 AI Продажник остановлен');

    logFile.end();
    errorFile.end();
  }
}

// Запуск приложения
async function main() {
  const bot = new TelegramBotService();

  try {
    await bot.start();

    // Обработка сигнала остановки
    process.on('SIGINT', async () => {
      log('INFO', 'Получен сигнал остановки (SIGINT)...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      log('INFO', 'Получен сигнал остановки (SIGTERM)...');
      await bot.stop();
      process.exit(0);
    });

    // Держим процесс активным
    await new Promise(() => {});

  } catch (error) {
    log('ERROR', 'Критическая ошибка:', error);
    await bot.stop();
    process.exit(1);
  }
}

// Запускаем приложение
main().catch((error) => {
  log('ERROR', 'Ошибка запуска приложения:', error);
  process.exit(1);
});
