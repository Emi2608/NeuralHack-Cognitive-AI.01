import { supabase } from './supabase';
import { analyticsService } from './analytics.service';

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time: number;
  timestamp: Date;
  error_message?: string;
  additional_info?: Record<string, any>;
}

export interface SystemMetrics {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_latency?: number;
  active_connections?: number;
  error_rate?: number;
  response_time_avg?: number;
  uptime?: number;
}

export interface Alert {
  id: string;
  alert_type: 'error_rate' | 'response_time' | 'downtime' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, any>;
  triggered_at: Date;
  resolved_at?: Date;
  is_resolved: boolean;
}

class MonitoringService {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    error_rate: 0.05, // 5% error rate threshold
    response_time: 3000, // 3 seconds response time threshold
    memory_usage: 0.85, // 85% memory usage threshold
    cpu_usage: 0.80, // 80% CPU usage threshold
  };

  /**
   * Initialize monitoring system
   */
  initialize(): void {
    this.startHealthChecks();
    this.startMetricsCollection();
    this.setupAlertHandlers();
    
    console.log('🔍 Monitoring service initialized');
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Run health checks every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 5 * 60 * 1000);

    // Run initial health check
    this.performHealthChecks();
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics every minute
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60 * 1000);

    // Collect initial metrics
    this.collectSystemMetrics();
  }

  /**
   * Perform comprehensive health checks
   */
  private async performHealthChecks(): Promise<void> {
    const checks = [
      this.checkSupabaseConnection(),
      this.checkDatabaseHealth(),
      this.checkStorageHealth(),
      this.checkAuthService(),
      this.checkAPIEndpoints(),
    ];

    const results = await Promise.allSettled(checks);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Health check ${index} failed:`, result.reason);
        this.triggerAlert('downtime', 'high', `Health check failed: ${result.reason}`);
      }
    });
  }

  /**
   * Check Supabase connection
   */
  private async checkSupabaseConnection(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }

      const healthCheck: HealthCheck = {
        service: 'supabase_connection',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        response_time: responseTime,
        timestamp: new Date(),
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        service: 'supabase_connection',
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        timestamp: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test database connectivity and performance
      const { data, error } = await supabase.rpc('get_db_stats');

      const responseTime = Date.now() - startTime;

      if (error) {
        throw new Error(`Database health check failed: ${error.message}`);
      }

      const healthCheck: HealthCheck = {
        service: 'database',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        response_time: responseTime,
        timestamp: new Date(),
        additional_info: data,
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        service: 'database',
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        timestamp: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    }
  }

  /**
   * Check storage service health
   */
  private async checkStorageHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test storage connectivity
      const { data, error } = await supabase.storage
        .from('assessments')
        .list('', { limit: 1 });

      const responseTime = Date.now() - startTime;

      if (error) {
        throw new Error(`Storage health check failed: ${error.message}`);
      }

      const healthCheck: HealthCheck = {
        service: 'storage',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        response_time: responseTime,
        timestamp: new Date(),
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        service: 'storage',
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        timestamp: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    }
  }

  /**
   * Check authentication service
   */
  private async checkAuthService(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test auth service
      const { data, error } = await supabase.auth.getSession();

      const responseTime = Date.now() - startTime;

      if (error) {
        throw new Error(`Auth service check failed: ${error.message}`);
      }

      const healthCheck: HealthCheck = {
        service: 'auth',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        response_time: responseTime,
        timestamp: new Date(),
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        service: 'auth',
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        timestamp: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    }
  }

  /**
   * Check API endpoints
   */
  private async checkAPIEndpoints(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test critical API endpoints
      const endpoints = [
        '/api/health',
        '/api/assessments',
        '/api/user/profile',
      ];

      const checks = endpoints.map(async (endpoint) => {
        const response = await fetch(endpoint, { method: 'HEAD' });
        return { endpoint, status: response.status, ok: response.ok };
      });

      const results = await Promise.allSettled(checks);
      const responseTime = Date.now() - startTime;

      const failedEndpoints = results
        .filter((result) => result.status === 'rejected' || !result.value?.ok)
        .map((result, index) => endpoints[index]);

      const healthCheck: HealthCheck = {
        service: 'api_endpoints',
        status: failedEndpoints.length === 0 ? 'healthy' : 'degraded',
        response_time: responseTime,
        timestamp: new Date(),
        additional_info: { failed_endpoints: failedEndpoints },
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        service: 'api_endpoints',
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        timestamp: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.recordHealthCheck(healthCheck);
      return healthCheck;
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        // Browser-based metrics
        memory_usage: this.getMemoryUsage(),
        network_latency: await this.measureNetworkLatency(),
        response_time_avg: await this.getAverageResponseTime(),
        error_rate: await this.getErrorRate(),
        uptime: this.getUptime(),
      };

      await this.recordSystemMetrics(metrics);
      
      // Check for threshold violations
      this.checkMetricThresholds(metrics);
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
      analyticsService.trackError(error as Error, 'metrics_collection_error');
    }
  }

  /**
   * Get memory usage (browser-specific)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    return 0;
  }

  /**
   * Measure network latency
   */
  private async measureNetworkLatency(): Promise<number> {
    const startTime = Date.now();
    
    try {
      await fetch('/api/ping', { method: 'HEAD' });
      return Date.now() - startTime;
    } catch (error) {
      return -1; // Indicate network error
    }
  }

  /**
   * Get average response time from recent requests
   */
  private async getAverageResponseTime(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('metric_value')
        .eq('metric_name', 'response_time')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return 0;
      }

      const sum = data.reduce((acc, metric) => acc + metric.metric_value, 0);
      return sum / data.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get error rate from recent logs
   */
  private async getErrorRate(): Promise<number> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const [errorsResult, totalResult] = await Promise.all([
        supabase
          .from('error_logs')
          .select('id', { count: 'exact' })
          .gte('created_at', fiveMinutesAgo),
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact' })
          .gte('created_at', fiveMinutesAgo),
      ]);

      const errorCount = errorsResult.count || 0;
      const totalCount = totalResult.count || 0;

      return totalCount > 0 ? errorCount / totalCount : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get application uptime
   */
  private getUptime(): number {
    return performance.now() / 1000; // Uptime in seconds
  }

  /**
   * Check metric thresholds and trigger alerts
   */
  private checkMetricThresholds(metrics: SystemMetrics): void {
    if (metrics.error_rate && metrics.error_rate > this.alertThresholds.error_rate) {
      this.triggerAlert(
        'error_rate',
        'high',
        `Error rate exceeded threshold: ${(metrics.error_rate * 100).toFixed(2)}%`,
        { error_rate: metrics.error_rate, threshold: this.alertThresholds.error_rate }
      );
    }

    if (metrics.response_time_avg && metrics.response_time_avg > this.alertThresholds.response_time) {
      this.triggerAlert(
        'response_time',
        'medium',
        `Average response time exceeded threshold: ${metrics.response_time_avg}ms`,
        { response_time: metrics.response_time_avg, threshold: this.alertThresholds.response_time }
      );
    }

    if (metrics.memory_usage && metrics.memory_usage > this.alertThresholds.memory_usage) {
      this.triggerAlert(
        'performance',
        'medium',
        `Memory usage exceeded threshold: ${(metrics.memory_usage * 100).toFixed(2)}%`,
        { memory_usage: metrics.memory_usage, threshold: this.alertThresholds.memory_usage }
      );
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(
    alertType: Alert['alert_type'],
    severity: Alert['severity'],
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const alert: Omit<Alert, 'id'> = {
        alert_type: alertType,
        severity,
        message,
        details,
        triggered_at: new Date(),
        is_resolved: false,
      };

      const { data, error } = await supabase
        .from('monitoring_alerts')
        .insert([alert])
        .select()
        .single();

      if (error) {
        console.error('Failed to create alert:', error);
        return;
      }

      // Send notification based on severity
      await this.sendAlertNotification(data);
      
      console.warn(`🚨 Alert triggered: ${message}`);
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: Alert): Promise<void> {
    // In a real implementation, this would send notifications via:
    // - Email
    // - Slack
    // - SMS
    // - Push notifications
    // - PagerDuty, etc.

    console.log(`📧 Alert notification: ${alert.message} (${alert.severity})`);

    // Track alert in analytics
    analyticsService.trackEvent('alert_triggered', {
      alert_type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
    });
  }

  /**
   * Record health check result
   */
  private async recordHealthCheck(healthCheck: HealthCheck): Promise<void> {
    try {
      const { error } = await supabase
        .from('health_checks')
        .insert([healthCheck]);

      if (error) {
        console.error('Failed to record health check:', error);
      }
    } catch (error) {
      console.error('Error recording health check:', error);
    }
  }

  /**
   * Record system metrics
   */
  private async recordSystemMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_metrics')
        .insert([{
          ...metrics,
          timestamp: new Date(),
        }]);

      if (error) {
        console.error('Failed to record system metrics:', error);
      }
    } catch (error) {
      console.error('Error recording system metrics:', error);
    }
  }

  /**
   * Setup alert handlers
   */
  private setupAlertHandlers(): void {
    // Handle critical errors
    window.addEventListener('error', (event) => {
      this.triggerAlert(
        'error_rate',
        'high',
        `JavaScript error: ${event.message}`,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.triggerAlert(
        'error_rate',
        'high',
        `Unhandled promise rejection: ${event.reason}`,
        { reason: event.reason }
      );
    });
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    overall_status: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheck[];
    metrics: SystemMetrics;
    active_alerts: Alert[];
  }> {
    try {
      // Get recent health checks
      const { data: healthChecks } = await supabase
        .from('health_checks')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
        .order('timestamp', { ascending: false });

      // Get recent metrics
      const { data: metricsData } = await supabase
        .from('system_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      // Get active alerts
      const { data: alerts } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('triggered_at', { ascending: false });

      // Determine overall status
      const unhealthyServices = healthChecks?.filter(hc => hc.status === 'unhealthy') || [];
      const degradedServices = healthChecks?.filter(hc => hc.status === 'degraded') || [];
      const criticalAlerts = alerts?.filter(alert => alert.severity === 'critical') || [];

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (unhealthyServices.length > 0 || criticalAlerts.length > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedServices.length > 0) {
        overallStatus = 'degraded';
      }

      return {
        overall_status: overallStatus,
        services: healthChecks || [],
        metrics: metricsData?.[0] || {},
        active_alerts: alerts || [],
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        overall_status: 'unhealthy',
        services: [],
        metrics: {},
        active_alerts: [],
      };
    }
  }

  /**
   * Cleanup monitoring resources
   */
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    console.log('🔍 Monitoring service cleaned up');
  }
}

export const monitoringService = new MonitoringService();