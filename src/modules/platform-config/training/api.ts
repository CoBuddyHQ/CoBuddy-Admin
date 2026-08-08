import { TrainingLesson, SafetyQuiz } from './types';

let mockLessons: TrainingLesson[] = [
  {
    id: 'TRN-001',
    title: { en: 'Recognizing Unsafe Situations', hi: 'असुरक्षित स्थितियों को पहचानना' },
    content: { en: 'Content for recognizing unsafe situations...', hi: 'असुरक्षित स्थितियों को पहचानने के लिए सामग्री...' },
    category: 'SAFETY',
    status: 'PUBLISHED',
    completionCount: 1542,
    lastUpdated: '2023-09-15'
  },
  {
    id: 'TRN-002',
    title: { en: 'How to use the SOS Button', hi: 'एसओएस बटन का उपयोग कैसे करें' },
    content: { en: 'Content for SOS button...', hi: 'एसओएस बटन के लिए सामग्री...' },
    category: 'SAFETY',
    status: 'PUBLISHED',
    completionCount: 1890,
    lastUpdated: '2023-08-22'
  },
  {
    id: 'TRN-003',
    title: { en: 'Engaging Conversation Starters', hi: 'आकर्षक वार्तालाप शुरुआत' },
    content: { en: 'Content for conversation starters...', hi: 'वार्तालाप शुरुआत के लिए सामग्री...' },
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

  createLesson: async (data: Omit<TrainingLesson, 'id' | 'status' | 'completionCount' | 'lastUpdated'>): Promise<void> => {
    const newLesson: TrainingLesson = {
      ...data,
      id: `TRN-00${mockLessons.length + 1}`,
      status: 'DRAFT',
      completionCount: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    mockLessons = [newLesson, ...mockLessons];
  },

  deleteLesson: async (id: string): Promise<void> => {
    mockLessons = mockLessons.filter(l => l.id !== id);
  },

  getQuizStats: async (): Promise<SafetyQuiz> => {
    return { ...mockQuiz };
  }
};
