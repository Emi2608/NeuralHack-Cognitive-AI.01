import { useEffect, useRef } from 'react';
import { analyticsService } from '../services/analytics.service';
import { monitoringService } from '../services/monitoring.service';
import { useAuthStore } from '../store/authStore';

export const useMonitoring = () => {
  const initialized = useRef(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!initialized.current) {
      initializeMonitoring();
      initialized.current = true;
    }

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Track user session start when user logs in
      analyticsService.trackSessionStart();
    }
  }, [user]);

  const initializeMonitoring = () => {
    try {
      // Initialize analytics tracking
      analyticsService.initializeWebVitals();
      analyticsService.initializeErrorTracking();

      // Initialize monitoring service
      monitoringService.initialize();

      // Track page views on route changes
      trackPageViews();

      // Track user interactions
      trackUserInteractions();

      // Track session end on page unload
      trackSessionEnd();

      console.log('🔍 Monitoring and analytics initialized');
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
  };

  const trackPageViews = () => {
    // Track initial page view
    analyticsService.trackPageView(getPageName());

    // Track page views on navigation (for SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => {
        analyticsService.trackPageView(getPageName());
      }, 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => {
        analyticsService.trackPageView(getPageName());
      }, 0);
    };

    // Track back/forward navigation
    window.addEventListener('popstate', () => {
      analyticsService.trackPageView(getPageName());
    });
  };

  const trackUserInteractions = () => {
    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'ION-BUTTON' || target.closest('ion-button')) {
        const button = target.closest('ion-button') || target;
        const buttonText = button.textContent?.trim() || 'Unknown Button';
        analyticsService.trackUserEngagement('button_click', {
          button_text: buttonText,
          page_url: window.location.href,
        });
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a') || target;
        analyticsService.trackUserEngagement('link_click', {
          link_url: (link as HTMLAnchorElement).href,
          link_text: link.textContent?.trim(),
          page_url: window.location.href,
        });
      }

      // Track assessment interactions
      if (target.closest('.assessment-container')) {
        analyticsService.trackUserEngagement('assessment_interaction', {
          interaction_type: 'click',
          element: target.tagName.toLowerCase(),
          page_url: window.location.href,
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formName = form.getAttribute('name') || form.className || 'unknown_form';
      
      analyticsService.trackUserEngagement('form_submit', {
        form_name: formName,
        page_url: window.location.href,
      });
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);
      
      if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
        maxScrollDepth = scrollDepth;
        analyticsService.trackUserEngagement('scroll_depth', {
          depth_percentage: scrollDepth,
          page_url: window.location.href,
        });
      }
    };

    window.addEventListener('scroll', trackScrollDepth, { passive: true });
  };

  const trackSessionEnd = () => {
    const handleBeforeUnload = () => {
      analyticsService.trackSessionEnd();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        analyticsService.trackSessionEnd();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };

  const getPageName = (): string => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length === 0) return 'home';
    if (segments[0] === 'assessment') return `assessment_${segments[1] || 'unknown'}`;
    if (segments[0] === 'dashboard') return 'dashboard';
    if (segments[0] === 'profile') return 'profile';
    if (segments[0] === 'auth') return `auth_${segments[1] || 'unknown'}`;
    
    return segments[0] || 'unknown';
  };

  const cleanup = () => {
    try {
      monitoringService.cleanup();
      console.log('🔍 Monitoring cleanup completed');
    } catch (error) {
      console.error('Error during monitoring cleanup:', error);
    }
  };

  // Public methods for manual tracking
  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    analyticsService.trackEvent(eventName, eventData);
  };

  const trackError = (error: Error, errorType?: string, context?: Record<string, any>) => {
    analyticsService.trackError(error, errorType, context);
  };

  const trackPerformance = (metricName: string, value: number, unit: string, additionalData?: Record<string, any>) => {
    analyticsService.trackPerformance(metricName, value, unit, additionalData);
  };

  const trackAssessmentStart = (testType: string) => {
    analyticsService.trackEvent('assessment_started', {
      test_type: testType,
      timestamp: new Date().toISOString(),
    });
  };

  const trackAssessmentComplete = (testType: string, score: number, riskLevel: string, duration: number) => {
    analyticsService.trackAssessmentCompletion(testType, score, riskLevel, duration);
  };

  const trackAccessibilityFeature = (feature: string, enabled: boolean) => {
    analyticsService.trackAccessibilityUsage(feature, enabled);
  };

  return {
    trackEvent,
    trackError,
    trackPerformance,
    trackAssessmentStart,
    trackAssessmentComplete,
    trackAccessibilityFeature,
  };
};