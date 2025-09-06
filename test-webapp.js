#!/usr/bin/env node

/**
 * Скрипт для тестирования Web App
 * Запускает Web App сервер и проверяет его работу
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Тестирование SOINTERA Web App...\n');

// Функция для проверки доступности сервера
function checkServer(port, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Сервер не отвечает в течение ${timeout}ms`));
        }, timeout);

        const req = http.get(`http://localhost:${port}`, (res) => {
            clearTimeout(timer);
            resolve(res.statusCode === 200);
        });

        req.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

// Запуск Web App сервера
async function testWebApp() {
    console.log('📦 Запуск Web App сервера...');
    
    const webappProcess = spawn('npm', ['start'], {
        cwd: './webapp',
        stdio: 'pipe'
    });

    // Обработка вывода сервера
    webappProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Web App сервер запущен')) {
            console.log('✅ Web App сервер запущен');
        }
    });

    webappProcess.stderr.on('data', (data) => {
        console.error('❌ Ошибка сервера:', data.toString());
    });

    // Ждем запуска сервера
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // Проверяем доступность сервера
        console.log('🔍 Проверка доступности сервера...');
        await checkServer(3001);
        console.log('✅ Сервер доступен на порту 3001');
        
        // Проверяем API
        console.log('🔍 Проверка API...');
        const apiResponse = await fetch('http://localhost:3001/api/consultations');
        const consultations = await apiResponse.json();
        
        if (Array.isArray(consultations) && consultations.length > 0) {
            console.log(`✅ API работает, найдено ${consultations.length} консультаций`);
        } else {
            console.log('❌ API не возвращает данные о консультациях');
        }

        console.log('\n🎉 Web App готов к работе!');
        console.log('📱 Откройте http://localhost:3001 в браузере для тестирования');
        console.log('🛑 Нажмите Ctrl+C для остановки сервера');

        // Обработка остановки
        process.on('SIGINT', () => {
            console.log('\n🛑 Остановка сервера...');
            webappProcess.kill();
            process.exit(0);
        });

        // Держим процесс активным
        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
        webappProcess.kill();
        process.exit(1);
    }
}

// Запуск тестирования
testWebApp().catch(console.error);