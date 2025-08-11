/**
 * Security Service - Handles security policies, CSP, and security monitoring
 */

import { EncryptionService } from '../utils/encryption/encryption.service';
import { AuditService } from './audit.service';

export interface SecurityConfig {
  enableCSP: boolean;
  enableCertificatePinning: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number; // minutes
  requireHTTPS: boolean;
}

export interface SecurityEvent {
  type: 'login_attempt' | 'data_access' | 'export' | 'security_violation';
  userId?: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class SecurityService {
  private static config: SecurityConfig = {
    enableCSP: true,
    enableCertificatePinning: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    requireHTTPS: true,
  };

  private static loginAttempts = new Map<string, number>();
  private static blockedIPs = new Set<string>();

  /**
   * Initialize security policies
   */
  static initialize(): void {
    this.setupContentSecurityPolicy();
    this.setupSecurityHeaders();
    this.monitorSecurityEvents();
    
    if (this.config.requireHTTPS && location.protocol !== 'https:') {
      console.warn('HTTPS required for security compliance');
    }
  }

  /**
   * Setup Content Security Policy
   */
  private static setupContentSecurityPolicy(): void {
    if (!this.config.enableCSP) return;

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');

    // Set CSP header via meta tag (for client-side apps)
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspDirectives;
    document.head.appendChild(meta);
  }

  /**
   * Setup additional security headers
   */
  private static setupSecurityHeaders(): void {
    // These would typically be set by the server, but we can add some client-side protections
    
    // Prevent clickjacking
    const frameOptions = document.createElement('meta');
    frameOptions.httpEquiv = 'X-Frame-Options';
    frameOptions.content = 'DENY';
    document.head.appendChild(frameOptions);

    // Prevent MIME type sniffing
    const contentTypeOptions = document.createElement('meta');
    contentTypeOptions.httpEquiv = 'X-Content-Type-Options';
    contentTypeOptions.content = 'nosniff';
    document.head.appendChild(contentTypeOptions);
  }

  /**
   * Monitor security events
   */
  private static monitorSecurityEvents(): void {
    // Monitor for potential XSS attempts
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message.includes('script')) {
        this.logSecurityEvent({
          type: 'security_violation',
          details: {
            type: 'potential_xss',
            message: event.error.message,
            source: event.filename,
            line: event.lineno
          },
          timestamp: new Date()
        });
      }
    });

    // Monitor for console access (potential debugging attempts)
    if (process.env.NODE_ENV === 'production') {
      const originalConsole = { ...console };
      Object.keys(console).forEach(key => {
        if (typeof console[key as keyof Console] === 'function') {
          (console as any)[key] = (...args: any[]) => {
            this.logSecurityEvent({
              type: 'security_violation',
              details: {
                type: 'console_access',
                method: key,
                args: args.slice(0, 2) // Log first 2 args only
              },
              timestamp: new Date()
            });
            return (originalConsole as any)[key](...args);
          };
        }
      });
    }
  }

  /**
   * Validate login attempt
   */
  static validateLoginAttempt(identifier: string, ipAddress?: string): boolean {
    if (ipAddress && this.blockedIPs.has(ipAddress)) {
      return false;
    }

    const attempts = this.loginAttempts.get(identifier) || 0;
    if (attempts >= this.config.maxLoginAttempts) {
      if (ipAddress) {
        this.blockedIPs.add(ipAddress);
      }
      return false;
    }

    return true;
  }

  /**
   * Record failed login attempt
   */
  static recordFailedLogin(identifier: string, ipAddress?: string): void {
    const attempts = this.loginAttempts.get(identifier) || 0;
    this.loginAttempts.set(identifier, attempts + 1);

    this.logSecurityEvent({
      type: 'login_attempt',
      details: {
        identifier,
        success: false,
        attempts: attempts + 1
      },
      timestamp: new Date(),
      ipAddress
    });

    // Clear attempts after 15 minutes
    setTimeout(() => {
      this.loginAttempts.delete(identifier);
    }, 15 * 60 * 1000);
  }

  /**
   * Record successful login
   */
  static recordSuccessfulLogin(userId: string, ipAddress?: string): void {
    // Clear any failed attempts
    this.loginAttempts.delete(userId);

    this.logSecurityEvent({
      type: 'login_attempt',
      userId,
      details: {
        success: true
      },
      timestamp: new Date(),
      ipAddress
    });
  }

  /**
   * Validate session token
   */
  static async validateSession(token: string): Promise<boolean> {
    try {
      // Basic JWT validation (in production, use proper JWT library)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      // Check expiration
      if (payload.exp && payload.exp < now) {
        return false;
      }

      // Check if session is within timeout window
      const sessionStart = payload.iat || payload.auth_time;
      const sessionAge = (now - sessionStart) / 60; // minutes
      
      if (sessionAge > this.config.sessionTimeout) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return EncryptionService.generateSecureToken(length);
  }

  /**
   * Hash sensitive data
   */
  static async hashSensitiveData(data: string): Promise<string> {
    return await EncryptionService.hash(data);
  }

  /**
   * Log security event
   */
  private static logSecurityEvent(event: SecurityEvent): void {
    // Add user agent and IP if available
    event.userAgent = navigator.userAgent;
    
    // Log to audit service
    AuditService.logEvent({
      action: 'security_event',
      resourceType: 'security',
      resourceId: event.type,
      userId: event.userId,
      metadata: {
        securityEvent: event
      },
      ipAddress: event.ipAddress,
      userAgent: event.userAgent
    });

    // In production, also send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityMonitoring(event);
    }
  }

  /**
   * Send security event to monitoring service
   */
  private static async sendToSecurityMonitoring(event: SecurityEvent): Promise<void> {
    try {
      // In a real implementation, this would send to a security monitoring service
      console.warn('Security Event:', event);
      
      // Could integrate with services like:
      // - Sentry for error tracking
      // - LogRocket for session replay
      // - Custom security dashboard
    } catch (error) {
      console.error('Failed to send security event:', error);
    }
  }

  /**
   * Check if current environment is secure
   */
  static isSecureEnvironment(): boolean {
    return (
      location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1'
    );
  }

  /**
   * Get security configuration
   */
  static getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update security configuration
   */
  static updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear security state (for logout)
   */
  static clearSecurityState(): void {
    this.loginAttempts.clear();
    // Don't clear blocked IPs - they should persist
  }
}