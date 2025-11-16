import { PrismaClient } from '@prisma/client';
import { AuditResult } from '../audit/AuditEngine.js';

const prisma = new PrismaClient();

export interface ComparisonResult {
  comparisonId: string;
  modelAId: string;
  modelBId: string;
  modelAName: string;
  modelBName: string;
  testSuite: string;
  differences: {
    category: string;
    metric: string;
    modelAValue: unknown;
    modelBValue: unknown;
    difference: number;
    significance: 'low' | 'medium' | 'high';
  }[];
  summary: {
    totalDifferences: number;
    significantDifferences: number;
    modelABetter: number;
    modelBBetter: number;
  };
  createdAt: Date;
}

export class ComparisonEngine {
  /**
   * Compare two audit results
   */
  async compareAudits(
    auditAId: string,
    auditBId: string
  ): Promise<ComparisonResult> {
    const auditA = await prisma.audit.findUnique({
      where: { id: auditAId },
      include: { model: true },
    });

    const auditB = await prisma.audit.findUnique({
      where: { id: auditBId },
      include: { model: true },
    });

    if (!auditA || !auditB) {
      throw new Error('One or both audits not found');
    }

    if (auditA.status !== 'completed' || auditB.status !== 'completed') {
      throw new Error('Both audits must be completed to compare');
    }

    const resultsA = auditA.results as unknown as AuditResult['results'];
    const resultsB = auditB.results as unknown as AuditResult['results'];
    const summaryA = (auditA.metadata as { summary?: AuditResult['summary'] })?.summary;
    const summaryB = (auditB.metadata as { summary?: AuditResult['summary'] })?.summary;

    const differences: ComparisonResult['differences'] = [];

    // Compare summaries
    if (summaryA && summaryB) {
      // Compare pass rates
      const passRateA = summaryA.totalTests > 0 ? summaryA.passed / summaryA.totalTests : 0;
      const passRateB = summaryB.totalTests > 0 ? summaryB.passed / summaryB.totalTests : 0;
      const passRateDiff = Math.abs(passRateA - passRateB);

      differences.push({
        category: 'summary',
        metric: 'pass_rate',
        modelAValue: passRateA,
        modelBValue: passRateB,
        difference: passRateDiff,
        significance: passRateDiff > 0.2 ? 'high' : passRateDiff > 0.1 ? 'medium' : 'low',
      });

      // Compare average latency
      const latencyDiff = Math.abs((summaryA.averageLatency || 0) - (summaryB.averageLatency || 0));
      const latencyDiffPercent = summaryA.averageLatency > 0
        ? (latencyDiff / summaryA.averageLatency) * 100
        : 0;

      differences.push({
        category: 'summary',
        metric: 'average_latency',
        modelAValue: summaryA.averageLatency,
        modelBValue: summaryB.averageLatency,
        difference: latencyDiff,
        significance: latencyDiffPercent > 50 ? 'high' : latencyDiffPercent > 25 ? 'medium' : 'low',
      });

      // Compare error rates
      const errorRateA = summaryA.totalTests > 0 ? summaryA.errors / summaryA.totalTests : 0;
      const errorRateB = summaryB.totalTests > 0 ? summaryB.errors / summaryB.totalTests : 0;
      const errorRateDiff = Math.abs(errorRateA - errorRateB);

      differences.push({
        category: 'summary',
        metric: 'error_rate',
        modelAValue: errorRateA,
        modelBValue: errorRateB,
        difference: errorRateDiff,
        significance: errorRateDiff > 0.1 ? 'high' : errorRateDiff > 0.05 ? 'medium' : 'low',
      });
    }

    // Compare censorship results
    if (resultsA.censorship && resultsB.censorship) {
      const refusalRateA = resultsA.censorship.filter(r => r.wasRefused).length / resultsA.censorship.length;
      const refusalRateB = resultsB.censorship.filter(r => r.wasRefused).length / resultsB.censorship.length;
      const refusalDiff = Math.abs(refusalRateA - refusalRateB);

      differences.push({
        category: 'censorship',
        metric: 'refusal_rate',
        modelAValue: refusalRateA,
        modelBValue: refusalRateB,
        difference: refusalDiff,
        significance: refusalDiff > 0.2 ? 'high' : refusalDiff > 0.1 ? 'medium' : 'low',
      });
    }

    // Compare bias results
    if (resultsA.bias && resultsB.bias) {
      const avgNeutralityA = resultsA.bias.reduce((sum, r) => sum + r.neutralityScore, 0) / resultsA.bias.length;
      const avgNeutralityB = resultsB.bias.reduce((sum, r) => sum + r.neutralityScore, 0) / resultsB.bias.length;
      const neutralityDiff = Math.abs(avgNeutralityA - avgNeutralityB);

      differences.push({
        category: 'bias',
        metric: 'average_neutrality',
        modelAValue: avgNeutralityA,
        modelBValue: avgNeutralityB,
        difference: neutralityDiff,
        significance: neutralityDiff > 0.2 ? 'high' : neutralityDiff > 0.1 ? 'medium' : 'low',
      });
    }

    // Compare side-channel results
    if (resultsA.sidechannel && resultsB.sidechannel) {
      const riskScoreA = resultsA.sidechannel.reduce((sum, r) => {
        const score = r.riskLevel === 'high' ? 3 : r.riskLevel === 'medium' ? 2 : 1;
        return sum + score;
      }, 0) / resultsA.sidechannel.length;

      const riskScoreB = resultsB.sidechannel.reduce((sum, r) => {
        const score = r.riskLevel === 'high' ? 3 : r.riskLevel === 'medium' ? 2 : 1;
        return sum + score;
      }, 0) / resultsB.sidechannel.length;

      const riskDiff = Math.abs(riskScoreA - riskScoreB);

      differences.push({
        category: 'sidechannel',
        metric: 'risk_score',
        modelAValue: riskScoreA,
        modelBValue: riskScoreB,
        difference: riskDiff,
        significance: riskDiff > 1 ? 'high' : riskDiff > 0.5 ? 'medium' : 'low',
      });
    }

    const significantDifferences = differences.filter(d => d.significance !== 'low').length;
    const modelABetter = differences.filter(d => {
      if (typeof d.modelAValue === 'number' && typeof d.modelBValue === 'number') {
        // For most metrics, higher is better (except latency, error rate, risk)
        if (d.metric.includes('latency') || d.metric.includes('error') || d.metric.includes('risk')) {
          return d.modelAValue < d.modelBValue;
        }
        return d.modelAValue > d.modelBValue;
      }
      return false;
    }).length;

    const modelBBetter = differences.length - modelABetter;

    const summary = {
      totalDifferences: differences.length,
      significantDifferences,
      modelABetter,
      modelBBetter,
    };

    // Save comparison to database
    const comparison = await prisma.comparison.create({
      data: {
        modelAId: auditA.modelId,
        modelBId: auditB.modelId,
        testSuite: auditA.testSuite,
        diff: differences as unknown as Record<string, unknown>,
        summary: summary as unknown as Record<string, unknown>,
      },
    });

    return {
      comparisonId: comparison.id,
      modelAId: auditA.modelId,
      modelBId: auditB.modelId,
      modelAName: auditA.model.name,
      modelBName: auditB.model.name,
      testSuite: auditA.testSuite,
      differences,
      summary,
      createdAt: comparison.createdAt,
    };
  }

  /**
   * Get comparison by ID
   */
  async getComparison(comparisonId: string): Promise<ComparisonResult | null> {
    const comparison = await prisma.comparison.findUnique({
      where: { id: comparisonId },
      include: {
        modelA: true,
        modelB: true,
      },
    });

    if (!comparison) {
      return null;
    }

    return {
      comparisonId: comparison.id,
      modelAId: comparison.modelAId,
      modelBId: comparison.modelBId,
      modelAName: comparison.modelA.name,
      modelBName: comparison.modelB.name,
      testSuite: comparison.testSuite,
      differences: comparison.diff as unknown as ComparisonResult['differences'],
      summary: comparison.summary as unknown as ComparisonResult['summary'],
      createdAt: comparison.createdAt,
    };
  }

  /**
   * Get all comparisons for a model
   */
  async getModelComparisons(modelId: string): Promise<ComparisonResult[]> {
    const comparisons = await prisma.comparison.findMany({
      where: {
        OR: [
          { modelAId: modelId },
          { modelBId: modelId },
        ],
      },
      include: {
        modelA: true,
        modelB: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comparisons.map(c => ({
      comparisonId: c.id,
      modelAId: c.modelAId,
      modelBId: c.modelBId,
      modelAName: c.modelA.name,
      modelBName: c.modelB.name,
      testSuite: c.testSuite,
      differences: c.diff as unknown as ComparisonResult['differences'],
      summary: c.summary as unknown as ComparisonResult['summary'],
      createdAt: c.createdAt,
    }));
  }
}


