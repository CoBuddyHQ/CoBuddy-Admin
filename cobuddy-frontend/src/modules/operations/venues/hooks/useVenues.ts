import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venuesApi } from '../api';
import { toast } from 'sonner';
import { FeaturedVenue } from '../types';
export const useVenues = () => {
  const queryClient = useQueryClient();

  const venuesQuery = useQuery({
    throwOnError: true,
    meta: { workflow: true },
    queryKey: ['featured-venues'],
    queryFn: venuesApi.getFeaturedVenues,
  });

  const toggleVenueMutation = useMutation({
    meta: { workflow: true },
    mutationFn: venuesApi.toggleVenueActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
      toast.success('Venue status updated');
    },
  });

  const deleteVenueMutation = useMutation({
    meta: { workflow: true },
    mutationFn: venuesApi.deleteVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
      toast.success('Venue deleted');
    },
  });

  const createVenueMutation = useMutation({
    meta: { workflow: true },
    mutationFn: (data: Omit<FeaturedVenue, 'id' | 'isActive'>) =>
      venuesApi.createFeaturedVenue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
      toast.success('Venue added successfully');
    },
  });

  const updateVenueMutation = useMutation({
    meta: { workflow: true },
    mutationFn: venuesApi.updateFeaturedVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
      toast.success('Venue updated');
    },
  });

  return {
    venues: venuesQuery.data ?? [],
    isLoading: venuesQuery.isLoading,
    toggleVenue: toggleVenueMutation.mutate,
    deleteVenue: deleteVenueMutation.mutate,
    createVenue: createVenueMutation.mutateAsync,
    updateVenue: updateVenueMutation.mutateAsync,
  };
};
