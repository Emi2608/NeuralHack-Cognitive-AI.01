import { supabase } from './supabase';
import type { 
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
import { getTestDefinition } from '../constants/testDefinitions';
import { ScoringEngine } from '../utils/scoring/scoringRules';
import { RecommendationEngine } from '../utils/scoring/recommendationEngine';
import type { UserProfile } from '../types/user';

export class AssessmentService implements AssessmentEngine {
  /**
   * Create a new assessment session
   */
  static async createSession(userId: string, testType: TestType): Promise<AssessmentSession> {
    try {
      const testDefinition = getTestDefinition(testType);
      
      const sessionData = {
        user_id: userId,
        test_type: testType,
        status: 'not_started',
        current_question_index: 0,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        responses: [],
        metadata: {
          deviceInfo: this.getDeviceInfo(),
          environmentInfo: this.getEnvironmentInfo(),
          accessibilitySettings: await this.getAccessibilitySettings(userId),
          interruptions: [],
          totalPauseTime: 0
        }
      };

      const { data, error } = await supabase
        .from('assessment_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseToSession(data);
    } catch (error) {
      console.error('Error creating assessment session:', error);
      throw new Error('Failed to create assessment session');
    }
  }

  /**
   * Get an existing assessment session
   */
  static async getSession(sessionId: string): Promise<AssessmentSession | null> {
    try {
      const { data, error } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Session not found
        }
        throw error;
      }

      return this.mapDatabaseToSession(data);
    } catch (error) {
      console.error('Error getting assessment session:', error);
      return null;
    }
  }

  /**
   * Update an assessment session
   */
  static async updateSession(sessionId: string, updates: Partial<AssessmentSession>): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.status) updateData.status = updates.status;
      if (updates.currentQuestionIndex !== undefined) updateData.current_question_index = updates.currentQuestionIndex;
      if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();
      if (updates.responses) updateData.responses = updates.responses;
      if (updates.result) updateData.result = updates.result;
      if (updates.metadata) updateData.metadata = updates.metadata;

      updateData.last_activity_at = new Date().toISOString();

      const { error } = await supabase
        .from('assessment_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating assessment session:', error);
      throw new Error('Failed to update assessment session');
    }
  }

  /**
   * Get the current question for a session
   */
  static async getCurrentQuestion(sessionId: string): Promise<Question | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      const testDefinition = getTestDefinition(session.testType);
      const allQuestions = this.getAllQuestions(testDefinition);

      if (session.currentQuestionIndex >= allQuestions.length) {
        return null; // Assessment completed
      }

      return allQuestions[session.currentQuestionIndex];
    } catch (error) {
      console.error('Error getting current question:', error);
      return null;
    }
  }

  /**
   * Get the next question for a session
   */
  static async getNextQuestion(sessionId: string): Promise<Question | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      const testDefinition = getTestDefinition(session.testType);
      const allQuestions = this.getAllQuestions(testDefinition);
      const nextIndex = session.currentQuestionIndex + 1;

      if (nextIndex >= allQuestions.length) {
        return null; // No more questions
      }

      return allQuestions[nextIndex];
    } catch (error) {
      console.error('Error getting next question:', error);
      return null;
    }
  }

  /**
   * Get the previous question for a session
   */
  static async getPreviousQuestion(sessionId: string): Promise<Question | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      const testDefinition = getTestDefinition(session.testType);
      const allQuestions = this.getAllQuestions(testDefinition);
      const prevIndex = session.currentQuestionIndex - 1;

      if (prevIndex < 0) {
        return null; // No previous question
      }

      return allQuestions[prevIndex];
    } catch (error) {
      console.error('Error getting previous question:', error);
      return null;
    }
  }

  /**
   * Submit a response to a question
   */
  static async submitResponse(sessionId: string, response: TestResponse): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Validate the response
      const validation = await this.validateResponse(response.questionId, response.answer);
      if (!validation.isValid) {
        throw new Error(`Invalid response: ${validation.errors.join(', ')}`);
      }

      // Add the response to the session
      const updatedResponses = [...session.responses];
      const existingIndex = updatedResponses.findIndex(r => r.questionId === response.questionId);
      
      if (existingIndex >= 0) {
        updatedResponses[existingIndex] = response;
      } else {
        updatedResponses.push(response);
      }

      // Update session status if this is the first response
      let status = session.status;
      if (status === 'not_started') {
        status = 'in_progress';
      }

      // Move to next question
      const currentQuestionIndex = session.currentQuestionIndex + 1;
      const testDefinition = getTestDefinition(session.testType);
      const allQuestions = this.getAllQuestions(testDefinition);

      // Check if assessment is completed
      if (currentQuestionIndex >= allQuestions.length) {
        status = 'completed';
      }

      await this.updateSession(sessionId, {
        responses: updatedResponses,
        currentQuestionIndex,
        status,
        completedAt: status === 'completed' ? new Date() : undefined
      });

      // Auto-save progress
      await this.saveProgress(sessionId);

    } catch (error) {
      console.error('Error submitting response:', error);
      throw new Error('Failed to submit response');
    }
  }

  /**
   * Validate a response
   */
  static async validateResponse(questionId: string, answer: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (answer === null || answer === undefined || answer === '') {
      errors.push('Respuesta requerida');
    }

    // Type-specific validation
    if (typeof answer === 'string' && answer.trim().length === 0) {
      errors.push('La respuesta no puede estar vacía');
    }

    if (typeof answer === 'number' && (isNaN(answer) || !isFinite(answer))) {
      errors.push('Debe ser un número válido');
    }

    // Question-specific validation could be added here
    // For now, we'll keep it simple

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get assessment history for a user
   */
  async getAssessmentHistory(userId: string): Promise<AssessmentResult[]> {
    try {
      const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get assessment history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting assessment history:', error);
      throw new Error('Failed to get assessment history');
    }
  }

  /**
   * Calculate the score for a completed assessment
   */
  static async calculateScore(sessionId: string): Promise<AssessmentResult> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'completed') {
        throw new Error('Assessment not completed');
      }

      // Get user profile for scoring context
      const userProfile = await this.getUserProfile(session.userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const scoringContext = {
        userProfile: {
          age: this.calculateAge(userProfile.dateOfBirth),
          educationLevel: userProfile.educationLevel,
          language: userProfile.language
        },
        previousResponses: session.responses,
        testMetadata: {}
      };

      // Calculate the score
      const result = ScoringEngine.calculateScore(
        session.testType,
        session.responses,
        scoringContext
      );

      // Set session ID and completion time
      result.sessionId = sessionId;
      result.completionTime = session.completedAt && session.startedAt 
        ? (session.completedAt.getTime() - session.startedAt.getTime()) / 1000
        : 0;

      // Generate recommendations
      result.recommendations = RecommendationEngine.generateRecommendations(result, userProfile);

      // Save the result to the session
      await this.updateSession(sessionId, { result });

      return result;
    } catch (error) {
      console.error('Error calculating score:', error);
      throw new Error('Failed to calculate score');
    }
  }

  /**
   * Generate recommendations based on assessment result
   */
  static async generateRecommendations(result: AssessmentResult, userProfile: any): Promise<any[]> {
    return RecommendationEngine.generateRecommendations(result, userProfile);
  }

  /**
   * Get assessment progress
   */
  static async getProgress(sessionId: string): Promise<AssessmentProgress> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const testDefinition = getTestDefinition(session.testType);
      const allQuestions = this.getAllQuestions(testDefinition);
      const totalQuestions = allQuestions.length;
      const answeredQuestions = session.responses.length;
      const percentComplete = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

      // Estimate remaining time based on average response time
      const avgResponseTime = this.calculateAverageResponseTime(session.responses);
      const remainingQuestions = totalQuestions - answeredQuestions;
      const estimatedTimeRemaining = Math.ceil((remainingQuestions * avgResponseTime) / 60000); // in minutes

      // Get current section
      const currentQuestion = await this.getCurrentQuestion(sessionId);
      const currentSection = currentQuestion?.section || '';

      return {
        sessionId,
        testType: session.testType,
        totalQuestions,
        answeredQuestions,
        currentSection,
        percentComplete: Math.round(percentComplete),
        estimatedTimeRemaining,
        canGoBack: session.currentQuestionIndex > 0,
        canSkip: false // Most cognitive tests don't allow skipping
      };
    } catch (error) {
      console.error('Error getting progress:', error);
      throw new Error('Failed to get progress');
    }
  }

  /**
   * Save progress (auto-save functionality)
   */
  static async saveProgress(sessionId: string): Promise<void> {
    try {
      // Progress is automatically saved when responses are submitted
      // This method can be used for additional progress tracking if needed
      const session = await this.getSession(sessionId);
      if (session) {
        await this.updateSession(sessionId, {
          lastActivityAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      // Don't throw error for auto-save failures
    }
  }

  /**
   * Get test definition
   */
  static async getTestDefinition(testType: TestType): Promise<TestDefinition> {
    return getTestDefinition(testType);
  }

  /**
   * Get available tests
   */
  static async getAvailableTests(): Promise<TestType[]> {
    return ['moca', 'phq9']; // Only return implemented tests
  }

  // Helper methods

  private static getAllQuestions(testDefinition: TestDefinition): Question[] {
    const questions: Question[] = [];
    
    testDefinition.sections.forEach(section => {
      section.questions.forEach(question => {
        questions.push(question);
      });
    });

    // Sort by order
    return questions.sort((a, b) => a.order - b.order);
  }

  private static mapDatabaseToSession(data: any): AssessmentSession {
    return {
      id: data.id,
      userId: data.user_id,
      testType: data.test_type,
      status: data.status,
      currentQuestionIndex: data.current_question_index,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      lastActivityAt: new Date(data.last_activity_at),
      responses: data.responses || [],
      result: data.result,
      metadata: data.metadata || {
        deviceInfo: this.getDeviceInfo(),
        environmentInfo: this.getEnvironmentInfo(),
        accessibilitySettings: {
          highContrast: false,
          fontSize: 'normal',
          voiceGuidance: false,
          keyboardNavigation: false,
          touchTargetSize: 'normal'
        },
        interruptions: [],
        totalPauseTime: 0
      }
    };
  }

  private static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      deviceType: this.getDeviceType(),
      touchSupport: 'ontouchstart' in window
    };
  }

  private static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.screen.width;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private static getEnvironmentInfo() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      location: undefined, // Would need geolocation permission
      networkType: (navigator as any).connection?.effectiveType
    };
  }

  private static async getAccessibilitySettings(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('accessibility_settings')
        .eq('id', userId)
        .single();

      return data?.accessibility_settings || {
        highContrast: false,
        fontSize: 'normal',
        voiceGuidance: false,
        keyboardNavigation: false,
        touchTargetSize: 'normal'
      };
    } catch (error) {
      return {
        highContrast: false,
        fontSize: 'normal',
        voiceGuidance: false,
        keyboardNavigation: false,
        touchTargetSize: 'normal'
      };
    }
  }

  private static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        dateOfBirth: new Date(data.date_of_birth),
        educationLevel: data.education_level,
        language: data.language,
        accessibilitySettings: data.accessibility_settings,
        consentGiven: data.consent_given,
        consentDate: new Date(data.consent_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      return null;
    }
  }

  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  private static calculateAverageResponseTime(responses: TestResponse[]): number {
    if (responses.length === 0) return 30000; // Default 30 seconds

    const totalTime = responses.reduce((sum, response) => sum + response.responseTime, 0);
    return totalTime / responses.length;
  }
}