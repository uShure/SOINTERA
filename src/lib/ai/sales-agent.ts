import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

// Загружаем переменные окружения из .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Настройка прокси если указан
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const httpAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

// Создаем кастомный fetch с прокси
const customFetch = httpAgent ? (url: any, init: any = {}) => {
  return fetch(url, { ...init, agent: httpAgent });
} : undefined;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: httpAgent as any,
  fetch: customFetch as any,
});

const prisma = new PrismaClient();

export interface CustomerContext {
  telegramId: string;
  username?: string;
  firstName?: string;
  classification?: string;
  stage?: string;
  conversationId?: string;
}

const MANAGER_TRIGGERS = [
  'оформить заказ',
  'лист ожидания',
  'не могу зайти в личный кабинет',
  'программа курса',
  'рассрочка от нас',
  'оплатить как ип',
  'купить',
  'оплатить',
  'записаться'
];

const SYSTEM_PROMPT = `
Вы - AI-продажник школы парикмахерского искусства SOINTERA. Вы общаетесь с клиентами от лица школы, помогаете выбрать курсы и отвечаете на вопросы.

ВАЖНО:
- Вы НЕ придумываете ничего от себя. Используете только информацию из базы данных курсов.
- Обязательно указывайте ДАТЫ НАЧАЛА курсов для очных и курсов с куратором.
- Курсы в записи БЕЗ даты старта - можно начать в любое время.
- Сегодня ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}.

📋 СТРАТЕГИЯ ПРОДАЖ - СНАЧАЛА ВОПРОСЫ!
ВАЖНО: НЕ предлагайте сразу много курсов! Сначала задавайте уточняющие вопросы:

"Давайте я вам задам несколько вопросов, чтобы понять, какой именно курс будет вам полезен, затем расскажу подробнее о программе и стоимости, если все понравится, то помогу занять место, хорошо?

Расскажите о себе:
- Как давно вы занимаетесь стрижками/колористикой?
- Чего вам не хватает на практике?
- Есть ли у вас базовое парикмахерское образование?

Расскажите все, что посчитаете нужным."

После получения ответа - предлагайте ОДИН наиболее подходящий курс с подробным описанием программы.

ВАЖНО ПРИ АНАЛИЗЕ ОТВЕТОВ:
- Если человек говорит "давно" или упоминает опыт - это ОПЫТНЫЙ мастер
- Опытным мастерам НЕ предлагать простые дешевые курсы (Стрижка SOINTERA за 3900₽)
- Опытным предлагать: Фундамент, Наставник, продвинутые курсы от 35000₽
- Новичкам - вообще не предлагать курсы, отправлять учиться базе

📋 ПРИНЦИПЫ ОБЩЕНИЯ:
1. Лёгкий, разговорный стиль. Обращение на "вы"
2. После презентации курса ОБЯЗАТЕЛЬНО спрашивайте: "Готовы забронировать место?" или "Какой вариант вам больше подходит?"
3. Используйте фразы поддержки: "Очень понятный вопрос", "Вы точно не одна с таким запросом"
4. Аргументируйте через пользу: "Этот курс хорошо заходит тем, кто..."

❌ НЕ ИСПОЛЬЗУЙТЕ:
- Навязчивые фразы: "Только сегодня скидка!", "Вы упустите шанс!"
- Пассивную неуверенность: "Может быть, вам подойдёт..."
- Сухую информацию без контекста

🎯 ЦЕЛЕВАЯ АУДИТОРИЯ:
- Женщины 30-45 лет
- В профессии от 5 до 20 лет
- Хотят системы, уверенности, роста дохода
- Боятся поднимать цены, онлайн-обучения, что "уже поздно"

📚 ВАЖНАЯ ИНФОРМАЦИЯ О КУРСАХ:

ОЧНЫЕ КУРСЫ:
- Проходят в Творческой деревне SOINTERA
- Формат "всё включено": проживание, питание от повара, утренние беседы с Еленой
- НЕ выдаем ножницы и фен (нужно привезти свои)
- НЕТ видеозаписей курсов после обучения
- Мужья НЕ могут присутствовать
- НЕТ доплаты за ночь
- НЕТ рассрочки на очные курсы
- Полотенце привозить НЕ нужно

ОНЛАЙН КУРСЫ:
- Доступ к материалам на 1 год
- Предзаписанные видео уроки (НЕ говорите "интерактивные вебинары"!)
- Если не успели сдать задания вовремя - продление 3000 руб/месяц
- Рассрочка от школы на разное количество месяцев (зависит от курса)
- Можно оплатить на одного, а смотреть нескольким (домашку сдает тот, кто оплатил)

ТРЕБОВАНИЯ К КУРСАМ:
- "Фундамент" - курс для мастеров с базовым образованием, 11 базовых форм стрижек, систематизация знаний
- "С нуля", "Парикмахер с нуля" - НЕ для новичков! Нужно иметь базовое парикмахерское образование
- "Наставник по стрижкам" - ОНЛАЙН формат для опытных мастеров, практика на манекенах в три круга, 3 месяца
- "Наставник по колористике" - ОНЛАЙН формат для опытных колористов, 3 месяца
- "Стрижка SOINTERA" - авторская техника для опытных мастеров (НЕ предлагать в общих запросах)

РАЗНИЦА МЕЖДУ ПРОГРАММАМИ:
- ТРЕНЕР - обучает других мастеров, ведет курсы. Чтобы стать тренером нужно пройти программы наставников и сдать все домашние задания вовремя
- НАСТАВНИК - индивидуальное сопровождение мастеров

ТАКТИКА ПРОДАЖ:
- При запросе очных курсов, если нет мест: "К сожалению, места на очный курс закончились. Но есть отличная альтернатива - онлайн формат с теми же результатами! Вы сможете учиться в удобном темпе, пересматривать уроки, и главное - начать уже на следующей неделе."

ОБЯЗАТЕЛЬНО РАСПИСЫВАЙТЕ ПРОГРАММУ в сообщениях, не отправляйте просто на сайт.

ВАЖНО ДЛЯ НОВИЧКОВ:
Если человек говорит "с нуля", "я новичок", "нет опыта", "хочу научиться" - отвечайте:
"К сожалению, у нас НЕТ курсов для полных новичков без парикмахерского образования. Все наши программы (включая курсы с названием 'с нуля') требуют базовое парикмахерское образование (минимум курсы или колледж).

Рекомендую сначала получить базовое образование в парикмахерском колледже или на базовых курсах в вашем городе, а затем вернуться к нам для повышения квалификации.

Наши курсы подойдут вам, когда у вас уже будет база и опыт работы с клиентами."

НЕ предлагайте курсы "Парикмахер с нуля", "Фундамент", "Курс с нуля" новичкам!
НЕ предлагайте "Наставник" и "Стрижка SOINTERA" - это для опытных мастеров!

📱 КОГДА ЗВАТЬ МЕНЕДЖЕРА:
Если клиент спрашивает про: оформление заказа, лист ожидания, личный кабинет, подробную программу курса, рассрочку от школы, оплату как ИП, или готов купить/записаться - скажите: "По этому вопросу вас проконсультирует наш менеджер @natalylini, я передам ей ваш запрос."
`;

export class SalesAgent {
  async classifyCustomer(message: string, context: CustomerContext): Promise<string> {
    const keywords = {
      beginner: ['начинающий', 'новичок', 'с нуля', 'хочу научиться', 'нет опыта', 'только начинаю'],
      experienced: ['опыт', 'работаю', 'лет в профессии', 'мастер', 'салон', 'клиенты', 'давно занимаюсь', 'давно, хочу'],
      interested: ['интересно', 'расскажите', 'что у вас есть', 'какие курсы', 'хочу узнать'],
      asking_questions: ['как давно', 'какой опыт', 'чего не хватает', 'где работаю', 'обучение'],
      ready_to_buy: ['хочу купить', 'готов оплатить', 'записаться', 'забронировать', 'беру', 'оплачу', 'как оплатить']
    };

    for (const [classification, words] of Object.entries(keywords)) {
      if (words.some(word => message.toLowerCase().includes(word))) {
        return classification;
      }
    }

    return 'interested';
  }

  async shouldCallManager(message: string): Promise<boolean> {
    const lowerMessage = message.toLowerCase();
    return MANAGER_TRIGGERS.some(trigger => lowerMessage.includes(trigger));
  }

  // Получаем историю беседы
  async getConversationHistory(conversationId: string | undefined): Promise<any[]> {
    if (!conversationId) return [];

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10 // Берем последние 10 сообщений для контекста
    });

    return messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));
  }

  // Проверяем нужно ли задавать уточняющие вопросы
  shouldAskClarifyingQuestions(message: string, conversationHistory: any[]): boolean {
    // Если это первое сообщение или короткий запрос без деталей
    if (conversationHistory.length === 0) {
      const shortRequests = [
        'курсы по стрижкам', 'колористика', 'что у вас есть', 'какие курсы',
        'стрижки', 'цвет волос', 'обучение', 'хочу учиться', 'хочу стрижки'
      ];

      return shortRequests.some(req => message.toLowerCase().includes(req)) &&
             message.length < 100; // Короткое сообщение
    }

    // Если в истории уже есть наши вопросы - не задаем повторно
    const hasAskedQuestions = conversationHistory.some(msg =>
      msg.role === 'assistant' &&
      msg.content.includes('Давайте я вам задам несколько вопросов')
    );

    return false;
  }

  async processMessage(message: string, context: CustomerContext): Promise<{
    response: string;
    callManager: boolean;
    classification?: string;
    managerInfo?: {
      customerName: string;
      customerUsername?: string;
      request: string;
      classification?: string;
    };
  }> {
    // Получаем историю беседы
    const conversationHistory = await this.getConversationHistory(context.conversationId);

    // Проверяем, отвечает ли клиент на наши вопросы
    const isAnsweringQuestions = conversationHistory.some(msg =>
      msg.role === 'assistant' &&
      msg.content.includes('Давайте я вам задам несколько вопросов')
    );

    // Если отвечает на вопросы, анализируем ответ более внимательно
    let classification = await this.classifyCustomer(message, context);

    if (isAnsweringQuestions) {
      const lowerMessage = message.toLowerCase();
      // Если упоминает "давно" или похожие слова - это опытный мастер
      if (lowerMessage.includes('давно') ||
          lowerMessage.includes('лет работаю') ||
          lowerMessage.includes('опыт') ||
          (lowerMessage.includes('есть') && lowerMessage.includes('хочу узнать'))) {
        classification = 'experienced';
      }
    }

    // Проверяем, нужен ли менеджер
    const callManager = await this.shouldCallManager(message) || classification === 'ready_to_buy';

    if (callManager) {
      const managerInfo = {
        customerName: context.firstName || context.username || context.telegramId,
        customerUsername: context.username,
        request: message,
        classification
      };

      return {
        response: `По этому вопросу вас проконсультирует наш менеджер @${process.env.MANAGER_USERNAME}, я передам ей ваш запрос. Она свяжется с вами в ближайшее время.`,
        callManager: true,
        classification,
        managerInfo
      };
    }

    // Проверяем нужно ли задавать уточняющие вопросы
    if (this.shouldAskClarifyingQuestions(message, conversationHistory) && classification !== 'beginner') {
      const response = `Давайте я вам задам несколько вопросов, чтобы понять, какой именно курс будет вам полезен, затем расскажу подробнее о программе и стоимости, если все понравится, то помогу занять место, хорошо?

Расскажите о себе:
- Как давно вы занимаетесь стрижками/колористикой?
- Чего вам не хватает на практике?
- Есть ли у вас базовое парикмахерское образование?

Расскажите все, что посчитаете нужным.`;

      return {
        response,
        callManager: false,
        classification
      };
    }

    // Получаем релевантные курсы с учетом классификации
    const courses = await this.findRelevantCourses(message, classification);

    // Генерируем ответ с помощью AI
    const response = await this.generateResponse(message, courses, context, conversationHistory);

    return {
      response,
      callManager: false,
      classification
    };
  }

  async findRelevantCourses(message: string, classification?: string) {
    const keywords = {
      haircut: ['стрижк', 'короткие', 'форм', 'парикмахер', 'фундамент'],
      color: ['цвет', 'колорист', 'блонд', 'днк цвета', 'окрашиван'],
      management: ['руководител', 'салон', 'планирован', 'управлен'],
      education: ['преподават', 'тренер', 'обуч', 'наставник'],
      online: ['онлайн', 'дистанц'],
      offline: ['очно', 'офлайн', 'деревн', 'творческая деревня']
    };

    const categories: string[] = [];
    const formats: string[] = [];

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => message.toLowerCase().includes(word))) {
        if (category === 'online' || category === 'offline') {
          formats.push(category);
        } else {
          categories.push(category);
        }
      }
    }

    const where: any = {};
    if (categories.length > 0) {
      where.category = { in: categories };
    }
    if (formats.length > 0) {
      where.format = { in: formats };
    }

    // Получаем курсы с датами, отсортированные по дате начала
    let courses = await prisma.course.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [
        { startDate: 'asc' },
        { price: 'asc' }
      ],
      take: 7
    });

    // Специальная обработка для конкретных запросов курсов
    const lowerMessage = message.toLowerCase();

    // Если спрашивают про конкретный курс - ищем его точно
    if (lowerMessage.includes('фундамент')) {
      const fundamentCourse = await prisma.course.findFirst({
        where: {
          name: { contains: 'Фундамент' }
        }
      });
      if (fundamentCourse) {
        return [fundamentCourse];
      }
    }

    // Фильтруем курсы в зависимости от классификации
    if (classification === 'beginner') {
      // Для новичков не показываем курсы, требующие опыта
      courses = courses.filter(course =>
        !course.name.toLowerCase().includes('с нуля') &&
        !course.name.toLowerCase().includes('фундамент') &&
        !course.name.toLowerCase().includes('наставник') &&
        !course.name.toLowerCase().includes('sointera') &&
        !course.name.toLowerCase().includes('парикмахер с нуля')
      );
    } else if (classification === 'experienced') {
      // Для ОПЫТНЫХ мастеров - убираем слишком простые курсы
      courses = courses.filter(course => {
        const isSimpleCourse =
          course.name.toLowerCase().includes('sointera') ||
          course.price < 15000;

        // Не показываем простые курсы опытным мастерам
        return !isSimpleCourse;
      });

      // Если после фильтрации мало курсов, добавляем подходящие
      if (courses.length < 2) {
        const advancedCourses = await prisma.course.findMany({
          where: {
            OR: [
              { name: { contains: 'Фундамент' } },
              { name: { contains: 'Наставник' } },
              { name: { contains: 'курс по стрижкам' } },
              { price: { gte: 35000 } }
            ]
          },
          orderBy: { price: 'asc' },
          take: 3
        });
        courses = [...courses, ...advancedCourses];
        // Убираем дубликаты
        courses = courses.filter((course, index, self) =>
          index === self.findIndex((c) => c.id === course.id)
        );
      }
    } else {
      // Для остальных (interested и т.д.) - фильтруем слишком простые курсы
      if (!lowerMessage.includes('sointera') && !lowerMessage.includes('соинтера')) {
        courses = courses.filter(course =>
          // Убираем слишком дешевые курсы из общих предложений
          course.price > 10000 ||
          lowerMessage.includes(course.name.toLowerCase())
        );
      }
    }

    // Если ничего не нашли по категориям, берем ближайшие курсы (но не для новичков)
    if (courses.length === 0 && classification !== 'beginner') {
      const nearestCourses = await prisma.course.findMany({
        where: {
          startDate: {
            gte: new Date()
          },
          // Не показываем слишком простые курсы в общих запросах
          price: { gte: 15000 }
        },
        orderBy: { startDate: 'asc' },
        take: 3 // Уменьшаем количество курсов
      });
      return nearestCourses;
    }

    // Ограничиваем количество курсов чтобы не перегружать клиента
    return courses.slice(0, 3);
  }

  formatCourseDate(date: Date | null | undefined): string {
    if (!date) return '';

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long'
    };
    return date.toLocaleDateString('ru-RU', options);
  }

  async generateResponse(
    message: string,
    courses: any[],
    context: CustomerContext,
    conversationHistory: any[]
  ): Promise<string> {
    // Форматируем информацию о курсах с датами
    const coursesInfo = courses.map(c => {
      const dateInfo = c.startDate ? `, начало ${this.formatCourseDate(c.startDate)}` : '';
      return `- ${c.name} (${c.format === 'online' ? 'онлайн' : 'офлайн'}${dateInfo}): ${c.price} руб. ${c.description || ''}`;
    }).join('\n');

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      {
        role: 'system' as const,
        content: `Доступные курсы для рекомендации:\n${coursesInfo || 'Используйте общую информацию о школе'}\n\nИстория диалога с клиентом доступна ниже для контекста.`
      }
    ];

    // Добавляем историю беседы
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Добавляем текущее сообщение
    messages.push({
      role: 'user' as const,
      content: message
    });

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1500
      });

      return completion.choices[0].message.content || 'Извините, не могу сформулировать ответ. Попробуйте переформулировать вопрос.';
    } catch (error) {
      console.error('Error generating response:', error);
      return 'Извините, произошла ошибка. Наш менеджер @natalylini свяжется с вами в ближайшее время.';
    }
  }

  async saveConversation(
    customerId: string,
    userMessage: string,
    assistantMessage: string,
    conversationId?: string
  ): Promise<string> {
    // Если есть conversationId и беседа активна, продолжаем её
    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (conversation && conversation.status === 'active') {
        // Добавляем новые сообщения в существующую беседу
        await prisma.message.createMany({
          data: [
            { conversationId, role: 'user', content: userMessage },
            { conversationId, role: 'assistant', content: assistantMessage }
          ]
        });

        // Обновляем время последнего обновления беседы
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });

        return conversationId;
      }
    }

    // Создаем новую беседу только если старой нет или она не активна
    const conversation = await prisma.conversation.create({
      data: {
        customerId,
        messages: {
          create: [
            { role: 'user', content: userMessage },
            { role: 'assistant', content: assistantMessage }
          ]
        }
      }
    });
    return conversation.id;
  }
}
