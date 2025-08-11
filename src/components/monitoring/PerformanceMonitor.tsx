import React, { useEffect, useState, useCallback } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonBadge, IonProgressBar, IonButton, IonIcon } from '@ionic/react';
import { speedometer, refresh, analytics } from 'ionicons/icons';
import { monitoringService } from '../../services/monitoring.service';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Other metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Memory usage
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  } | null;
  
  // Network information
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface PerformanceMonitorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  autoRefresh = false,
  refreshInterval = 30000,
  showDetails = true,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    memoryUsage: null,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  // Use the imported monitoring service instance

  const measurePerformance = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const newMetrics: PerformanceMetrics = {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
        memoryUsage: null,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0
      };

      // Measure Core Web Vitals using Performance Observer
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            newMetrics.lcp = lastEntry.startTime;
          }
        });
        
        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('LCP observation not supported');
        }

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              newMetrics.fid = entry.processingStart - entry.startTime;
            }
          });
        });

        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.warn('FID observation not supported');
        }

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          newMetrics.cls = clsValue;
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.warn('CLS observation not supported');
        }
      }

      // Get navigation timing metrics
      if ('performance' in window && performance.getEntriesByType) {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          newMetrics.fcp = nav.responseStart - nav.fetchStart;
          newMetrics.ttfb = nav.responseStart - nav.requestStart;
        }
      }

      // Get memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        };
      }

      // Get network information
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newMetrics.connectionType = connection.type || 'unknown';
        newMetrics.effectiveType = connection.effectiveType || 'unknown';
        newMetrics.downlink = connection.downlink || 0;
        newMetrics.rtt = connection.rtt || 0;
      }

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);

      // Log metrics to monitoring service
      monitoringService.logPerformanceMetrics(newMetrics);

    } catch (error) {
      console.error('Error measuring performance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onMetricsUpdate, monitoringService]);

  useEffect(() => {
    // Initial measurement
    measurePerformance();

    // Set up auto-refresh if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(measurePerformance, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [measurePerformance, autoRefresh, refreshInterval]);

  const getScoreColor = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'medium';
    if (value <= thresholds.good) return 'success';
    if (value <= thresholds.poor) return 'warning';
    return 'danger';
  };

  const getScoreLabel = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'N/A';
    if (value <= thresholds.good) return 'Bueno';
    if (value <= thresholds.poor) return 'Necesita mejora';
    return 'Pobre';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IonIcon icon={speedometer} />
          Monitor de Rendimiento
          <IonButton 
            fill="clear" 
            size="small" 
            onClick={measurePerformance}
            disabled={isLoading}
          >
            <IonIcon icon={refresh} />
          </IonButton>
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        {/* Core Web Vitals */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
            Core Web Vitals
          </h3>
          
          <IonItem>
            <IonLabel>
              <h3>Largest Contentful Paint (LCP)</h3>
              <p>Tiempo de carga del contenido principal</p>
            </IonLabel>
            <IonBadge color={getScoreColor(metrics.lcp, { good: 2500, poor: 4000 })}>
              {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
            </IonBadge>
          </IonItem>

          <IonItem>
            <IonLabel>
              <h3>First Input Delay (FID)</h3>
              <p>Tiempo de respuesta a la primera interacción</p>
            </IonLabel>
            <IonBadge color={getScoreColor(metrics.fid, { good: 100, poor: 300 })}>
              {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
            </IonBadge>
          </IonItem>

          <IonItem>
            <IonLabel>
              <h3>Cumulative Layout Shift (CLS)</h3>
              <p>Estabilidad visual de la página</p>
            </IonLabel>
            <IonBadge color={getScoreColor(metrics.cls, { good: 0.1, poor: 0.25 })}>
              {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
            </IonBadge>
          </IonItem>
        </div>

        {showDetails && (
          <>
            {/* Additional Metrics */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Métricas Adicionales
              </h3>
              
              <IonItem>
                <IonLabel>
                  <h3>First Contentful Paint (FCP)</h3>
                  <p>Tiempo hasta el primer contenido</p>
                </IonLabel>
                <IonBadge color={getScoreColor(metrics.fcp, { good: 1800, poor: 3000 })}>
                  {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}
                </IonBadge>
              </IonItem>

              <IonItem>
                <IonLabel>
                  <h3>Time to First Byte (TTFB)</h3>
                  <p>Tiempo de respuesta del servidor</p>
                </IonLabel>
                <IonBadge color={getScoreColor(metrics.ttfb, { good: 800, poor: 1800 })}>
                  {metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}
                </IonBadge>
              </IonItem>
            </div>

            {/* Memory Usage */}
            {metrics.memoryUsage && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  Uso de Memoria
                </h3>
                
                <IonItem>
                  <IonLabel>
                    <h3>Memoria Utilizada</h3>
                    <p>{formatBytes(metrics.memoryUsage.used)} / {formatBytes(metrics.memoryUsage.total)}</p>
                  </IonLabel>
                  <IonBadge color={metrics.memoryUsage.percentage > 80 ? 'danger' : metrics.memoryUsage.percentage > 60 ? 'warning' : 'success'}>
                    {Math.round(metrics.memoryUsage.percentage)}%
                  </IonBadge>
                </IonItem>
                
                <IonProgressBar 
                  value={metrics.memoryUsage.percentage / 100}
                  color={metrics.memoryUsage.percentage > 80 ? 'danger' : metrics.memoryUsage.percentage > 60 ? 'warning' : 'success'}
                />
              </div>
            )}

            {/* Network Information */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Información de Red
              </h3>
              
              <IonItem>
                <IonLabel>
                  <h3>Tipo de Conexión</h3>
                  <p>{metrics.effectiveType.toUpperCase()}</p>
                </IonLabel>
                <IonBadge color="medium">
                  {metrics.connectionType}
                </IonBadge>
              </IonItem>

              <IonItem>
                <IonLabel>
                  <h3>Velocidad de Descarga</h3>
                  <p>Ancho de banda estimado</p>
                </IonLabel>
                <IonBadge color="primary">
                  {metrics.downlink} Mbps
                </IonBadge>
              </IonItem>

              <IonItem>
                <IonLabel>
                  <h3>Latencia (RTT)</h3>
                  <p>Tiempo de ida y vuelta</p>
                </IonLabel>
                <IonBadge color={metrics.rtt > 300 ? 'danger' : metrics.rtt > 150 ? 'warning' : 'success'}>
                  {metrics.rtt}ms
                </IonBadge>
              </IonItem>
            </div>

            {/* Performance Summary */}
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'var(--ion-color-light)', 
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IonIcon icon={analytics} />
                Resumen de Rendimiento
              </h4>
              <p style={{ margin: '0', fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                {metrics.lcp && metrics.lcp <= 2500 && 
                 metrics.fid && metrics.fid <= 100 && 
                 metrics.cls && metrics.cls <= 0.1 
                  ? '✅ Excelente rendimiento - Todos los Core Web Vitals están en rango óptimo'
                  : '⚠️ Hay oportunidades de mejora en el rendimiento'
                }
              </p>
            </div>
          </>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <IonProgressBar type="indeterminate" />
            <p style={{ marginTop: '10px', color: 'var(--ion-color-medium)' }}>
              Midiendo rendimiento...
            </p>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default PerformanceMonitor;