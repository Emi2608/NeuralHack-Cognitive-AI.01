import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

export interface AnalyticsEvent {
  event_name: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  timestamp?: Date;
  page_url?: string;
  user_agent?: string;
}

export interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  page_url?: string;
  user_id?: string;
  timestamp?: Date;
  additional_data?: Record<string, any>;
}

export interface ErrorLog {
  error_message: string;
  error_stack?: string;
  error_type: string;
  page_url?: string;
  user_id?: string;
  user_agent?: string;
  timestamp?: Date;
  additional_context?: Record<string, any>;
}

export interface UsageMetrics {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  total_assessments: number;
  assessments_by_type: Record<string, number>;
  average_session_duration: number;
  bounce_rate: number;
  completion_rates: Record<string, number>;
}

class AnalyticsService {
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUser() {
    const authStore = useAuthStore.getState();
    return authStore.user;
  }

  /**
   * Track user events (page views, clicks, interactions)
   */
  async trackEvent(eventName: string, eventData?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Analytics] ${eventName}:`, eventData);
      return;
    }

    try {
      const user = this.getCurrentUser();
      const event: AnalyticsEvent = {
        event_name: eventName,
        event_data: eventData || {},
        user_id: user?.id,
        session_id: this.sessionId,
        timestamp: new Date(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      };

      const { error } = await supabase
        .from('analytics_events')
        .insert([event]);

      if (error) {
        console.error('Failed to track event:', error);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Track performance metrics (Core Web Vitals, load times, etc.)
   */
  async trackPerformance(metricName: string, value: number, unit: string, additionalData?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Performance] ${metricName}: ${value}${unit}`);
      return;
    }

    try {
      const user = this.getCurrentUser();
      const metric: PerformanceMetric = {
        metric_name: metricName,
        metric_value: value,
        metric_unit: unit,
        page_url: window.location.href,
        user_id: user?.id,
        timestamp: new Date(),
        additional_data: additionalData,
      };

      const { error } = await supabase
        .from('performance_metrics')
        .insert([metric]);

      if (error) {
        console.error('Failed to track performance metric:', error);
      }
    } catch (error) {
      console.error('Performance tracking error:', error);
    }
  }

  /**
   * Track errors and exceptions
   */
  async trackError(error: Error, errorType: string = 'javascript_error', additionalContext?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[Error] ${errorType}:`, error.message);
      return;
    }

    try {
      const user = this.getCurrentUser();
      const errorLog: ErrorLog = {
        error_message: error.message,
        error_stack: error.stack,
        error_type: errorType,
        page_url: window.location.href,
        user_id: user?.id,
        user_agent: navigator.userAgent,
        timestamp: new Date(),
        additional_context: additionalContext,
      };

      const { error: insertError } = await supabase
        .from('error_logs')
        .insert([errorLog]);

      if (insertError) {
        console.error('Failed to track error:', insertError);
      }
    } catch (trackingError) {
      console.error('Error tracking error:', trackingError);
    }
  }

  /**
   * Track assessment completion and results
   */
  async trackAssessmentCompletion(testType: string, score: number, riskLevel: string, duration: number): Promise<void> {
    await this.trackEvent('assessment_completed', {
      test_type: testType,
      score,
      risk_level: riskLevel,
      duration_seconds: duration,
    });
  }

  /**
   * Track user engagement metrics
   */
  async trackUserEngagement(action: string, details?: Record<string, any>): Promise<void> {
    await this.trackEvent('user_engagement', {
      action,
      ...details,
    });
  }

  /**
   * Track accessibility feature usage
   */
  async trackAccessibilityUsage(feature: string, enabled: boolean): Promise<void> {
    await this.trackEvent('accessibility_feature_used', {
      feature,
      enabled,
    });
  }

  /**
   * Get usage metrics for dashboard
   */
  async getUsageMetrics(startDate: Date, endDate: Date): Promise<UsageMetrics | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_usage_metrics', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });

      if (error) {
        console.error('Failed to get usage metrics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting usage metrics:', error);
      return null;
    }
  }

  /**
   * Get error rate metrics
   */
  async getErrorMetrics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('error_type, error_message, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get error metrics:', error);
        return null;
      }

      // Group errors by type and count
      const errorsByType = data.reduce((acc, error) => {
        acc[error.error_type] = (acc[error.error_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_errors: data.length,
        errors_by_type: errorsByType,
        recent_errors: data.slice(0, 10),
      };
    } catch (error) {
      console.error('Error getting error metrics:', error);
      return null;
    }
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  initializeWebVitals(): void {
    if (!this.isEnabled) return;

    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackPerformance('LCP', lastEntry.startTime, 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.trackPerformance('FID', entry.processingStart - entry.startTime, 'ms');
      });
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.trackPerformance('CLS', clsValue, 'score');
    }).observe({ entryTypes: ['layout-shift'] });

    // Track Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.trackPerformance('TTFB', ttfb, 'ms');
    });
  }

  /**
   * Set up global error tracking
   */
  initializeErrorTracking(): void {
    if (!this.isEnabled) return;

    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), 'javascript_error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), 'unhandled_promise_rejection');
    });

    // Track React error boundaries (if using React)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0] && args[0].includes && args[0].includes('React')) {
        this.trackError(new Error(args.join(' ')), 'react_error');
      }
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Track page views
   */
  async trackPageView(pageName: string, additionalData?: Record<string, any>): Promise<void> {
    await this.trackEvent('page_view', {
      page_name: pageName,
      referrer: document.referrer,
      ...additionalData,
    });
  }

  /**
   * Track user session start
   */
  async trackSessionStart(): Promise<void> {
    await this.trackEvent('session_start', {
      session_id: this.sessionId,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    });
  }

  /**
   * Track user session end
   */
  async trackSessionEnd(): Promise<void> {
    await this.trackEvent('session_end', {
      session_id: this.sessionId,
      session_duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
    });
  }
}

export const analyticsService = new AnalyticsService();