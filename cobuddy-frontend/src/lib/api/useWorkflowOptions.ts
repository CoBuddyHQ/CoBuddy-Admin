'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from './client';
import { masterDataApi } from '@/modules/system/master-data/api';
import type {
  AppLanguage,
  PlaceTypeConfig,
  TicketCategory,
  NotificationCategoryOption,
} from '@/modules/system/master-data/types';

type Options = {
  appLanguages: AppLanguage[];
  placeTypes: PlaceTypeConfig[];
  ticketCategories: TicketCategory[];
  notificationCategories: NotificationCategoryOption[];
};
export function useWorkflowOptions() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['workflow-options'],
    meta: { workflow: true },
    throwOnError: true,
    queryFn: async () => (await axios.get<{ data: Options }>('/admin-options/workflow')).data.data,
  });
  const toggle = useMutation({
    mutationFn: masterDataApi.togglePlaceTypeAllowed,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workflow-options'] });
    },
  });
  return {
    appLanguages: query.data?.appLanguages ?? [],
    placeTypes: query.data?.placeTypes ?? [],
    ticketCategories: query.data?.ticketCategories ?? [],
    notificationCategories: query.data?.notificationCategories ?? [],
    isLoading: query.isLoading,
    togglePlaceTypeAllowed: toggle.mutate,
  };
}
