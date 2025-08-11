// Production Service Factory - Uses real services only

// Import real services
import { AuthService as RealAuthService } from './auth.service';
import { AssessmentService as RealAssessmentService } from './assessment.service';

/**
 * Service Factory - Production mode uses real services only
 */

// Auth Service - Production
export const AuthService = RealAuthService;

// Assessment Service - Production
export const AssessmentService = RealAssessmentService;

// Export service types for consistency
export type { SignUpData, SignInData, AuthResponse } from './auth.service';
export type { 
  AssessmentEngine,
  AssessmentSession,
  TestType,
  Question,
  TestResponse,
  AssessmentResult,
  ValidationResult,
  AssessmentProgress,
  TestDefinition
} from '../types/assessment';