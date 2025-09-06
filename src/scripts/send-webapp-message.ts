import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

class WebAppMessageSender {
  private bot: TelegramBot;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN не установлен в переменных окружения');
    }

    this.bot = new TelegramBot(token, { polling: false });
  }

  async sendWebAppMessageToAllUsers() {
    console.log('🚀 Отправка сообщения с Web App всем пользователям...');

    try {
      // Получаем всех пользователей из базы данных
      const users = await prisma.customer.findMany({
        select: {
          telegramId: true,
          firstName: true,
          username: true
        }
      });

      console.log(`📊 Найдено ${users.length} пользователей`);

      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          const chatId = parseInt(user.telegramId);
          
          const message = `💼 **Консультации SOINTERA**

Выберите подходящий тип консультации для получения персональных рекомендаций по обучению.`;

          await this.bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{
                  text: 'Открыть',
                  web_app: {
                    url: process.env.WEBAPP_URL || 'https://your-webapp-url.com'
                  }
                }]
              ]
            }
          });

          successCount++;
          console.log(`✅ Отправлено пользователю ${user.firstName || user.username || user.telegramId}`);

          // Небольшая задержка между отправками
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          errorCount++;
          console.error(`❌ Ошибка отправки пользователю ${user.telegramId}:`, error.message);
        }
      }

      console.log(`\n📈 Результаты отправки:`);
      console.log(`✅ Успешно отправлено: ${successCount}`);
      console.log(`❌ Ошибок: ${errorCount}`);

    } catch (error) {
      console.error('❌ Критическая ошибка:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async sendWebAppMessageToUser(telegramId: string) {
    console.log(`🚀 Отправка сообщения с Web App пользователю ${telegramId}...`);

    try {
      const chatId = parseInt(telegramId);
      
      const message = `💼 **Консультации SOINTERA**

Выберите подходящий тип консультации для получения персональных рекомендаций по обучению.`;

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: 'Открыть',
              web_app: {
                url: process.env.WEBAPP_URL || 'https://your-webapp-url.com'
              }
            }]
          ]
        }
      });

      console.log(`✅ Сообщение отправлено пользователю ${telegramId}`);

    } catch (error) {
      console.error(`❌ Ошибка отправки пользователю ${telegramId}:`, error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Запуск скрипта
async function main() {
  const sender = new WebAppMessageSender();
  
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Отправка конкретному пользователю
    const telegramId = args[0];
    await sender.sendWebAppMessageToUser(telegramId);
  } else {
    // Отправка всем пользователям
    await sender.sendWebAppMessageToAllUsers();
  }
}

main().catch(console.error);