import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SessionMetrics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  customerId: string;
  funnelStage: string;
  messagesCount: number;
  outcome?: string;
  abTestGroup?: string;
}

export interface ConversionEvent {
  customerId: string;
  conversationId: string;
  stage: string;
  action: string;
  courseInterest?: string;
  value?: number;
}

export class AnalyticsService {
  private sessionStore = new Map<string, SessionMetrics>();

  // Начало сессии клиента
  async startSession(customerId: string, conversationId: string): Promise<string> {
    const sessionId = `${customerId}_${Date.now()}`;

    const session: SessionMetrics = {
      sessionId,
      startTime: new Date(),
      customerId,
      funnelStage: 'initial',
      messagesCount: 0
    };

    this.sessionStore.set(sessionId, session);
    return sessionId;
  }

  // Отслеживание прогресса по воронке
  async trackFunnelProgress(
    customerId: string,
    conversationId: string,
    stage: string,
    data?: any
  ): Promise<void> {
    try {
      // Обновляем разговор
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          funnelStage: stage,
          updatedAt: new Date()
        }
      });

      // Обновляем сессию
      const session = Array.from(this.sessionStore.values())
        .find(s => s.customerId === customerId);

      if (session) {
        session.funnelStage = stage;
        session.messagesCount++;
      }

      // Записываем событие конверсии
      await this.trackConversionEvent({
        customerId,
        conversationId,
        stage,
        action: 'funnel_progress',
        ...data
      });

      console.log(`🔄 Funnel progress: ${customerId} → ${stage}`);
    } catch (error) {
      console.error('Error tracking funnel progress:', error);
    }
  }

  // Отслеживание событий конверсии
  async trackConversionEvent(event: ConversionEvent): Promise<void> {
    try {
      // Обновляем метрики за сегодня
      await this.updateDailyMetrics(event);

      // Сохраняем аналитику клиента
      await this.saveCustomerAnalytics(event);

      console.log(`📊 Conversion event: ${event.action} for ${event.customerId}`);
    } catch (error) {
      console.error('Error tracking conversion event:', error);
    }
  }

  // Обновление ежедневных метрик
  private async updateDailyMetrics(event: ConversionEvent): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics = await prisma.funnelMetrics.findFirst({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (metrics) {
      // Обновляем существующие метрики
      const updateData: any = {};

      switch (event.stage) {
        case 'qualification':
          updateData.qualificationStage = { increment: 1 };
          break;
        case 'presentation':
          updateData.presentationStage = { increment: 1 };
          break;
        case 'pricing':
          updateData.pricingStage = { increment: 1 };
          break;
        case 'objection':
          updateData.objectionStage = { increment: 1 };
          break;
        case 'closing':
          updateData.closingStage = { increment: 1 };
          break;
        case 'conversion':
          updateData.conversions = { increment: 1 };
          break;
      }

      if (event.action === 'session_start') {
        updateData.totalVisitors = { increment: 1 };
      }

      await prisma.funnelMetrics.update({
        where: { id: metrics.id },
        data: updateData
      });
    } else {
      // Создаем новые метрики
      await prisma.funnelMetrics.create({
        data: {
          date: today,
          totalVisitors: event.action === 'session_start' ? 1 : 0,
          qualificationStage: event.stage === 'qualification' ? 1 : 0,
          presentationStage: event.stage === 'presentation' ? 1 : 0,
          pricingStage: event.stage === 'pricing' ? 1 : 0,
          objectionStage: event.stage === 'objection' ? 1 : 0,
          closingStage: event.stage === 'closing' ? 1 : 0,
          conversions: event.action === 'conversion' ? 1 : 0
        }
      });
    }
  }

  // Сохранение аналитики клиента
  private async saveCustomerAnalytics(event: ConversionEvent): Promise<void> {
    const session = Array.from(this.sessionStore.values())
      .find(s => s.customerId === event.customerId);

    if (!session) return;

    const sessionDuration = session.endTime
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : Math.floor((Date.now() - session.startTime.getTime()) / 1000);

    await prisma.customerAnalytics.create({
      data: {
        customerId: event.customerId,
        sessionDuration,
        messagesExchanged: session.messagesCount,
        funnelCompletionRate: this.calculateFunnelCompletion(session.funnelStage),
        responsePattern: this.analyzeResponsePattern(event.customerId),
        interestLevel: this.calculateInterestLevel(event),
        finalOutcome: event.action,
        courseInterest: event.courseInterest,
        priceReaction: event.stage === 'pricing' ? 'interested' : undefined
      }
    });
  }

  // Вычисление процента прохождения воронки
  private calculateFunnelCompletion(stage: string): number {
    const stageWeights: Record<string, number> = {
      'initial': 0,
      'qualification': 20,
      'presentation': 40,
      'pricing': 60,
      'objection': 80,
      'closing': 100
    };
    return stageWeights[stage] || 0;
  }

  // Анализ паттерна ответов клиента
  private analyzeResponsePattern(customerId: string): string {
    // Здесь можно анализировать типы ответов клиента
    // Пока возвращаем базовую версию
    return 'standard';
  }

  // Вычисление уровня заинтересованности
  private calculateInterestLevel(event: ConversionEvent): number {
    let interest = 3; // базовый уровень

    if (event.stage === 'presentation') interest += 1;
    if (event.stage === 'pricing') interest += 1;
    if (event.action === 'conversion') interest = 5;
    if (event.action === 'objection') interest -= 0.5;

    return Math.max(1, Math.min(5, interest));
  }

  // Завершение сессии
  async endSession(customerId: string, outcome: string): Promise<void> {
    const session = Array.from(this.sessionStore.values())
      .find(s => s.customerId === customerId);

    if (session) {
      session.endTime = new Date();
      session.outcome = outcome;

      // Удаляем из памяти
      this.sessionStore.delete(session.sessionId);
    }
  }

  // Получение метрик воронки за период
  async getFunnelMetrics(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await prisma.funnelMetrics.findMany({
      where: {
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Вычисляем общие показатели
    const totals = metrics.reduce((acc, m) => ({
      totalVisitors: acc.totalVisitors + m.totalVisitors,
      qualificationStage: acc.qualificationStage + m.qualificationStage,
      presentationStage: acc.presentationStage + m.presentationStage,
      pricingStage: acc.pricingStage + m.pricingStage,
      objectionStage: acc.objectionStage + m.objectionStage,
      closingStage: acc.closingStage + m.closingStage,
      conversions: acc.conversions + m.conversions
    }), {
      totalVisitors: 0,
      qualificationStage: 0,
      presentationStage: 0,
      pricingStage: 0,
      objectionStage: 0,
      closingStage: 0,
      conversions: 0
    });

    // Вычисляем конверсии между этапами
    const conversionRates = {
      qualificationRate: totals.totalVisitors > 0 ? totals.qualificationStage / totals.totalVisitors : 0,
      presentationRate: totals.qualificationStage > 0 ? totals.presentationStage / totals.qualificationStage : 0,
      pricingRate: totals.presentationStage > 0 ? totals.pricingStage / totals.presentationStage : 0,
      objectionRate: totals.pricingStage > 0 ? totals.objectionStage / totals.pricingStage : 0,
      closingRate: totals.objectionStage > 0 ? totals.closingStage / totals.objectionStage : 0,
      overallConversion: totals.totalVisitors > 0 ? totals.conversions / totals.totalVisitors : 0
    };

    return {
      metrics,
      totals,
      conversionRates,
      period: `${days} days`
    };
  }

  // Анализ эффективности промптов
  async analyzePromptPerformance(): Promise<any> {
    const prompts = await prisma.promptOptimization.findMany({
      where: { isActive: true }
    });

    return prompts.map(prompt => ({
      ...prompt,
      conversionRate: prompt.usageCount > 0 ? prompt.successfulUses / prompt.usageCount : 0,
      escalationRate: prompt.usageCount > 0 ? prompt.managerEscalations / prompt.usageCount : 0,
      avgEngagement: prompt.avgEngagement,
      recommendation: this.generatePromptRecommendation(prompt)
    }));
  }

  // Генерация рекомендаций по промпту
  private generatePromptRecommendation(prompt: any): string {
    if (prompt.conversionRate > 0.7) return 'Отличная производительность';
    if (prompt.conversionRate > 0.5) return 'Хорошая производительность';
    if (prompt.conversionRate > 0.3) return 'Требует оптимизации';
    return 'Нужна переработка';
  }

  // Поиск паттернов успешных диалогов
  async findSuccessPatterns(): Promise<any> {
    const successfulConversations = await prisma.conversation.findMany({
      where: {
        outcome: 'purchased'
      },
      include: {
        messages: true,
        customer: true
      }
    });

    // Анализируем паттерны
    const patterns = {
      avgMessagesBeforeConversion: 0,
      avgTimeToConversion: 0,
      commonCustomerTypes: {} as Record<string, number>,
      commonCourseInterests: {} as Record<string, number>,
      successfulPromptTypes: {} as Record<string, number>
    };

    successfulConversations.forEach(conv => {
      patterns.avgMessagesBeforeConversion += conv.messages.length;
      if (conv.conversionTime) patterns.avgTimeToConversion += conv.conversionTime;

      const customerType = conv.customer.classification || 'unknown';
      patterns.commonCustomerTypes[customerType] = (patterns.commonCustomerTypes[customerType] || 0) + 1;
    });

    patterns.avgMessagesBeforeConversion /= successfulConversations.length || 1;
    patterns.avgTimeToConversion /= successfulConversations.length || 1;

    return patterns;
  }

  // Генерация инсайтов для самообучения
  async generateLearningInsights(): Promise<void> {
    try {
      const patterns = await this.findSuccessPatterns();
      const promptPerformance = await this.analyzePromptPerformance();
      const funnelData = await this.getFunnelMetrics(30);

      // Инсайт по оптимальному количеству сообщений
      if (patterns.avgMessagesBeforeConversion > 0) {
        await prisma.learningInsights.create({
          data: {
            insightType: 'pattern',
            category: 'customer_behavior',
            title: 'Оптимальная длина диалога',
            description: `Успешные конверсии происходят в среднем за ${Math.round(patterns.avgMessagesBeforeConversion)} сообщений`,
            data: JSON.stringify(patterns),
            confidence: 0.8,
            recommendation: `Фокусироваться на закрытии сделки к ${Math.round(patterns.avgMessagesBeforeConversion)} сообщению`,
            expectedImpact: 0.15
          }
        });
      }

      // Инсайт по воронке
      if (funnelData.conversionRates.presentationRate < 0.6) {
        await prisma.learningInsights.create({
          data: {
            insightType: 'trend',
            category: 'funnel_optimization',
            title: 'Низкая конверсия на этапе презентации',
            description: `Только ${Math.round(funnelData.conversionRates.presentationRate * 100)}% клиентов переходят к этапу ценообразования`,
            data: JSON.stringify(funnelData.conversionRates),
            confidence: 0.9,
            recommendation: 'Улучшить качество презентации курсов',
            expectedImpact: 0.25
          }
        });
      }

      console.log('✨ Learning insights generated successfully');
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  }
}
