// Assessment-related types
export type TestType = 'moca' | 'phq9' | 'mmse' | 'ad8' | 'parkinsons';

export type RiskCategory = 'low' | 'moderate' | 'high';

export type QuestionType = 
  | 'multiple_choice' 
  | 'likert_scale' 
  | 'yes_no' 
  | 'numeric_input' 
  | 'drawing_task' 
  | 'memory_task' 
  | 'attention_task'
  | 'text_input'
  | 'instruction_following';

export interface SectionScore {
  sectionId: string;
  name: string;
  score: number;
  maxScore: number;
  items: { id: string; score: number }[];
}

export interface TestResponse {
  questionId: string;
  answer: string | number | boolean | DrawingData;
  timestamp: Date;
  responseTime: number;
  metadata?: Record<string, any>;
}

export interface DrawingData {
  strokes: Stroke[];
  canvasSize: { width: number; height: number };
  totalTime: number;
}

export interface Stroke {
  points: Point[];
  timestamp: number;
  pressure?: number;
}

export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  instructions?: string;
  options?: QuestionOption[];
  validation?: ValidationRule[];
  scoring?: ScoringRule;
  section?: string;
  order: number;
  required: boolean;
  timeLimit?: number; // in seconds
  metadata?: Record<string, any>;
}

export interface QuestionOption {
  value: string | number;
  label: string;
  score?: number;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customValidator?: (answer: any) => boolean;
}

export interface ScoringRule {
  type: 'direct' | 'lookup' | 'calculated' | 'custom';
  points?: number;
  lookup?: Record<string | number, number>;
  formula?: string;
  customScorer?: (answer: any, context: ScoringContext) => number;
}

export interface ScoringContext {
  userProfile: ScoringUserProfile;
  previousResponses: TestResponse[];
  testMetadata: Record<string, any>;
}

export interface TestDefinition {
  id: TestType;
  name: string;
  fullName: string;
  description: string;
  duration: number; // estimated duration in minutes
  sections: TestSection[];
  scoringConfig: TestScoringConfig;
  riskMapping: RiskMapping;
  metadata: TestMetadata;
}

export interface TestSection {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  order: number;
  timeLimit?: number;
  instructions?: string;
}

export interface TestScoringConfig {
  maxScore: number;
  minScore: number;
  sections?: SectionScoring[];
  adjustments?: ScoreAdjustment[];
  formula?: string;
}

export interface SectionScoring {
  sectionId: string;
  maxScore: number;
  weight?: number;
}

export interface ScoreAdjustment {
  type: 'education' | 'age' | 'language';
  condition: AdjustmentCondition;
  adjustment: number;
  description: string;
}

export interface AdjustmentCondition {
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: any;
}

export interface RiskMapping {
  testType?: TestType;
  ranges?: RiskRange[];
  scoreRanges?: ScoreRange[];
  demographicAdjustments?: DemographicAdjustment[];
  algorithm?: 'linear' | 'threshold' | 'custom' | 'weighted_threshold';
  customCalculator?: (score: number, context: ScoringContext) => RiskAssessment;
}

export interface RiskRange {
  category: RiskCategory;
  scoreRange: { min: number; max: number };
  riskRange: { min: number; max: number };
  description: string;
  recommendations: string[];
}

export interface TestMetadata {
  version: string;
  language: string;
  validatedPopulation: string[];
  clinicalReferences: string[];
  lastUpdated: Date;
  author: string;
  license: string;
  notes?: string[];
}

export interface AssessmentResult {
  id: string;
  sessionId: string;
  testType: TestType;
  totalScore: number;
  maxScore: number;
  rawScore: number;
  adjustedScore: number;
  sectionScores: SectionScore[];
  riskAssessment: RiskAssessment;
  riskPercentage: number;
  recommendations: Recommendation[];
  completedAt: string;
  duration: number; // in seconds
  completionTime: number; // in seconds
  responses: TestResponse[];
  metadata: Record<string, any>;
}

export interface RiskAssessment {
  testType: TestType;
  rawScore: number;
  adjustedScore: number;
  riskPercentage: number;
  riskCategory: RiskCategory;
  confidenceInterval: [number, number];
  factors: RiskFactor[];
  calculatedAt: Date;
  algorithm: string;
  metadata?: Record<string, any>;
}



export interface ScoreRange {
  min: number;
  max: number;
  riskPercentage: number;
  category: RiskCategory;
}

export interface DemographicAdjustment {
  factor: 'age' | 'education' | 'gender';
  adjustment: number;
  condition?: string;
}

export interface RiskFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface Recommendation {
  id: string;
  testType: TestType;
  type?: 'lifestyle' | 'medical' | 'monitoring' | 'educational';
  category: 'lifestyle' | 'medical' | 'monitoring' | 'educational' | 'immediate' | 'short_term' | 'long_term';
  riskLevel: RiskCategory;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency' | 'urgent';
  actionSteps?: string[];
  resources?: RecommendationResource[];
  followUpDays?: number;
}

export interface RecommendationResource {
  type: 'article' | 'video' | 'contact' | 'app' | 'website' | 'guide' | 'organization' | 'program';
  title: string;
  url?: string;
  description?: string;
}

export interface AssessmentSession {
  id: string;
  userId: string;
  testType: TestType;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned' | 'expired';
  currentQuestionIndex: number;
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  responses: TestResponse[];
  result?: AssessmentResult;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  deviceInfo: DeviceInfo;
  environmentInfo: EnvironmentInfo;
  accessibilitySettings: AccessibilitySettings;
  interruptions: Interruption[];
  totalPauseTime: number;
}

export interface DeviceInfo {
  userAgent: string;
  screenSize: { width: number; height: number };
  deviceType: 'mobile' | 'tablet' | 'desktop';
  touchSupport: boolean;
}

export interface EnvironmentInfo {
  timezone: string;
  language: string;
  location?: string;
  networkType?: string;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  voiceGuidance: boolean;
  keyboardNavigation: boolean;
  touchTargetSize: 'normal' | 'large';
}

export interface UserProfile {
  userId: string;
  age: number;
  dateOfBirth: Date;
  educationLevel: number; // years of education
  gender?: 'male' | 'female' | 'other';
  language: 'es' | 'en';
  consentGiven: boolean;
  consentDate: Date;
  accessibilitySettings?: AccessibilitySettings;
}

// Extended user profile for scoring context
export interface ScoringUserProfile {
  age: number;
  educationLevel: number;
  language: string;
  gender?: 'male' | 'female' | 'other';
}

export interface Interruption {
  type: 'pause' | 'resume' | 'background' | 'foreground';
  timestamp: Date;
  duration?: number;
  reason?: string;
}

// Assessment Engine Interface
export interface AssessmentEngine {
  // Session management
  createSession(userId: string, testType: TestType): Promise<AssessmentSession>;
  getSession(sessionId: string): Promise<AssessmentSession | null>;
  updateSession(sessionId: string, updates: Partial<AssessmentSession>): Promise<void>;
  
  // Question flow
  getCurrentQuestion(sessionId: string): Promise<Question | null>;
  getNextQuestion(sessionId: string): Promise<Question | null>;
  getPreviousQuestion(sessionId: string): Promise<Question | null>;
  
  // Response handling
  submitResponse(sessionId: string, response: TestResponse): Promise<void>;
  validateResponse(questionId: string, answer: any): Promise<ValidationResult>;
  
  // Scoring and results
  calculateScore(sessionId: string): Promise<AssessmentResult>;
  generateRecommendations(result: AssessmentResult, userProfile: any): Promise<Recommendation[]>;
  
  // Progress tracking
  getProgress(sessionId: string): Promise<AssessmentProgress>;
  saveProgress(sessionId: string): Promise<void>;
  
  // Test definitions
  getTestDefinition(testType: TestType): Promise<TestDefinition>;
  getAvailableTests(): Promise<TestType[]>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AssessmentProgress {
  sessionId: string;
  testType: TestType;
  totalQuestions: number;
  answeredQuestions: number;
  currentSection: string;
  percentComplete: number;
  estimatedTimeRemaining: number; // in minutes
  canGoBack: boolean;
  canSkip: boolean;
}

// Specific test type interfaces
export interface MoCAResponse extends TestResponse {
  sectionType: 'visuospatial' | 'naming' | 'memory' | 'attention' | 'language' | 'abstraction' | 'delayed_recall' | 'orientation';
  drawingData?: DrawingData;
}

export interface PHQ9Response extends TestResponse {
  likertValue: 0 | 1 | 2 | 3; // Not at all, Several days, More than half the days, Nearly every day
}

export interface MMSEResponse extends TestResponse {
  sectionType: 'orientation' | 'registration' | 'attention_calculation' | 'recall' | 'language';
}

export interface AD8Response extends TestResponse {
  informantResponse: boolean; // true if answered by informant, false if self-reported
}

export interface ParkinsonsResponse extends TestResponse {
  sectionType: 'motor_symptoms' | 'non_motor_symptoms' | 'daily_activities';
  severity?: 'none' | 'mild' | 'moderate' | 'severe';
}

// Test-specific result interfaces
export interface MoCAResult extends AssessmentResult {
  mocaSectionScores: {
    visuospatial: number;
    naming: number;
    memory: number;
    attention: number;
    language: number;
    abstraction: number;
    delayed_recall: number;
    orientation: number;
  };
  educationAdjustment: number;
  drawingAnalysis?: DrawingAnalysis;
}

export interface DrawingAnalysis {
  clockDrawing: {
    score: number;
    features: ClockFeature[];
  };
  cubeDrawing: {
    score: number;
    features: CubeFeature[];
  };
}

export interface ClockFeature {
  feature: 'circle' | 'numbers' | 'hands' | 'time_accuracy';
  present: boolean;
  score: number;
}

export interface CubeFeature {
  feature: '3d_perspective' | 'parallel_lines' | 'depth' | 'proportions';
  present: boolean;
  score: number;
}

export interface PHQ9Result extends AssessmentResult {
  severityLevel: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  suicidalIdeation: boolean;
  functionalImpairment: 'none' | 'mild' | 'moderate' | 'severe';
}

export interface MMSEResult extends AssessmentResult {
  cognitiveImpairment: 'none' | 'mild' | 'moderate' | 'severe';
  mmseSectionScores: {
    orientation: number;
    registration: number;
    attention_calculation: number;
    recall: number;
    language: number;
  };
}

export interface AD8Result extends AssessmentResult {
  dementiaProbability: 'low' | 'moderate' | 'high';
  informantBased: boolean;
}

export interface ParkinsonsResult extends AssessmentResult {
  motorScore: number;
  nonMotorScore: number;
  dailyActivitiesScore: number;
  parkinsonsProbability: 'low' | 'moderate' | 'high';
  recommendedActions: string[];
}
