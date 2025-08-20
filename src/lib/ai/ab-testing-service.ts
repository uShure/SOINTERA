import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ABTestVariant {
  name: string;
  prompt: string;
  weight: number; // процент трафика
}

export interface ABTestResult {
  variant: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  significance: number;
}

export class ABTestingService {
  // Создание нового A/B теста
  async createABTest(
    name: string,
    description: string,
    variants: ABTestVariant[]
  ): Promise<string> {
    try {
      const test = await prisma.aBTest.create({
        data: {
          name,
          description,
          variantA: variants[0]?.prompt || '',
          variantB: variants[1]?.prompt || '',
          variantC: variants[2]?.prompt || null,
          trafficSplit: variants.map(v => v.weight).join(','),
          isActive: true
        }
      });

      console.log(`🧪 A/B Test created: ${name} (ID: ${test.id})`);
      return test.id;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  // Получение варианта для клиента
  async getVariantForCustomer(customerId: string, testName?: string): Promise<{
    variant: string;
    prompt: string;
    testId: string;
  }> {
    try {
      // Найти активный тест
      const test = testName
        ? await prisma.aBTest.findFirst({
            where: { name: testName, isActive: true }
          })
        : await prisma.aBTest.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          });

      if (!test) {
        // Возвращаем базовый вариант если тестов нет
        return {
          variant: 'A',
          prompt: this.getDefaultPrompt(),
          testId: 'default'
        };
      }

      // Определяем вариант на основе customerID
      const variant = this.assignVariant(customerId, test);
      const prompt = this.getPromptForVariant(test, variant);

      // Увеличиваем счетчик участников
      await this.incrementParticipant(test.id, variant);

      return {
        variant,
        prompt,
        testId: test.id
      };
    } catch (error) {
      console.error('Error getting variant:', error);
      return {
        variant: 'A',
        prompt: this.getDefaultPrompt(),
        testId: 'default'
      };
    }
  }

  // Назначение варианта клиенту
  private assignVariant(customerId: string, test: any): string {
    // Используем hash от customerId для стабильного назначения
    const hash = this.hashString(customerId);
    const splits = test.trafficSplit.split(',').map(Number);

    const totalWeight = splits.reduce((sum, weight) => sum + weight, 0);
    const normalized = hash % totalWeight;

    let cumulative = 0;
    if (normalized < (cumulative += splits[0])) return 'A';
    if (normalized < (cumulative += splits[1])) return 'B';
    if (splits[2] && normalized < (cumulative += splits[2])) return 'C';

    return 'A'; // fallback
  }

  // Простая hash функция
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Получение промпта для варианта
  private getPromptForVariant(test: any, variant: string): string {
    switch (variant) {
      case 'A': return test.variantA;
      case 'B': return test.variantB;
      case 'C': return test.variantC || test.variantA;
      default: return test.variantA;
    }
  }

  // Увеличение счетчика участников
  private async incrementParticipant(testId: string, variant: string): Promise<void> {
    const updateField = variant === 'A' ? 'participantsA' :
                       variant === 'B' ? 'participantsB' : 'participantsC';

    await prisma.aBTest.update({
      where: { id: testId },
      data: { [updateField]: { increment: 1 } }
    });
  }

  // Фиксация конверсии
  async recordConversion(customerId: string, testId: string, variant: string): Promise<void> {
    try {
      if (testId === 'default') return;

      const updateField = variant === 'A' ? 'conversionsA' :
                         variant === 'B' ? 'conversionsB' : 'conversionsC';

      await prisma.aBTest.update({
        where: { id: testId },
        data: { [updateField]: { increment: 1 } }
      });

      // Обновляем conversion rate
      await this.updateConversionRates(testId);

      console.log(`📈 Conversion recorded: ${variant} for test ${testId}`);
    } catch (error) {
      console.error('Error recording conversion:', error);
    }
  }

  // Обновление conversion rates
  private async updateConversionRates(testId: string): Promise<void> {
    const test = await prisma.aBTest.findUnique({ where: { id: testId } });
    if (!test) return;

    const conversionRateA = test.participantsA > 0 ? test.conversionsA / test.participantsA : 0;
    const conversionRateB = test.participantsB > 0 ? test.conversionsB / test.participantsB : 0;
    const conversionRateC = test.participantsC > 0 ? test.conversionsC / test.participantsC : 0;

    await prisma.aBTest.update({
      where: { id: testId },
      data: {
        conversionRateA,
        conversionRateB,
        conversionRateC
      }
    });
  }

  // Получение результатов теста
  async getTestResults(testId: string): Promise<ABTestResult[]> {
    const test = await prisma.aBTest.findUnique({ where: { id: testId } });
    if (!test) return [];

    const results: ABTestResult[] = [
      {
        variant: 'A',
        participants: test.participantsA,
        conversions: test.conversionsA,
        conversionRate: test.conversionRateA,
        significance: 0
      },
      {
        variant: 'B',
        participants: test.participantsB,
        conversions: test.conversionsB,
        conversionRate: test.conversionRateB,
        significance: 0
      }
    ];

    if (test.variantC) {
      results.push({
        variant: 'C',
        participants: test.participantsC,
        conversions: test.conversionsC,
        conversionRate: test.conversionRateC,
        significance: 0
      });
    }

    // Вычисляем статистическую значимость
    results.forEach((result, index) => {
      if (index > 0) {
        result.significance = this.calculateSignificance(
          results[0], // базовый вариант A
          result
        );
      }
    });

    return results;
  }

  // Вычисление статистической значимости
  private calculateSignificance(control: ABTestResult, variant: ABTestResult): number {
    // Простая z-test формула
    const p1 = control.conversionRate;
    const p2 = variant.conversionRate;
    const n1 = control.participants;
    const n2 = variant.participants;

    if (n1 < 30 || n2 < 30) return 0; // Недостаточно данных

    const p = (control.conversions + variant.conversions) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));

    if (se === 0) return 0;

    const z = Math.abs(p1 - p2) / se;

    // Приблизительная конверсия z-score в p-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    return Math.max(0, Math.min(1, 1 - pValue));
  }

  // Функция нормального распределения (приблизительная)
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  // Определение победителя теста
  async determineWinner(testId: string, minSignificance: number = 0.95): Promise<string | null> {
    const results = await this.getTestResults(testId);

    let winner = results[0]; // базовый A
    let hasSignificantWinner = false;

    results.forEach(result => {
      if (result.conversionRate > winner.conversionRate &&
          result.significance >= minSignificance) {
        winner = result;
        hasSignificantWinner = true;
      }
    });

    if (hasSignificantWinner) {
      // Сохраняем победителя в базе
      await prisma.aBTest.update({
        where: { id: testId },
        data: { winner: winner.variant }
      });

      console.log(`🏆 Test winner determined: Variant ${winner.variant} with ${(winner.conversionRate * 100).toFixed(2)}% conversion rate`);
      return winner.variant;
    }

    return null; // Нет статистически значимого победителя
  }

  // Завершение теста
  async stopTest(testId: string): Promise<void> {
    await prisma.aBTest.update({
      where: { id: testId },
      data: {
        isActive: false,
        endDate: new Date()
      }
    });

    const winner = await this.determineWinner(testId);
    if (winner) {
      // Применяем лучший промпт
      await this.applyWinningPrompt(testId, winner);
    }
  }

  // Применение выигравшего промпта
  private async applyWinningPrompt(testId: string, winner: string): Promise<void> {
    const test = await prisma.aBTest.findUnique({ where: { id: testId } });
    if (!test) return;

    const winningPrompt = this.getPromptForVariant(test, winner);

    // Создаем новую оптимизацию промпта
    await prisma.promptOptimization.create({
      data: {
        promptType: 'qualification', // или определяем автоматически
        promptText: winningPrompt,
        version: `ab_test_${testId}_${winner}`,
        conversionRate: winner === 'A' ? test.conversionRateA :
                       winner === 'B' ? test.conversionRateB : test.conversionRateC,
        usageCount: winner === 'A' ? test.participantsA :
                   winner === 'B' ? test.participantsB : test.participantsC,
        successfulUses: winner === 'A' ? test.conversionsA :
                       winner === 'B' ? test.conversionsB : test.conversionsC,
        isActive: true
      }
    });

    console.log(`✅ Winning prompt applied from test ${testId}`);
  }

  // Получение всех активных тестов
  async getActiveTests(): Promise<any[]> {
    return await prisma.aBTest.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Получение базового промпта (fallback)
  private getDefaultPrompt(): string {
    return `Здравствуйте! Вы заинтересовались нашими курсами, верно?

Давайте я вам задам несколько вопросов, чтобы понять, какой именно курс будет вам полезен, затем расскажу подробнее о программе и стоимости, если все понравится, то помогу занять место, хорошо?

Расскажите о себе:
- Как давно вы занимаетесь стрижками/колористикой?
- Чего вам не хватает на практике?

Расскажите все, что посчитаете нужным.`;
  }

  // Создание предустановленных тестов
  async createDefaultTests(): Promise<void> {
    // Тест 1: Разные подходы к приветствию
    await this.createABTest(
      'greeting_approach',
      'Тестируем разные подходы к первому контакту',
      [
        {
          name: 'Formal',
          prompt: 'Здравствуйте! Вы заинтересовались нашими курсами, верно? Давайте я вам задам несколько вопросов...',
          weight: 50
        },
        {
          name: 'Friendly',
          prompt: 'Привет! 👋 Какой классный выбор - изучать парикмахерское искусство! Расскажите, что вас привело к нам?',
          weight: 50
        }
      ]
    );

    // Тест 2: Разные способы презентации цены
    await this.createABTest(
      'pricing_presentation',
      'Тестируем подачу ценообразования',
      [
        {
          name: 'Direct',
          prompt: 'Стоимость курса составляет 39.000₽. Есть варианты рассрочки.',
          weight: 33
        },
        {
          name: 'Value_First',
          prompt: 'За 2 месяца вы освоите все 11 базовых форм стрижек и сможете поднять цену на свои услуги. Инвестиция в курс - 39.000₽.',
          weight: 33
        },
        {
          name: 'Social_Proof',
          prompt: 'Уже 5000+ мастеров прошли этот курс и увеличили доход на 40-60%. Стоимость 39.000₽, но окупается за первый месяц работы.',
          weight: 34
        }
      ]
    );

    console.log('🧪 Default A/B tests created');
  }
}
