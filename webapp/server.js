const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.WEBAPP_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API для получения информации о консультациях
app.get('/api/consultations', (req, res) => {
    const consultations = [
        {
            id: 'basic',
            title: 'Базовая консультация',
            description: 'Первичная консультация по выбору курса, определению уровня подготовки и составлению плана обучения.',
            price: 'Бесплатно',
            duration: '15-20 минут',
            features: [
                'Анализ текущего уровня',
                'Рекомендации по курсам',
                'Ответы на вопросы',
                'План развития'
            ]
        },
        {
            id: 'advanced',
            title: 'Расширенная консультация',
            description: 'Детальная консультация с анализом портфолио, составлением индивидуального плана обучения и рекомендациями по карьере.',
            price: '2 000 ₽',
            duration: '45-60 минут',
            features: [
                'Анализ портфолио',
                'Индивидуальный план',
                'Карьерные рекомендации',
                'Связь с менеджером'
            ]
        },
        {
            id: 'premium',
            title: 'Премиум консультация',
            description: 'Полная консультация с мастером, включая практические советы, разбор техник и персональные рекомендации.',
            price: '5 000 ₽',
            duration: '90 минут',
            features: [
                'Консультация с мастером',
                'Практические советы',
                'Разбор техник',
                'Персональные рекомендации',
                'Последующая поддержка'
            ]
        }
    ];

    res.json(consultations);
});

// API для записи на консультацию
app.post('/api/consultation/request', (req, res) => {
    const { consultationId, userData, message } = req.body;
    
    console.log('Новая заявка на консультацию:', {
        consultationId,
        userData,
        message,
        timestamp: new Date().toISOString()
    });
    
    // Здесь можно добавить логику сохранения в базу данных
    // или отправки уведомления менеджеру
    
    res.json({
        success: true,
        message: 'Заявка принята. Менеджер свяжется с вами в ближайшее время.'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
    });
});

// 404 обработчик
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Страница не найдена'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Web App сервер запущен на порту ${PORT}`);
    console.log(`📱 Web App доступен по адресу: http://localhost:${PORT}`);
});

module.exports = app;