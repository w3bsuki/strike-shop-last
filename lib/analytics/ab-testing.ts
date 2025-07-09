/**
 * A/B Testing Framework
 * Uses Vercel Edge Config and Next.js middleware for zero-latency experiments
 */

import { cookies } from 'next/headers';
import { analyticsService } from './analytics';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number; // 0-100
    config: Record<string, any>;
  }>;
  targeting: {
    userSegments?: string[];
    geoTargeting?: string[];
    deviceTypes?: ('desktop' | 'mobile' | 'tablet')[];
    trafficPercentage: number; // 0-100
  };
  metrics: {
    primary: string; // e.g., 'conversion_rate'
    secondary?: string[];
  };
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  minimumSampleSize?: number;
  statisticalSignificance?: number; // e.g., 0.95 for 95%
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  assignedAt: Date;
  converted?: boolean;
  conversionValue?: number;
  metadata?: Record<string, any>;
}

export interface ExperimentAnalysis {
  experimentId: string;
  status: 'insufficient_data' | 'no_winner' | 'winner_found';
  winner?: string;
  confidence?: number;
  variants: Array<{
    id: string;
    name: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    averageValue: number;
    totalValue: number;
    significance?: number;
    uplift?: number;
  }>;
  recommendations: string[];
}

export class ABTestingService {
  private experiments: Map<string, Experiment> = new Map();
  private results: ExperimentResult[] = [];
  private cache: Map<string, string> = new Map();

  constructor() {
    this.loadExperiments();
  }

  /**
   * Load experiments from Edge Config or database
   */
  private async loadExperiments(): Promise<void> {
    try {
      // In production, this would load from Vercel Edge Config
      // For now, we'll initialize with sample experiments
      const sampleExperiments: Experiment[] = [
        {
          id: 'checkout-flow-v2',
          name: 'Simplified Checkout Flow',
          description: 'Test simplified vs. detailed checkout process',
          variants: [
            { id: 'control', name: 'Current Checkout', weight: 50, config: { simplified: false } },
            { id: 'simplified', name: 'Simplified Checkout', weight: 50, config: { simplified: true } },
          ],
          targeting: {
            trafficPercentage: 100,
            deviceTypes: ['desktop', 'mobile'],
          },
          metrics: {
            primary: 'checkout_conversion_rate',
            secondary: ['time_to_checkout', 'cart_abandonment_rate'],
          },
          status: 'running',
          startDate: new Date(),
          minimumSampleSize: 1000,
          statisticalSignificance: 0.95,
        },
        {
          id: 'product-page-layout',
          name: 'Product Page Layout Test',
          description: 'Test different product page layouts for conversion',
          variants: [
            { id: 'control', name: 'Current Layout', weight: 34, config: { layout: 'current' } },
            { id: 'gallery-first', name: 'Gallery First', weight: 33, config: { layout: 'gallery-first' } },
            { id: 'details-first', name: 'Details First', weight: 33, config: { layout: 'details-first' } },
          ],
          targeting: {
            trafficPercentage: 75,
            userSegments: ['new-visitors'],
          },
          metrics: {
            primary: 'add_to_cart_rate',
            secondary: ['time_on_page', 'scroll_depth'],
          },
          status: 'running',
          startDate: new Date(),
          minimumSampleSize: 2000,
          statisticalSignificance: 0.95,
        },
        {
          id: 'pricing-display',
          name: 'Pricing Display Format',
          description: 'Test different ways to display pricing and discounts',
          variants: [
            { id: 'control', name: 'Standard Pricing', weight: 50, config: { showOriginalPrice: true, highlightSavings: false } },
            { id: 'savings-focus', name: 'Savings Focused', weight: 50, config: { showOriginalPrice: true, highlightSavings: true } },
          ],
          targeting: {
            trafficPercentage: 50,
          },
          metrics: {
            primary: 'purchase_rate',
            secondary: ['average_order_value'],
          },
          status: 'running',
          startDate: new Date(),
          minimumSampleSize: 1500,
          statisticalSignificance: 0.95,
        },
      ];

      for (const experiment of sampleExperiments) {
        this.experiments.set(experiment.id, experiment);
      }

      console.log('Experiments loaded:', this.experiments.size);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  /**
   * Get user variant for an experiment
   */
  getUserVariant(experimentId: string, userId?: string, sessionId?: string): {
    variant: string;
    config: Record<string, any>;
  } | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user is eligible for experiment
    if (!this.isUserEligible(experiment, userId)) {
      return null;
    }

    // Check cache first
    const cacheKey = `${experimentId}:${userId || sessionId}`;
    const cachedVariant = this.cache.get(cacheKey);
    if (cachedVariant) {
      const variant = experiment.variants.find(v => v.id === cachedVariant);
      return variant ? { variant: variant.id, config: variant.config } : null;
    }

    // Assign variant based on consistent hashing
    const assignedVariant = this.assignVariant(experiment, userId || sessionId || '');
    if (!assignedVariant) return null;

    // Cache the assignment
    this.cache.set(cacheKey, assignedVariant.id);

    // Record the assignment
    this.recordAssignment(experimentId, assignedVariant.id, userId, sessionId || '');

    return {
      variant: assignedVariant.id,
      config: assignedVariant.config,
    };
  }

  /**
   * Get user variant from cookies (client-side)
   */
  async getUserVariantFromCookies(experimentId: string): Promise<{
    variant: string;
    config: Record<string, any>;
  } | null> {
    if (typeof window === 'undefined') {
      // Server-side: use Next.js cookies
      const cookieStore = await cookies();
      const variantCookie = cookieStore.get(`experiment-${experimentId}`);
      const variant = variantCookie?.value;
      
      if (!variant) return null;

      const experiment = this.experiments.get(experimentId);
      const variantConfig = experiment?.variants.find(v => v.id === variant);
      
      return variantConfig ? { variant, config: variantConfig.config } : null;
    } else {
      // Client-side: use document.cookie
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`experiment-${experimentId}=`));
      
      if (!cookie) return null;
      
      const variant = cookie.split('=')[1];
      if (!variant) return null;
      
      const experiment = this.experiments.get(experimentId);
      const variantConfig = experiment?.variants.find(v => v.id === variant);
      
      return variantConfig ? { variant, config: variantConfig.config } : null;
    }
  }

  /**
   * Track experiment conversion
   */
  trackConversion(
    experimentId: string,
    userId?: string,
    sessionId?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // Find existing assignment
    const assignment = this.results.find(r => 
      r.experimentId === experimentId && 
      (r.userId === userId || r.sessionId === sessionId)
    );

    if (assignment) {
      assignment.converted = true;
      assignment.conversionValue = value;
      assignment.metadata = { ...assignment.metadata, ...metadata };
    }

    // Track in analytics
    analyticsService.track('experiment_conversion', {
      experimentId,
      variant: assignment?.variantId,
      value,
      ...metadata,
    });

    console.log('Experiment conversion tracked:', {
      experimentId,
      variant: assignment?.variantId,
      userId,
      value,
    });
  }

  /**
   * Get experiment analysis
   */
  getExperimentAnalysis(experimentId: string): ExperimentAnalysis | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const experimentResults = this.results.filter(r => r.experimentId === experimentId);
    
    if (experimentResults.length < (experiment.minimumSampleSize || 100)) {
      return {
        experimentId,
        status: 'insufficient_data',
        variants: experiment.variants.map(v => ({
          id: v.id,
          name: v.name,
          visitors: 0,
          conversions: 0,
          conversionRate: 0,
          averageValue: 0,
          totalValue: 0,
        })),
        recommendations: [
          'Insufficient data for analysis',
          `Need at least ${experiment.minimumSampleSize || 100} visitors per variant`,
        ],
      };
    }

    // Calculate variant performance
    const variantStats = experiment.variants.map(variant => {
      const variantResults = experimentResults.filter(r => r.variantId === variant.id);
      const visitors = variantResults.length;
      const conversions = variantResults.filter(r => r.converted).length;
      const conversionRate = visitors > 0 ? conversions / visitors : 0;
      const totalValue = variantResults
        .filter(r => r.converted && r.conversionValue)
        .reduce((sum, r) => sum + (r.conversionValue || 0), 0);
      const averageValue = conversions > 0 ? totalValue / conversions : 0;

      return {
        id: variant.id,
        name: variant.name,
        visitors,
        conversions,
        conversionRate,
        averageValue,
        totalValue,
      };
    });

    // Statistical significance testing (simplified)
    const controlStats = variantStats.find(v => v.id === 'control') || variantStats[0];
    if (!controlStats) {
      return {
        experimentId,
        status: 'insufficient_data',
        variants: variantStats,
        recommendations: ['No control variant found'],
      };
    }
    
    // Calculate significance and uplift for each variant
    const variantsWithSignificance = variantStats.map(variant => {
      if (variant.id === controlStats.id) {
        return { ...variant, significance: 0, uplift: 0 };
      }
      
      // Simplified z-test for conversion rate difference
      const p1 = controlStats.conversionRate;
      const p2 = variant.conversionRate;
      const n1 = controlStats.visitors;
      const n2 = variant.visitors;
      
      if (n1 === 0 || n2 === 0) {
        return { ...variant, significance: 0, uplift: 0 };
      }
      
      const p = (controlStats.conversions + variant.conversions) / (n1 + n2);
      const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
      const z = Math.abs(p1 - p2) / se;
      const uplift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;
      
      return { ...variant, significance: z, uplift };
    });
    
    const significantVariants = variantsWithSignificance.filter(variant => {
      if (variant.id === controlStats.id) return false;
      const isSignificant = (variant.significance || 0) > 1.96;
      return isSignificant && variant.conversionRate > controlStats.conversionRate;
    });

    // Determine winner
    let status: ExperimentAnalysis['status'] = 'no_winner';
    let winner: string | undefined;
    let confidence: number | undefined;

    if (significantVariants.length > 0) {
      const bestVariant = significantVariants.reduce((best, variant) => 
        variant.conversionRate > best.conversionRate ? variant : best
      );
      
      status = 'winner_found';
      winner = bestVariant.id;
      confidence = 1 - (2 * (1 - this.normalCDF(bestVariant.significance || 0)));
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (status === 'winner_found') {
      const winnerStats = variantsWithSignificance.find(v => v.id === winner);
      recommendations.push(
        `Variant "${winnerStats?.name}" shows significant improvement`,
        `Conversion rate: ${((winnerStats?.conversionRate || 0) * 100).toFixed(2)}%`,
        `Uplift: ${winnerStats?.uplift?.toFixed(1)}%`,
        'Consider implementing this variant site-wide'
      );
    } else if (status === 'no_winner') {
      recommendations.push(
        'No statistically significant winner found',
        'Consider running the experiment longer',
        'Review targeting criteria and traffic allocation'
      );
    }

    return {
      experimentId,
      status,
      winner,
      confidence,
      variants: variantsWithSignificance,
      recommendations,
    };
  }

  /**
   * Get all active experiments
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(e => e.status === 'running');
  }

  /**
   * Create new experiment
   */
  createExperiment(experiment: Omit<Experiment, 'id'>): string {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExperiment: Experiment = { ...experiment, id };
    
    this.experiments.set(id, newExperiment);
    
    console.log('Experiment created:', id);
    return id;
  }

  /**
   * Update experiment status
   */
  updateExperimentStatus(experimentId: string, status: Experiment['status']): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;
    
    experiment.status = status;
    if (status === 'completed') {
      experiment.endDate = new Date();
    }
    
    return true;
  }

  /**
   * Export experiment results
   */
  exportExperimentResults(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    const results = this.results.filter(r => r.experimentId === experimentId);
    const analysis = this.getExperimentAnalysis(experimentId);
    
    return JSON.stringify({
      experiment,
      results,
      analysis,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Private helper methods
   */
  private isUserEligible(experiment: Experiment, userId?: string): boolean {
    // Traffic percentage check
    if (experiment.targeting.trafficPercentage < 100) {
      const hash = this.hashString(userId || 'anonymous');
      if ((hash % 100) >= experiment.targeting.trafficPercentage) {
        return false;
      }
    }

    // Additional targeting checks would go here
    // (geo-targeting, device type, user segments, etc.)
    
    return true;
  }

  private assignVariant(experiment: Experiment, identifier: string): Experiment['variants'][0] | null {
    const hash = this.hashString(`${experiment.id}:${identifier}`);
    const random = (hash % 100) + 1; // 1-100
    
    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return experiment.variants[0] || null;
  }

  private recordAssignment(
    experimentId: string,
    variantId: string,
    userId?: string,
    sessionId: string = ''
  ): void {
    const result: ExperimentResult = {
      experimentId,
      variantId,
      userId,
      sessionId,
      assignedAt: new Date(),
    };
    
    this.results.push(result);
    
    // Track in analytics
    analyticsService.track('experiment_assignment', {
      experimentId,
      variantId,
      userId,
      sessionId,
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService();