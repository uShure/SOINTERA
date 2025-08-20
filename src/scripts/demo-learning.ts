import { LearningSytem } from '../lib/ai/learning-system';

/**
 * 🎬 ДЕМОНСТРАЦИЯ СИСТЕМЫ САМООБУЧЕНИЯ
 *
 * Запуск: bun run src/scripts/demo-learning.ts
 */

async function demonstrateLearningSystem() {
  console.clear();
  console.log('🧠 ДЕМОНСТРАЦИЯ СИСТЕМЫ САМООБУЧЕНИЯ AI ПРОДАЖНИКА SOINTERA\n');

  const learningSystem = new LearningSytem();

  try {
    // 1. Инициализация системы
    console.log('🚀 1. ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await learningSystem.initialize();
    console.log('');

    // 2. Создание демо-данных
    console.log('📊 2. ГЕНЕРАЦИЯ ДЕМО-ДАННЫХ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await generateDemoData(learningSystem);
    console.log('');

    // 3. Анализ производительности
    console.log('📈 3. АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const summary = await learningSystem.getPerformanceSummary();
    console.log('Основные метрики:');
    console.log(`• Посетители: ${summary.summary.totalVisitors}`);
    console.log(`• Конверсия: ${summary.summary.overallConversion}`);
    console.log(`• Активных A/B тестов: ${summary.summary.activeABTests}`);
    console.log('');

    // 4. Запуск экспериментов
    console.log('🧪 4. ЗАПУСК A/B ЭКСПЕРИМЕНТОВ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const greetingTest = await learningSystem.startExperiment('greeting');
    console.log(`✅ Запущен тест приветствия: ${greetingTest}`);

    const pricingTest = await learningSystem.startExperiment('pricing');
    console.log(`✅ Запущен тест ценообразования: ${pricingTest}`);
    console.log('');

    // 5. Получение рекомендаций
    console.log('💡 5. РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const quickActions = await learningSystem.quickActions();
    const insights = await quickActions.getTopInsights();

    if (insights.length > 0) {
      insights.forEach((insight, i) => {
        console.log(`${i + 1}. ${insight.title}`);
        console.log(`   💰 Эффект: ${insight.expectedImpact}`);
        console.log(`   🎯 Действие: ${insight.recommendation}`);
        console.log('');
      });
    } else {
      console.log('Система накапливает данные для генерации рекомендаций...');
      console.log('');
    }

    // 6. Ежедневная сводка
    console.log('📋 6. ЕЖЕДНЕВНАЯ СВОДКА');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const dailySummary = await learningSystem.getDailySummary();
    console.log(dailySummary);

    // 7. Демонстрация быстрых действий
    console.log('⚡ 7. БЫСТРЫЕ ДЕЙСТВИЯ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 Запуск цикла обучения...');
    const learningResult = await quickActions.runLearningCycle();
    console.log(learningResult);

    console.log('🎯 Применение лучших практик...');
    const bestPractices = await quickActions.applyBestPractices();
    console.log(`✨ Найдено ${bestPractices.foundInsights} высокоэффективных рекомендаций`);
    console.log('');

    // 8. Заключение
    console.log('🎉 8. ЗАКЛЮЧЕНИЕ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Система самообучения успешно работает!');
    console.log('');
    console.log('🧠 ВОЗМОЖНОСТИ СИСТЕМЫ:');
    console.log('• Автоматический сбор метрик по каждому диалогу');
    console.log('• A/B тестирование промптов и подходов');
    console.log('• Анализ паттернов успешных продаж');
    console.log('• Сегментация клиентов по поведению');
    console.log('• Генерация рекомендаций по улучшению');
    console.log('• Автоматическая оптимизация воронки');
    console.log('');
    console.log('🚀 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Система будет учиться на каждом диалоге');
    console.log('2. A/B тесты покажут лучшие подходы');
    console.log('3. AI будет автоматически улучшаться');
    console.log('4. Конверсия будет расти со временем');

  } catch (error) {
    console.error('❌ Ошибка в демонстрации:', error);
  }
}

// Генерация демо-данных для демонстрации
async function generateDemoData(learningSystem: LearningSytem) {
  const analytics = learningSystem.getAnalytics();

  // Симулируем несколько сессий клиентов
  const demoCustomers = [
    { id: 'demo_customer_1', stage: 'qualification', outcome: 'progression' },
    { id: 'demo_customer_2', stage: 'presentation', outcome: 'interested' },
    { id: 'demo_customer_3', stage: 'pricing', outcome: 'objection' },
    { id: 'demo_customer_4', stage: 'closing', outcome: 'conversion' },
    { id: 'demo_customer_5', stage: 'qualification', outcome: 'dropout' }
  ];

  for (const customer of demoCustomers) {
    const sessionId = await analytics.startSession(customer.id, `conv_${customer.id}`);

    await analytics.trackFunnelProgress(
      customer.id,
      `conv_${customer.id}`,
      customer.stage,
      { outcome: customer.outcome }
    );

    if (customer.outcome === 'conversion') {
      await analytics.trackConversionEvent({
        customerId: customer.id,
        conversationId: `conv_${customer.id}`,
        stage: 'conversion',
        action: 'purchase',
        courseInterest: 'Фундамент',
        value: 39000
      });
    }

    await analytics.endSession(customer.id, customer.outcome);
  }

  console.log('✅ Созданы демо-данные для 5 клиентов');
  console.log('📊 Сгенерированы метрики воронки');
  console.log('🎯 Добавлены события конверсии');
}

// Запуск демонстрации
if (require.main === module) {
  demonstrateLearningSystem()
    .then(() => {
      console.log('\n🎬 Демонстрация завершена!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Ошибка демонстрации:', error);
      process.exit(1);
    });
}
