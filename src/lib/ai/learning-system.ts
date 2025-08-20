import { SalesAgent } from './sales-agent';
import { AnalyticsService } from './analytics-service';
import { ABTestingService } from './ab-testing-service';
import { LearningEngine } from './learning-engine';

/**
 * 🧠 SMART LEARNING SYSTEM
 *
 * Единая система самообучения AI продажника SOINTERA
 * Интегрирует: аналитику, A/B тесты, машинное обучение
 */
export class LearningSytem {
  private salesAgent: SalesAgent;
  private analyticsService: AnalyticsService;
  private abTestingService: ABTestingService;
  private learningEngine: LearningEngine;

  constructor() {
    this.salesAgent = new SalesAgent();
    this.analyticsService = new AnalyticsService();
    this.abTestingService = new ABTestingService();
    this.learningEngine = new LearningEngine();
  }

  // 🚀 Инициализация системы самообучения
  async initialize(): Promise<void> {
    console.log('🧠 Initializing Smart Learning System...');

    try {
      // Создаем базовые A/B тесты
      await this.abTestingService.createDefaultTests();

      // Инициализируем аналитику
      console.log('📊 Analytics system ready');

      // Запускаем первый цикл обучения
      await this.learningEngine.performLearningCycle();

      console.log('✅ Smart Learning System initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing learning system:', error);
    }
  }

  // 📈 Получение сводки производительности
  async getPerformanceSummary(): Promise<any> {
    const [
      funnelMetrics,
      promptPerformance,
      activeTests,
      insights
    ] = await Promise.all([
      this.analyticsService.getFunnelMetrics(7),
      this.analyticsService.analyzePromptPerformance(),
      this.abTestingService.getActiveTests(),
      this.learningEngine.getDeveloperRecommendations()
    ]);

    return {
      summary: {
        totalVisitors: funnelMetrics.totals.totalVisitors,
        overallConversion: `${(funnelMetrics.conversionRates.overallConversion * 100).toFixed(1)}%`,
        activeABTests: activeTests.length,
        pendingRecommendations: insights.length
      },
      funnelHealth: {
        qualificationRate: `${(funnelMetrics.conversionRates.qualificationRate * 100).toFixed(1)}%`,
        presentationRate: `${(funnelMetrics.conversionRates.presentationRate * 100).toFixed(1)}%`,
        pricingRate: `${(funnelMetrics.conversionRates.pricingRate * 100).toFixed(1)}%`,
        closingRate: `${(funnelMetrics.conversionRates.closingRate * 100).toFixed(1)}%`
      },
      topRecommendations: insights.slice(0, 3),
      activeExperiments: activeTests.map(test => ({
        name: test.name,
        participants: test.participantsA + test.participantsB + test.participantsC,
        status: test.isActive ? 'Running' : 'Completed'
      }))
    };
  }

  // 🎯 Запуск конкретного эксперимента
  async startExperiment(experimentType: 'greeting' | 'pricing' | 'objection'): Promise<string> {
    switch (experimentType) {
      case 'greeting':
        return await this.abTestingService.createABTest(
          `greeting_experiment_${Date.now()}`,
          'Тест различных подходов к приветствию',
          [
            {
              name: 'Professional',
              prompt: 'Здравствуйте! Вы заинтересовались нашими курсами, верно? Давайте обсудим ваши потребности.',
              weight: 50
            },
            {
              name: 'Friendly',
              prompt: 'Привет! 👋 Отлично, что решили развиваться в парикмахерском искусстве! Расскажите о своих целях?',
              weight: 50
            }
          ]
        );

      case 'pricing':
        return await this.abTestingService.createABTest(
          `pricing_experiment_${Date.now()}`,
          'Тест различных способов презентации цены',
          [
            {
              name: 'Value_First',
              prompt: 'Этот курс поможет увеличить ваш доход на 40-60%. Инвестиция составляет 39.000₽.',
              weight: 50
            },
            {
              name: 'Price_First',
              prompt: 'Стоимость курса 39.000₽. Доступна рассрочка на 12 месяцев без процентов.',
              weight: 50
            }
          ]
        );

      case 'objection':
        return await this.abTestingService.createABTest(
          `objection_experiment_${Date.now()}`,
          'Тест обработки возражений по времени',
          [
            {
              name: 'Empathy_First',
              prompt: 'Понимаю, у всех сейчас высокий темп жизни. Наш курс как раз создан для занятых людей...',
              weight: 50
            },
            {
              name: 'Facts_First',
              prompt: 'Курс занимает всего 2 часа в неделю - это меньше времени, чем один фильм. При этом...',
              weight: 50
            }
          ]
        );

      default:
        throw new Error('Unknown experiment type');
    }
  }

  // 📊 Ежедневная сводка для разработчика
  async getDailySummary(): Promise<string> {
    const summary = await this.getPerformanceSummary();

    return `
🧠 AI ПРОДАЖНИК - ЕЖЕДНЕВНАЯ СВОДКА

📈 ОСНОВНЫЕ МЕТРИКИ:
• Посетители: ${summary.summary.totalVisitors}
• Конверсия: ${summary.summary.overallConversion}
• Активных тестов: ${summary.summary.activeABTests}

🎯 ЗДОРОВЬЕ ВОРОНКИ:
• Квалификация: ${summary.funnelHealth.qualificationRate}
• Презентация: ${summary.funnelHealth.presentationRate}
• Ценообразование: ${summary.funnelHealth.pricingRate}
• Закрытие: ${summary.funnelHealth.closingRate}

💡 ТОП РЕКОМЕНДАЦИИ:
${summary.topRecommendations.map(r => `• ${r.title} (ожидаемый эффект: ${r.expectedImpact})`).join('\n')}

🧪 АКТИВНЫЕ ЭКСПЕРИМЕНТЫ:
${summary.activeExperiments.map(e => `• ${e.name}: ${e.participants} участников`).join('\n')}
`;
  }

  // ⚡ Быстрые действия для разработчика
  async quickActions(): Promise<any> {
    return {
      // Запустить цикл обучения
      runLearningCycle: async () => {
        console.log('🔄 Starting learning cycle...');
        await this.learningEngine.performLearningCycle();
        return '✅ Learning cycle completed';
      },

      // Получить лучшие инсайты
      getTopInsights: async () => {
        const insights = await this.learningEngine.getDeveloperRecommendations();
        return insights.slice(0, 5);
      },

      // Завершить плохие тесты
      stopPoorPerformingTests: async () => {
        const activeTests = await this.abTestingService.getActiveTests();
        let stopped = 0;

        for (const test of activeTests) {
          const results = await this.abTestingService.getTestResults(test.id);
          const totalParticipants = results.reduce((sum, r) => sum + r.participants, 0);

          // Если тест длится долго, но конверсия низкая
          if (totalParticipants > 50) {
            const avgConversion = results.reduce((sum, r) => sum + r.conversionRate, 0) / results.length;

            if (avgConversion < 0.1) { // Менее 10% конверсии
              await this.abTestingService.stopTest(test.id);
              stopped++;
            }
          }
        }

        return `🛑 Stopped ${stopped} poor performing tests`;
      },

      // Применить лучшие практики
      applyBestPractices: async () => {
        await this.learningEngine.performLearningCycle();
        const insights = await this.learningEngine.getDeveloperRecommendations();
        const highImpact = insights.filter(i => parseFloat(i.expectedImpact.replace('%', '')) > 15);

        return {
          foundInsights: highImpact.length,
          recommendations: highImpact.map(i => ({
            title: i.title,
            action: i.recommendation,
            impact: i.expectedImpact
          }))
        };
      }
    };
  }

  // 🎓 Обучение AI на новых данных
  async trainOnNewData(): Promise<void> {
    console.log('🎓 Training AI on new conversation data...');

    // Анализируем последние успешные диалоги
    await this.learningEngine.performLearningCycle();

    // Оптимизируем промпты
    const recommendations = await this.learningEngine.getDeveloperRecommendations();

    console.log(`✨ Generated ${recommendations.length} improvement recommendations`);
  }

  // 📱 Простой API для использования в боте
  getSalesAgent(): SalesAgent {
    return this.salesAgent;
  }

  getAnalytics(): AnalyticsService {
    return this.analyticsService;
  }

  getABTesting(): ABTestingService {
    return this.abTestingService;
  }

  getLearningEngine(): LearningEngine {
    return this.learningEngine;
  }
}
