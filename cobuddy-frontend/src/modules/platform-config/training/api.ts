import axios from '@/lib/api/client';
import { TrainingLesson, SafetyQuiz } from './types';
export const trainingApi = {
  updateLesson: async ({
    id,
    data,
  }: {
    id: string;
    data: {
      title: Record<string, string>;
      content?: Record<string, string>;
      category: TrainingLesson['category'];
    };
  }): Promise<void> => {
    await axios.put('/platform-config/training/' + encodeURIComponent(id), data);
  },
  getLessons: async (): Promise<TrainingLesson[]> => {
    return (await axios.get('/platform-config/training')).data.data;
  },
  updateLessonStatus: async (id: string, status: TrainingLesson['status']): Promise<void> => {
    await axios.patch('/platform-config/training/' + encodeURIComponent(id) + '/status', {
      status,
    });
  },
  createLesson: async (
    data: Omit<TrainingLesson, 'id' | 'status' | 'completionCount' | 'lastUpdated'>,
  ): Promise<void> => {
    await axios.post('/platform-config/training', data);
  },
  deleteLesson: async (id: string): Promise<void> => {
    await axios.delete('/platform-config/training/' + encodeURIComponent(id) + '');
  },
  getQuizStats: async (): Promise<SafetyQuiz> => {
    return (await axios.get('/platform-config/training/quiz')).data.data;
  },
};
