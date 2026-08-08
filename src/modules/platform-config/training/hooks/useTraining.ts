import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingApi } from '../api';
import { toast } from 'sonner';
import { TrainingLesson } from '../types';

export const useTraining = () => {
  const queryClient = useQueryClient();

  const lessonsQuery = useQuery({
    queryKey: ['training-lessons'],
    queryFn: trainingApi.getLessons,
  });

  const quizQuery = useQuery({
    queryKey: ['safety-quiz'],
    queryFn: trainingApi.getQuizStats,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrainingLesson['status'] }) => trainingApi.updateLessonStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['training-lessons'] });
      toast.success(`Lesson ${status === 'PUBLISHED' ? 'published' : 'moved to drafts'}`);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: trainingApi.deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-lessons'] });
      toast.success('Lesson deleted');
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: Omit<TrainingLesson, 'id' | 'status' | 'completionCount' | 'lastUpdated'>) => trainingApi.createLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-lessons'] });
      toast.success('Lesson created successfully');
    },
  });

  return {
    lessons: lessonsQuery.data ?? [],
    quizStats: quizQuery.data,
    isLoading: lessonsQuery.isLoading || quizQuery.isLoading,
    updateStatus: updateStatusMutation.mutate,
    deleteLesson: deleteLessonMutation.mutate,
    createLesson: createLessonMutation.mutate,
  };
};
