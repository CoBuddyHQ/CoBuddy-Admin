import { TrainingLesson, SafetyQuiz } from './types';

let mockLessons: TrainingLesson[] = [
  {
    id: 'TRN-001',
    title: 'Recognizing Unsafe Situations',
    category: 'SAFETY',
    status: 'PUBLISHED',
    completionCount: 1542,
    lastUpdated: '2023-09-15'
  },
  {
    id: 'TRN-002',
    title: 'How to use the SOS Button',
    category: 'SAFETY',
    status: 'PUBLISHED',
    completionCount: 1890,
    lastUpdated: '2023-08-22'
  },
  {
    id: 'TRN-003',
    title: 'Engaging Conversation Starters',
    category: 'BEST_PRACTICES',
    status: 'DRAFT',
    completionCount: 0,
    lastUpdated: '2023-10-25'
  }
];

const mockQuiz: SafetyQuiz = {
  passCriteriaPercentage: 80,
  totalQuestions: 15,
  activeCompanionsPassed: 1420
};

export const trainingApi = {
  getLessons: async (): Promise<TrainingLesson[]> => {
    return [...mockLessons];
  },
  
  updateLessonStatus: async (id: string, status: TrainingLesson['status']): Promise<void> => {
    mockLessons = mockLessons.map(l => l.id === id ? { ...l, status, lastUpdated: new Date().toISOString().split('T')[0] } : l);
  },

  deleteLesson: async (id: string): Promise<void> => {
    mockLessons = mockLessons.filter(l => l.id !== id);
  },

  getQuizStats: async (): Promise<SafetyQuiz> => {
    return { ...mockQuiz };
  }
};
