const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const proxy = process.env.HTTPS_PROXY;

console.log('Токен бота:', token ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('Прокси:', proxy || 'Не используется');

const botOptions = {
  polling: true
};

if (proxy) {
  const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent;
  botOptions.request = {
    agent: new HttpsProxyAgent(proxy)
  };
  console.log('Подключаемся через прокси:', proxy);
}

const bot = new TelegramBot(token, botOptions);

console.log('Попытка подключения к Telegram...');

bot.getMe().then(info => {
  console.log('✅ Успешно подключились!');
  console.log('Бот:', info.username);
  console.log('ID:', info.id);
  
  bot.on('message', (msg) => {
    console.log('Получено сообщение:', msg.text);
    bot.sendMessage(msg.chat.id, 'Тест: бот работает!');
  });
  
  console.log('Бот готов к работе. Напишите ему в Telegram.');
}).catch(err => {
  console.error('❌ ОШИБКА подключения:', err.message);
  if (err.code === 'ETELEGRAM') {
    console.log('Возможно неправильный токен или бот удален');
  } else if (err.code === 'EFATAL') {
    console.log('Telegram заблокирован. Нужен прокси.');
  } else {
    console.log('Код ошибки:', err.code);
  }
});

// Держим процесс активным
process.stdin.resume();
