/**
 * Audit Service - Immutable audit logging for compliance
 * Implements comprehensive audit trail for all user actions and system events
 */

import { supabase } from './supabase';

export interface AuditEvent {
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  private static localAuditQueue: AuditEvent[] = [];
  private static isOnline = navigator.onLine;

  /**
   * Initialize audit service
   */
  static initialize(): void {
    // Monitor online status for audit log synchronization
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncLocalAuditLogs();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Periodic sync of audit logs
    setInterval(() => {
      if (this.isOnline && this.localAuditQueue.length > 0) {
        this.syncLocalAuditLogs();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Log an audit event
   */
  static async logEvent(event: AuditEvent): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
      ipAddress: event.ipAddress || await this.getClientIP(),
      userAgent: event.userAgent || navigator.userAgent
    };

    try {
      if (this.isOnline) {
        await this.saveToDatabase(auditEvent);
      } else {
        // Store locally when offline
        this.localAuditQueue.push(auditEvent);
        this.saveToLocalStorage(auditEvent);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Fallback to local storage
      this.localAuditQueue.push(auditEvent);
      this.saveToLocalStorage(auditEvent);
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuthEvent(
    action: 'login' | 'logout' | 'register' | 'password_change',
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      action: `auth_${action}`,
      resourceType: 'authentication',
      resourceId: userId,
      userId,
      metadata
    });
  }

  /**
   * Log assessment events
   */
  static async logAssessmentEvent(
    action: 'start' | 'complete' | 'abandon' | 'view_results',
    assessmentId: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      action: `assessment_${action}`,
      resourceType: 'assessment',
      resourceId: assessmentId,
      userId,
      metadata
    });
  }

  /**
   * Log data access events
   */
  static async logDataAccess(
    action: 'read' | 'write' | 'delete' | 'export',
    resourceType: string,
    resourceId: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      action: `data_${action}`,
      resourceType,
      resourceId,
      userId,
      metadata
    });
  }

  /**
   * Log privacy events (GDPR compliance)
   */
  static async logPrivacyEvent(
    action: 'consent_given' | 'consent_withdrawn' | 'data_export' | 'data_deletion',
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      action: `privacy_${action}`,
      resourceType: 'privacy',
      resourceId: userId,
      userId,
      metadata
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    action: string,
    details: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      action: `security_${action}`,
      resourceType: 'security',
      userId,
      metadata: details
    });
  }

  /**
   * Query audit logs
   */
  static async queryAuditLogs(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      let supabaseQuery = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (query.userId) {
        supabaseQuery = supabaseQuery.eq('user_id', query.userId);
      }

      if (query.action) {
        supabaseQuery = supabaseQuery.eq('action', query.action);
      }

      if (query.resourceType) {
        supabaseQuery = supabaseQuery.eq('resource_type', query.resourceType);
      }

      if (query.startDate) {
        supabaseQuery = supabaseQuery.gte('created_at', query.startDate.toISOString());
      }

      if (query.endDate) {
        supabaseQuery = supabaseQuery.lte('created_at', query.endDate.toISOString());
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 50) - 1);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit summary for user
   */
  static async getUserAuditSummary(userId: string): Promise<{
    totalEvents: number;
    recentEvents: AuditEvent[];
    eventsByType: Record<string, number>;
  }> {
    try {
      const events = await this.queryAuditLogs({
        userId,
        limit: 100
      });

      const eventsByType: Record<string, number> = {};
      events.forEach(event => {
        eventsByType[event.action] = (eventsByType[event.action] || 0) + 1;
      });

      return {
        totalEvents: events.length,
        recentEvents: events.slice(0, 10),
        eventsByType
      };
    } catch (error) {
      console.error('Failed to get audit summary:', error);
      return {
        totalEvents: 0,
        recentEvents: [],
        eventsByType: {}
      };
    }
  }

  /**
   * Export audit logs for compliance
   */
  static async exportAuditLogs(
    query: AuditQuery,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const events = await this.queryAuditLogs(query);

    if (format === 'csv') {
      return this.convertToCSV(events);
    }

    return JSON.stringify(events, null, 2);
  }

  /**
   * Verify audit log integrity
   */
  static async verifyAuditIntegrity(userId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    try {
      const events = await this.queryAuditLogs({ userId });
      const issues: string[] = [];

      // Check for gaps in timestamps
      for (let i = 1; i < events.length; i++) {
        const current = new Date(events[i].timestamp!);
        const previous = new Date(events[i - 1].timestamp!);
        
        if (current > previous) {
          issues.push(`Timestamp order issue at event ${i}`);
        }
      }

      // Check for required fields
      events.forEach((event, index) => {
        if (!event.action) {
          issues.push(`Missing action at event ${index}`);
        }
        if (!event.resourceType) {
          issues.push(`Missing resourceType at event ${index}`);
        }
        if (!event.timestamp) {
          issues.push(`Missing timestamp at event ${index}`);
        }
      });

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Failed to verify audit integrity: ${error}`]
      };
    }
  }

  /**
   * Save audit event to database
   */
  private static async saveToDatabase(event: AuditEvent): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action: event.action,
        resource_type: event.resourceType,
        resource_id: event.resourceId,
        user_id: event.userId,
        metadata: event.metadata,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        created_at: event.timestamp?.toISOString()
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Save audit event to local storage (offline fallback)
   */
  private static saveToLocalStorage(event: AuditEvent): void {
    try {
      const existingLogs = localStorage.getItem('audit_logs_offline');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push({
        ...event,
        timestamp: event.timestamp?.toISOString()
      });

      // Keep only last 1000 events in local storage
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      localStorage.setItem('audit_logs_offline', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save audit log to local storage:', error);
    }
  }

  /**
   * Sync local audit logs to database
   */
  private static async syncLocalAuditLogs(): Promise<void> {
    if (this.localAuditQueue.length === 0) return;

    try {
      const eventsToSync = [...this.localAuditQueue];
      this.localAuditQueue = [];

      for (const event of eventsToSync) {
        await this.saveToDatabase(event);
      }

      console.log(`Synced ${eventsToSync.length} audit events`);
    } catch (error) {
      console.error('Failed to sync audit logs:', error);
      // Put events back in queue for retry
      this.localAuditQueue.unshift(...this.localAuditQueue);
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private static async getClientIP(): Promise<string | undefined> {
    try {
      // In a real application, you might use a service to get the real IP
      // For now, we'll return undefined and let the server handle it
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Convert audit events to CSV format
   */
  private static convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return '';

    const headers = [
      'timestamp',
      'action',
      'resourceType',
      'resourceId',
      'userId',
      'ipAddress',
      'userAgent',
      'metadata'
    ];

    const csvRows = [headers.join(',')];

    events.forEach(event => {
      const row = [
        event.timestamp?.toISOString() || '',
        event.action || '',
        event.resourceType || '',
        event.resourceId || '',
        event.userId || '',
        event.ipAddress || '',
        event.userAgent || '',
        JSON.stringify(event.metadata || {}).replace(/"/g, '""')
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}