import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';

dotenv.config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const proxy = process.env.HTTPS_PROXY;

console.log('Токен бота:', token ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('Прокси:', proxy || 'Не используется');

const botOptions = {
  polling: true
};

if (proxy) {
  botOptions.request = {
    agent: new HttpsProxyAgent(proxy)
  };
  console.log('Подключаемся через прокси:', proxy);
}

const bot = new TelegramBot(token, botOptions);

console.log('Попытка подключения к Telegram...');

try {
  const info = await bot.getMe();
  console.log('✅ Успешно подключились!');
  console.log('Бот:', info.username);
  console.log('ID:', info.id);
  
  bot.on('message', (msg) => {
    console.log('Получено сообщение:', msg.text);
    bot.sendMessage(msg.chat.id, 'Тест: бот работает!');
  });
  
  console.log('Бот готов к работе. Напишите ему в Telegram.');
} catch(err) {
  console.error('❌ ОШИБКА подключения:', err.message);
  console.log('Telegram заблокирован. Нужен HTTP прокси.');
  process.exit(1);
}

// Держим процесс активным
process.stdin.resume();
