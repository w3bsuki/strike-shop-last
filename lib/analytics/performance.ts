/**
 * Performance Monitoring and Optimization Service
 * Tracks Core Web Vitals, API performance, and user experience metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
  url?: string;
  userId?: string;
  sessionId?: string;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface APIPerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
  userId?: string;
  cacheHit?: boolean;
  dbQueries?: number;
}

export interface UserExperienceMetric {
  type: 'page_load' | 'interaction' | 'conversion' | 'error';
  value: number;
  metadata: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIPerformanceMetric[] = [];
  private uxMetrics: UserExperienceMetric[] = [];
  private maxMetricsSize = 10000; // Keep last 10k metrics in memory

  /**
   * Track Core Web Vitals
   */
  trackCoreWebVitals(vitals: CoreWebVitals, url: string, userId?: string): void {
    const timestamp = new Date();
    
    // Track LCP (Largest Contentful Paint)
    this.addMetric({
      name: 'lcp',
      value: vitals.lcp,
      rating: this.rateLCP(vitals.lcp),
      timestamp,
      url,
      userId,
    });

    // Track FID (First Input Delay)
    this.addMetric({
      name: 'fid',
      value: vitals.fid,
      rating: this.rateFID(vitals.fid),
      timestamp,
      url,
      userId,
    });

    // Track CLS (Cumulative Layout Shift)
    this.addMetric({
      name: 'cls',
      value: vitals.cls,
      rating: this.rateCLS(vitals.cls),
      timestamp,
      url,
      userId,
    });

    // Track FCP (First Contentful Paint)
    this.addMetric({
      name: 'fcp',
      value: vitals.fcp,
      rating: this.rateFCP(vitals.fcp),
      timestamp,
      url,
      userId,
    });

    // Track TTFB (Time to First Byte)
    this.addMetric({
      name: 'ttfb',
      value: vitals.ttfb,
      rating: this.rateTTFB(vitals.ttfb),
      timestamp,
      url,
      userId,
    });

    console.log('Core Web Vitals tracked:', vitals);
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(metric: APIPerformanceMetric): void {
    this.apiMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetricsSize) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetricsSize);
    }

    // Log slow API calls
    if (metric.duration > 1000) {
      console.warn('Slow API call detected:', {
        endpoint: metric.endpoint,
        duration: metric.duration,
        status: metric.status,
      });
    }

    // Track as performance metric
    this.addMetric({
      name: 'api_response_time',
      value: metric.duration,
      rating: this.rateAPIResponse(metric.duration),
      timestamp: metric.timestamp,
      url: metric.endpoint,
      userId: metric.userId,
    });
  }

  /**
   * Track user experience metrics
   */
  trackUserExperience(metric: UserExperienceMetric): void {
    this.uxMetrics.push(metric);
    
    if (this.uxMetrics.length > this.maxMetricsSize) {
      this.uxMetrics = this.uxMetrics.slice(-this.maxMetricsSize);
    }

    console.log('UX metric tracked:', metric);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeRange: 'hour' | 'day' | 'week' = 'day'): {
    coreWebVitals: Record<string, { avg: number; p95: number; rating: string }>;
    apiPerformance: { avgResponseTime: number; slowEndpoints: string[]; errorRate: number };
    userExperience: { pageLoadTime: number; interactionTime: number; conversionRate: number };
  } {
    const cutoff = this.getTimeCutoff(timeRange);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);
    const recentAPIMetrics = this.apiMetrics.filter(m => m.timestamp >= cutoff);
    const recentUXMetrics = this.uxMetrics.filter(m => m.timestamp >= cutoff);

    // Core Web Vitals summary
    const coreWebVitals: Record<string, { avg: number; p95: number; rating: string }> = {};
    const vitalNames = ['lcp', 'fid', 'cls', 'fcp', 'ttfb'];
    
    for (const name of vitalNames) {
      const values = recentMetrics.filter(m => m.name === name).map(m => m.value);
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1] ?? 0;
        const ratings = recentMetrics.filter(m => m.name === name).map(m => m.rating);
        const goodCount = ratings.filter(r => r === 'good').length;
        const rating = goodCount / ratings.length > 0.75 ? 'good' : goodCount / ratings.length > 0.5 ? 'needs-improvement' : 'poor';
        
        coreWebVitals[name] = { avg, p95, rating };
      }
    }

    // API Performance summary
    const responseTimes = recentAPIMetrics.map(m => m.duration);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const slowEndpoints = recentAPIMetrics
      .filter(m => m.duration > 1000)
      .reduce((acc, m) => {
        acc[m.endpoint] = (acc[m.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const errorRate = recentAPIMetrics.length > 0
      ? recentAPIMetrics.filter(m => m.status >= 400).length / recentAPIMetrics.length
      : 0;

    // User Experience summary
    const pageLoadMetrics = recentUXMetrics.filter(m => m.type === 'page_load');
    const interactionMetrics = recentUXMetrics.filter(m => m.type === 'interaction');
    const conversionMetrics = recentUXMetrics.filter(m => m.type === 'conversion');
    
    const pageLoadTime = pageLoadMetrics.length > 0
      ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length
      : 0;
    
    const interactionTime = interactionMetrics.length > 0
      ? interactionMetrics.reduce((sum, m) => sum + m.value, 0) / interactionMetrics.length
      : 0;
    
    const conversionRate = conversionMetrics.length > 0
      ? conversionMetrics.filter(m => m.value > 0).length / conversionMetrics.length
      : 0;

    return {
      coreWebVitals,
      apiPerformance: {
        avgResponseTime,
        slowEndpoints: Object.keys(slowEndpoints).slice(0, 5),
        errorRate,
      },
      userExperience: {
        pageLoadTime,
        interactionTime,
        conversionRate,
      },
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: 'critical' | 'important' | 'minor';
    category: 'performance' | 'seo' | 'accessibility' | 'best-practices';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }> {
    const recommendations = [];
    const summary = this.getPerformanceSummary();

    // Check LCP
    if (summary.coreWebVitals.lcp?.rating === 'poor') {
      recommendations.push({
        type: 'critical' as const,
        category: 'performance' as const,
        title: 'Improve Largest Contentful Paint (LCP)',
        description: 'LCP is poor. Consider optimizing images, using CDN, and reducing server response times.',
        impact: 'high' as const,
        effort: 'medium' as const,
      });
    }

    // Check CLS
    if (summary.coreWebVitals.cls?.rating === 'poor') {
      recommendations.push({
        type: 'important' as const,
        category: 'performance' as const,
        title: 'Reduce Cumulative Layout Shift (CLS)',
        description: 'CLS is poor. Set explicit dimensions for images and avoid dynamic content injection.',
        impact: 'medium' as const,
        effort: 'low' as const,
      });
    }

    // Check API performance
    if (summary.apiPerformance.avgResponseTime > 500) {
      recommendations.push({
        type: 'important' as const,
        category: 'performance' as const,
        title: 'Optimize API Response Times',
        description: 'Average API response time is high. Consider caching, database optimization, and CDN.',
        impact: 'high' as const,
        effort: 'medium' as const,
      });
    }

    // Check error rate
    if (summary.apiPerformance.errorRate > 0.05) {
      recommendations.push({
        type: 'critical' as const,
        category: 'performance' as const,
        title: 'Reduce API Error Rate',
        description: 'API error rate is high. Review error handling and server stability.',
        impact: 'high' as const,
        effort: 'high' as const,
      });
    }

    return recommendations;
  }

  /**
   * Export metrics for external analytics
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: this.metrics,
      apiMetrics: this.apiMetrics,
      uxMetrics: this.uxMetrics,
      summary: this.getPerformanceSummary(),
      recommendations: this.getOptimizationRecommendations(),
      exportedAt: new Date().toISOString(),
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvLines = ['timestamp,name,value,rating,url,userId'];
      for (const metric of this.metrics) {
        csvLines.push([
          metric.timestamp.toISOString(),
          metric.name,
          metric.value.toString(),
          metric.rating,
          metric.url || '',
          metric.userId || '',
        ].join(','));
      }
      return csvLines.join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Private helper methods
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  private rateLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private rateFID(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private rateCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private rateFCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private rateTTFB(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  private rateAPIResponse(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 200) return 'good';
    if (value <= 500) return 'needs-improvement';
    return 'poor';
  }

  private getTimeCutoff(timeRange: 'hour' | 'day' | 'week'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();