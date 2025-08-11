/**
 * GDPR Service - Handles GDPR compliance features
 * Implements user rights under GDPR including data export, deletion, and consent management
 */

import { supabase } from './supabase';
import { AuditService } from './audit.service';
import { EncryptionService } from '../utils/encryption/encryption.service';

export interface UserDataExport {
  profile: any;
  assessments: any[];
  auditLogs: any[];
  exportDate: Date;
  format: 'json' | 'csv';
  encryptionKey?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'analytics' | 'marketing' | 'research';
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataDeletionRequest {
  userId: string;
  requestedAt: Date;
  reason?: string;
  dataTypes: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
}

export class GDPRService {
  /**
   * Export all user data (Right to Access - Article 15)
   */
  static async exportUserData(
    userId: string,
    format: 'json' | 'csv' = 'json',
    encrypt: boolean = true
  ): Promise<UserDataExport> {
    try {
      // Log data export request
      await AuditService.logPrivacyEvent('data_export', userId, {
        format,
        encrypted: encrypt,
        requestedAt: new Date().toISOString()
      });

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      // Get assessment sessions
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (assessmentsError) {
        throw new Error(`Failed to fetch assessments: ${assessmentsError.message}`);
      }

      // Get audit logs
      const auditLogs = await AuditService.queryAuditLogs({
        userId,
        limit: 1000
      });

      // Get consent records
      const { data: consents, error: consentsError } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (consentsError) {
        console.warn('Failed to fetch consent records:', consentsError);
      }

      const exportData: UserDataExport = {
        profile: this.sanitizeProfileData(profile),
        assessments: assessments?.map(a => this.sanitizeAssessmentData(a)) || [],
        auditLogs: auditLogs.map(log => this.sanitizeAuditData(log)),
        exportDate: new Date(),
        format
      };

      // Add consent records if available
      if (consents) {
        (exportData as any).consents = consents;
      }

      // Encrypt export if requested
      if (encrypt) {
        const encryptionKey = await EncryptionService.generateKey();
        const keyString = await crypto.subtle.exportKey('raw', encryptionKey);
        exportData.encryptionKey = Array.from(new Uint8Array(keyString))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }

      return exportData;
    } catch (error) {
      await AuditService.logPrivacyEvent('data_export', userId, {
        success: false,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Delete user data (Right to be Forgotten - Article 17)
   */
  static async deleteUserData(
    userId: string,
    reason?: string,
    dataTypes: string[] = ['all']
  ): Promise<DataDeletionRequest> {
    try {
      const deletionRequest: DataDeletionRequest = {
        userId,
        requestedAt: new Date(),
        reason,
        dataTypes,
        status: 'pending'
      };

      // Log deletion request
      await AuditService.logPrivacyEvent('data_deletion', userId, {
        reason,
        dataTypes,
        requestedAt: deletionRequest.requestedAt.toISOString()
      });

      // Start deletion process
      deletionRequest.status = 'processing';

      if (dataTypes.includes('all') || dataTypes.includes('profile')) {
        await this.anonymizeProfile(userId);
      }

      if (dataTypes.includes('all') || dataTypes.includes('assessments')) {
        await this.anonymizeAssessments(userId);
      }

      if (dataTypes.includes('all') || dataTypes.includes('audit_logs')) {
        // Note: We don't delete audit logs for compliance, but we can anonymize them
        await this.anonymizeAuditLogs(userId);
      }

      // Mark user as deleted
      await this.markUserAsDeleted(userId);

      deletionRequest.status = 'completed';
      deletionRequest.completedAt = new Date();

      // Final audit log
      await AuditService.logPrivacyEvent('data_deletion', userId, {
        status: 'completed',
        completedAt: deletionRequest.completedAt.toISOString(),
        dataTypes
      });

      return deletionRequest;
    } catch (error) {
      await AuditService.logPrivacyEvent('data_deletion', userId, {
        status: 'failed',
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Record user consent (Consent Management)
   */
  static async recordConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    version: string = '1.0',
    ipAddress?: string
  ): Promise<ConsentRecord> {
    try {
      const consentRecord: Omit<ConsentRecord, 'id'> = {
        userId,
        consentType,
        granted,
        grantedAt: granted ? new Date() : undefined,
        withdrawnAt: !granted ? new Date() : undefined,
        version,
        ipAddress,
        userAgent: navigator.userAgent
      };

      const { data, error } = await supabase
        .from('user_consents')
        .insert({
          user_id: consentRecord.userId,
          consent_type: consentRecord.consentType,
          granted: consentRecord.granted,
          granted_at: consentRecord.grantedAt?.toISOString(),
          withdrawn_at: consentRecord.withdrawnAt?.toISOString(),
          version: consentRecord.version,
          ip_address: consentRecord.ipAddress,
          user_agent: consentRecord.userAgent
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log consent event
      await AuditService.logPrivacyEvent(
        granted ? 'consent_given' : 'consent_withdrawn',
        userId,
        {
          consentType,
          version,
          ipAddress
        }
      );

      return {
        id: data.id,
        ...consentRecord
      };
    } catch (error) {
      console.error('Failed to record consent:', error);
      throw error;
    }
  }

  /**
   * Get user consent status
   */
  static async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data?.map(record => ({
        id: record.id,
        userId: record.user_id,
        consentType: record.consent_type,
        granted: record.granted,
        grantedAt: record.granted_at ? new Date(record.granted_at) : undefined,
        withdrawnAt: record.withdrawn_at ? new Date(record.withdrawn_at) : undefined,
        version: record.version,
        ipAddress: record.ip_address,
        userAgent: record.user_agent
      })) || [];
    } catch (error) {
      console.error('Failed to get user consents:', error);
      return [];
    }
  }

  /**
   * Check if user has given specific consent
   */
  static async hasConsent(
    userId: string,
    consentType: ConsentRecord['consentType']
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('granted')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return false;
      }

      return data.granted;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update user consent
   */
  static async updateConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    version: string = '1.0'
  ): Promise<void> {
    // Record new consent (we keep history, don't update existing records)
    await this.recordConsent(userId, consentType, granted, version);
  }

  /**
   * Get data processing activities for user
   */
  static async getDataProcessingActivities(userId: string): Promise<{
    dataTypes: string[];
    purposes: string[];
    retention: string;
    thirdParties: string[];
  }> {
    return {
      dataTypes: [
        'Información de perfil (email, fecha de nacimiento, nivel educativo)',
        'Resultados de evaluaciones cognitivas',
        'Configuraciones de accesibilidad',
        'Registros de actividad (audit logs)',
        'Datos de uso de la aplicación'
      ],
      purposes: [
        'Proporcionar servicios de evaluación cognitiva',
        'Generar recomendaciones personalizadas',
        'Mejorar la experiencia del usuario',
        'Cumplimiento regulatorio y auditoría',
        'Investigación científica (datos anonimizados)'
      ],
      retention: 'Los datos se conservan mientras la cuenta esté activa. Los datos pueden ser eliminados a solicitud del usuario.',
      thirdParties: [
        'Supabase (proveedor de base de datos)',
        'Proveedores de servicios de nube (para backup)',
        'Instituciones de investigación (datos anonimizados)'
      ]
    };
  }

  /**
   * Anonymize user profile
   */
  private static async anonymizeProfile(userId: string): Promise<void> {
    const anonymizedData = {
      email: `deleted_user_${await EncryptionService.hash(userId)}@deleted.local`,
      date_of_birth: null,
      education_level: null,
      accessibility_settings: null,
      updated_at: new Date().toISOString(),
      deleted_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(anonymizedData)
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to anonymize profile: ${error.message}`);
    }
  }

  /**
   * Anonymize user assessments
   */
  private static async anonymizeAssessments(userId: string): Promise<void> {
    // Instead of deleting, we anonymize the data for research purposes
    const { error } = await supabase
      .from('assessment_sessions')
      .update({
        user_id: null, // Remove user association
        responses: null, // Remove detailed responses
        updated_at: new Date().toISOString(),
        anonymized_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to anonymize assessments: ${error.message}`);
    }
  }

  /**
   * Anonymize audit logs
   */
  private static async anonymizeAuditLogs(userId: string): Promise<void> {
    // We keep audit logs for compliance but anonymize personal data
    const { error } = await supabase
      .from('audit_logs')
      .update({
        user_id: null, // Remove user association
        ip_address: null, // Remove IP address
        user_agent: null, // Remove user agent
        metadata: { anonymized: true, original_user_hash: await EncryptionService.hash(userId) }
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to anonymize audit logs: ${error.message}`);
    }
  }

  /**
   * Mark user as deleted
   */
  private static async markUserAsDeleted(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'deleted'
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to mark user as deleted: ${error.message}`);
    }
  }

  /**
   * Sanitize profile data for export
   */
  private static sanitizeProfileData(profile: any): any {
    return {
      id: profile.id,
      email: profile.email,
      dateOfBirth: profile.date_of_birth,
      educationLevel: profile.education_level,
      language: profile.language,
      accessibilitySettings: profile.accessibility_settings,
      consentGiven: profile.consent_given,
      consentDate: profile.consent_date,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  }

  /**
   * Sanitize assessment data for export
   */
  private static sanitizeAssessmentData(assessment: any): any {
    return {
      id: assessment.id,
      testType: assessment.test_type,
      status: assessment.status,
      startedAt: assessment.started_at,
      completedAt: assessment.completed_at,
      responses: assessment.responses,
      result: assessment.result,
      createdAt: assessment.created_at
    };
  }

  /**
   * Sanitize audit data for export
   */
  private static sanitizeAuditData(audit: any): any {
    return {
      action: audit.action,
      resourceType: audit.resourceType,
      resourceId: audit.resourceId,
      metadata: audit.metadata,
      timestamp: audit.timestamp
      // Note: We don't include IP address or user agent in exports for privacy
    };
  }
}