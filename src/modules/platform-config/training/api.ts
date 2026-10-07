import { unavailableFeature } from '@/lib/unavailable-feature';
import { TrainingLesson, SafetyQuiz } from './types';
export const trainingApi = {
  getLessons: async (): Promise<TrainingLesson[]> => {
    return unavailableFeature('platform-config/training');
  },
  updateLessonStatus: async (_id: string, _status: TrainingLesson['status']): Promise<void> => {
    return unavailableFeature('platform-config/training');
  },
  createLesson: async (
    _data: Omit<TrainingLesson, 'id' | 'status' | 'completionCount' | 'lastUpdated'>,
  ): Promise<void> => {
    return unavailableFeature('platform-config/training');
  },
  deleteLesson: async (_id: string): Promise<void> => {
    return unavailableFeature('platform-config/training');
  },
  getQuizStats: async (): Promise<SafetyQuiz> => {
    return unavailableFeature('platform-config/training');
  },
};
