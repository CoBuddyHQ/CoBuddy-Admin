export interface TrainingLesson {
  id: string;
  title: string;
  category: 'SAFETY' | 'ONBOARDING' | 'BEST_PRACTICES';
  status: 'DRAFT' | 'PUBLISHED';
  completionCount: number;
  lastUpdated: string;
}

export interface SafetyQuiz {
  passCriteriaPercentage: number;
  totalQuestions: number;
  activeCompanionsPassed: number;
}
