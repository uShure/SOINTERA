import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from './analytics-service';
import { ABTestingService } from './ab-testing-service';

const prisma = new PrismaClient();

export interface LearningPattern {
  pattern: string;
  confidence: number;
  examples: string[];
  recommendation: string;
  impact: number;
}

export interface CustomerSegment {
  name: string;
  characteristics: string[];
  size: number;
  conversionRate: number;
  preferredApproach: string;
}

export class LearningEngine {
  private analyticsService: AnalyticsService;
  private abTestingService: ABTestingService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.abTestingService = new ABTestingService();
  }

  // Основная функция обучения - запускается периодически
  async performLearningCycle(): Promise<void> {
    console.log('🧠 Starting learning cycle...');

    try {
      // 1. Анализируем паттерны успешных диалогов
      const successPatterns = await this.analyzeSuccessPatterns();

      // 2. Сегментируем клиентов
      const customerSegments = await this.segmentCustomers();

      // 3. Оптимизируем промпты
      const promptOptimizations = await this.optimizePrompts();

      // 4. Генерируем инсайты
      const insights = await this.generateActionableInsights(
        successPatterns,
        customerSegments,
        promptOptimizations
      );

      // 5. Применяем автоматические улучшения
      await this.applyAutomaticImprovements(insights);

      console.log('✅ Learning cycle completed successfully');
    } catch (error) {
      console.error('❌ Error in learning cycle:', error);
    }
  }

  // Анализ паттернов успешных диалогов
  async analyzeSuccessPatterns(): Promise<LearningPattern[]> {
    const successfulConversations = await prisma.conversation.findMany({
      where: { outcome: 'purchased' },
      include: {
        messages: true,
        customer: true
      }
    });

    const patterns: LearningPattern[] = [];

    // Паттерн 1: Оптимальная длина диалога
    const messageCounts = successfulConversations.map(c => c.messages.length);
    const avgMessages = messageCounts.reduce((sum, count) => sum + count, 0) / messageCounts.length;

    if (avgMessages > 0) {
      patterns.push({
        pattern: 'optimal_conversation_length',
        confidence: 0.8,
        examples: [`Успешные диалоги: ${Math.round(avgMessages)} сообщений в среднем`],
        recommendation: `Стремиться к завершению продажи за ${Math.round(avgMessages)} сообщений`,
        impact: 0.15
      });
    }

    // Паттерн 2: Ключевые слова в успешных диалогах
    const successfulMessages = successfulConversations
      .flatMap(c => c.messages.filter(m => m.role === 'user'))
      .map(m => m.content.toLowerCase());

    const keywordFrequency = this.analyzeKeywords(successfulMessages);
    const topKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    if (topKeywords.length > 0) {
      patterns.push({
        pattern: 'success_keywords',
        confidence: 0.7,
        examples: topKeywords.map(([word, freq]) => `"${word}": ${freq} раз`),
        recommendation: 'Обращать внимание на эти ключевые слова при классификации',
        impact: 0.12
      });
    }

    // Паттерн 3: Время до конверсии
    const conversionTimes = successfulConversations
      .filter(c => c.conversionTime)
      .map(c => c.conversionTime!);

    if (conversionTimes.length > 0) {
      const avgTime = conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length;

      patterns.push({
        pattern: 'optimal_conversion_time',
        confidence: 0.75,
        examples: [`Средний время до покупки: ${Math.round(avgTime)} минут`],
        recommendation: 'Активнее работать с клиентами, которые медлят с решением',
        impact: 0.18
      });
    }

    return patterns;
  }

  // Анализ ключевых слов
  private analyzeKeywords(messages: string[]): Record<string, number> {
    const keywords: Record<string, number> = {};
    const importantWords = [
      'опыт', 'лет', 'работаю', 'мастер', 'салон', 'клиенты',
      'учиться', 'курс', 'обучение', 'навыки', 'техника',
      'цена', 'стоимость', 'рассрочка', 'оплата',
      'время', 'когда', 'начало', 'старт',
      'сертификат', 'диплом', 'практика'
    ];

    messages.forEach(message => {
      importantWords.forEach(word => {
        if (message.includes(word)) {
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    });

    return keywords;
  }

  // Сегментация клиентов
  async segmentCustomers(): Promise<CustomerSegment[]> {
    const customers = await prisma.customer.findMany({
      include: {
        conversations: true,
        analytics: true
      }
    });

    const segments: Record<string, any> = {};

    customers.forEach(customer => {
      const key = this.determineCustomerSegment(customer);

      if (!segments[key]) {
        segments[key] = {
          name: key,
          customers: [],
          totalConversions: 0,
          totalInteractions: 0
        };
      }

      segments[key].customers.push(customer);
      segments[key].totalInteractions++;

      if (customer.conversations.some(c => c.outcome === 'purchased')) {
        segments[key].totalConversions++;
      }
    });

    return Object.values(segments).map(segment => ({
      name: segment.name,
      characteristics: this.getSegmentCharacteristics(segment.name),
      size: segment.customers.length,
      conversionRate: segment.totalInteractions > 0 ? segment.totalConversions / segment.totalInteractions : 0,
      preferredApproach: this.getPreferredApproach(segment.name)
    }));
  }

  // Определение сегмента клиента
  private determineCustomerSegment(customer: any): string {
    const classification = customer.classification || 'unknown';
    const hasExperience = customer.totalInteractions > 3;

    if (classification === 'beginner') return 'beginners';
    if (classification === 'experienced' && hasExperience) return 'experienced_engaged';
    if (classification === 'experienced') return 'experienced_new';
    if (classification === 'ready_to_buy') return 'hot_leads';

    return 'general';
  }

  // Характеристики сегмента
  private getSegmentCharacteristics(segment: string): string[] {
    const characteristics: Record<string, string[]> = {
      beginners: ['Нет опыта', 'Ищет базовое обучение', 'Осторожен с инвестициями'],
      experienced_engaged: ['Опытный мастер', 'Активно ищет улучшения', 'Готов инвестировать'],
      experienced_new: ['Имеет опыт', 'Первый контакт', 'Изучает варианты'],
      hot_leads: ['Готов к покупке', 'Конкретные запросы', 'Нужна быстрая обработка'],
      general: ['Общий интерес', 'Требует квалификации', 'Стандартный подход']
    };

    return characteristics[segment] || ['Неопределенный сегмент'];
  }

  // Предпочтительный подход
  private getPreferredApproach(segment: string): string {
    const approaches: Record<string, string> = {
      beginners: 'Образовательный подход, акцент на базе',
      experienced_engaged: 'Прямой профессиональный подход',
      experienced_new: 'Консультативный подход с вопросами',
      hot_leads: 'Быстрое закрытие, минимум воды',
      general: 'Универсальная воронка с квалификацией'
    };

    return approaches[segment] || 'Стандартный подход';
  }

  // Оптимизация промптов
  async optimizePrompts(): Promise<any[]> {
    const prompts = await prisma.promptOptimization.findMany({
      where: { isActive: true }
    });

    const optimizations = [];

    for (const prompt of prompts) {
      const analysis = await this.analyzePromptPerformance(prompt);

      if (analysis.needsOptimization) {
        const suggestion = await this.generatePromptSuggestion(prompt, analysis);
        optimizations.push(suggestion);
      }
    }

    return optimizations;
  }

  // Анализ производительности промпта
  private async analyzePromptPerformance(prompt: any): Promise<any> {
    const conversionRate = prompt.usageCount > 0 ? prompt.successfulUses / prompt.usageCount : 0;
    const escalationRate = prompt.usageCount > 0 ? prompt.managerEscalations / prompt.usageCount : 0;

    return {
      needsOptimization: conversionRate < 0.3 || escalationRate > 0.5,
      conversionRate,
      escalationRate,
      issues: [
        ...(conversionRate < 0.3 ? ['Низкая конверсия'] : []),
        ...(escalationRate > 0.5 ? ['Частые эскалации'] : []),
        ...(prompt.avgEngagement < 3 ? ['Низкая вовлеченность'] : [])
      ]
    };
  }

  // Генерация предложений по улучшению промпта
  private async generatePromptSuggestion(prompt: any, analysis: any): Promise<any> {
    let suggestions = [];

    if (analysis.conversionRate < 0.3) {
      suggestions.push('Добавить больше убедительных аргументов');
      suggestions.push('Упростить язык и структуру');
    }

    if (analysis.escalationRate > 0.5) {
      suggestions.push('Добавить больше детальной информации');
      suggestions.push('Предусмотреть частые вопросы');
    }

    if (prompt.avgEngagement < 3) {
      suggestions.push('Сделать более интерактивным');
      suggestions.push('Добавить эмоциональную составляющую');
    }

    return {
      promptId: prompt.id,
      currentPerformance: analysis,
      suggestions,
      priority: this.calculateOptimizationPriority(analysis)
    };
  }

  // Расчет приоритета оптимизации
  private calculateOptimizationPriority(analysis: any): 'high' | 'medium' | 'low' {
    if (analysis.conversionRate < 0.2) return 'high';
    if (analysis.escalationRate > 0.6) return 'high';
    if (analysis.conversionRate < 0.3 || analysis.escalationRate > 0.4) return 'medium';
    return 'low';
  }

  // Генерация действенных инсайтов
  async generateActionableInsights(
    patterns: LearningPattern[],
    segments: CustomerSegment[],
    optimizations: any[]
  ): Promise<any[]> {
    const insights = [];

    // Инсайт по сегментам
    const bestSegment = segments.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );

    if (bestSegment.conversionRate > 0.5) {
      insights.push({
        type: 'customer_segment',
        title: `Высококонвертирующий сегмент: ${bestSegment.name}`,
        description: `Сегмент "${bestSegment.name}" показывает конверсию ${(bestSegment.conversionRate * 100).toFixed(1)}%`,
        action: `Адаптировать подход под характеристики этого сегмента`,
        expectedImpact: 0.2,
        priority: 'high'
      });
    }

    // Инсайты по паттернам
    patterns.forEach(pattern => {
      if (pattern.confidence > 0.7 && pattern.impact > 0.15) {
        insights.push({
          type: 'behavioral_pattern',
          title: `Паттерн: ${pattern.pattern}`,
          description: pattern.examples.join(', '),
          action: pattern.recommendation,
          expectedImpact: pattern.impact,
          priority: pattern.impact > 0.2 ? 'high' : 'medium'
        });
      }
    });

    // Инсайты по оптимизации промптов
    const highPriorityOptimizations = optimizations.filter(opt => opt.priority === 'high');
    if (highPriorityOptimizations.length > 0) {
      insights.push({
        type: 'prompt_optimization',
        title: `Критические промпты требуют оптимизации`,
        description: `${highPriorityOptimizations.length} промптов показывают низкую эффективность`,
        action: 'Запустить A/B тесты для улучшения критических промптов',
        expectedImpact: 0.25,
        priority: 'high'
      });
    }

    // Сохраняем инсайты в базу
    for (const insight of insights) {
      await prisma.learningInsights.create({
        data: {
          insightType: insight.type,
          category: 'auto_generated',
          title: insight.title,
          description: insight.description,
          data: JSON.stringify(insight),
          confidence: 0.85,
          recommendation: insight.action,
          expectedImpact: insight.expectedImpact
        }
      });
    }

    return insights;
  }

  // Применение автоматических улучшений
  async applyAutomaticImprovements(insights: any[]): Promise<void> {
    for (const insight of insights) {
      if (insight.priority === 'high' && insight.expectedImpact > 0.2) {
        await this.implementImprovement(insight);
      }
    }
  }

  // Реализация конкретного улучшения
  private async implementImprovement(insight: any): Promise<void> {
    switch (insight.type) {
      case 'prompt_optimization':
        await this.createOptimizationABTest(insight);
        break;

      case 'customer_segment':
        await this.updateSegmentationRules(insight);
        break;

      case 'behavioral_pattern':
        await this.adjustConversationFlow(insight);
        break;
    }

    console.log(`🔧 Applied improvement: ${insight.title}`);
  }

  // Создание A/B теста для оптимизации
  private async createOptimizationABTest(insight: any): Promise<void> {
    // Находим промпт с низкой эффективностью
    const poorPrompts = await prisma.promptOptimization.findMany({
      where: {
        isActive: true,
        conversionRate: { lt: 0.3 }
      },
      orderBy: { conversionRate: 'asc' },
      take: 1
    });

    if (poorPrompts.length > 0) {
      const originalPrompt = poorPrompts[0];
      const improvedPrompt = await this.generateImprovedPrompt(originalPrompt);

      await this.abTestingService.createABTest(
        `auto_optimization_${originalPrompt.id}`,
        'Автоматическая оптимизация промпта с низкой конверсией',
        [
          {
            name: 'Original',
            prompt: originalPrompt.promptText,
            weight: 50
          },
          {
            name: 'Improved',
            prompt: improvedPrompt,
            weight: 50
          }
        ]
      );
    }
  }

  // Генерация улучшенного промпта
  private async generateImprovedPrompt(originalPrompt: any): Promise<string> {
    // Здесь можно интегрировать более продвинутые алгоритмы
    // Пока делаем базовые улучшения

    let improved = originalPrompt.promptText;

    // Добавляем эмоциональные триггеры
    if (!improved.includes('!') && !improved.includes('😊')) {
      improved = improved + ' Буду рада помочь! 😊';
    }

    // Добавляем социальные доказательства
    if (!improved.includes('тысяч') && !improved.includes('мастер')) {
      improved = 'Более 5000 мастеров уже выбрали наши курсы. ' + improved;
    }

    // Делаем более конкретным
    if (!improved.includes('конкретно') && !improved.includes('именно')) {
      improved = improved.replace('курс', 'именно тот курс');
    }

    return improved;
  }

  // Обновление правил сегментации
  private async updateSegmentationRules(insight: any): Promise<void> {
    // Сохраняем новые правила сегментации
    await prisma.learningInsights.create({
      data: {
        insightType: 'segmentation_rule',
        category: 'customer_behavior',
        title: 'Обновленные правила сегментации',
        description: `Оптимизированы правила для сегмента: ${insight.title}`,
        data: JSON.stringify({
          segment: insight.title,
          newRules: insight.action
        }),
        confidence: 0.9,
        isApplied: true,
        appliedAt: new Date()
      }
    });
  }

  // Корректировка потока разговора
  private async adjustConversationFlow(insight: any): Promise<void> {
    // Создаем рекомендацию по изменению логики
    await prisma.learningInsights.create({
      data: {
        insightType: 'flow_adjustment',
        category: 'conversation_optimization',
        title: 'Корректировка потока диалога',
        description: `Изменение логики на основе паттерна: ${insight.title}`,
        data: JSON.stringify(insight),
        confidence: 0.8,
        recommendation: 'Внедрить в логику sales-agent.ts',
        isApplied: false
      }
    });
  }

  // Получение рекомендаций для разработчика
  async getDeveloperRecommendations(): Promise<any[]> {
    const insights = await prisma.learningInsights.findMany({
      where: {
        isApplied: false,
        confidence: { gte: 0.8 }
      },
      orderBy: { expectedImpact: 'desc' },
      take: 10
    });

    return insights.map(insight => ({
      title: insight.title,
      description: insight.description,
      recommendation: insight.recommendation,
      expectedImpact: `+${((insight.expectedImpact || 0) * 100).toFixed(1)}% конверсии`,
      confidence: `${(insight.confidence * 100).toFixed(0)}%`,
      category: insight.category,
      data: JSON.parse(insight.data || '{}')
    }));
  }

  // Ежедневный анализ
  async performDailyAnalysis(): Promise<void> {
    console.log('📊 Performing daily analysis...');

    // Генерируем инсайты
    await this.analyticsService.generateLearningInsights();

    // Проверяем A/B тесты
    const activeTests = await this.abTestingService.getActiveTests();
    for (const test of activeTests) {
      const results = await this.abTestingService.getTestResults(test.id);
      const totalParticipants = results.reduce((sum, r) => sum + r.participants, 0);

      // Если набрали достаточно данных, определяем победителя
      if (totalParticipants > 100) {
        await this.abTestingService.determineWinner(test.id);
      }
    }

    console.log('✅ Daily analysis completed');
  }
}
