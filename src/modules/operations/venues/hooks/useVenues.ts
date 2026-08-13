import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venuesApi } from '../api';
import { toast } from 'sonner';
import { FeaturedVenue } from '../types';
export const useVenues = () => {
  const queryClient = useQueryClient();

  const venuesQuery = useQuery({
    queryKey: ['featured-venues'],
    queryFn: venuesApi.getFeaturedVenues,
  });


  const toggleVenueMutation = useMutation({
    mutationFn: venuesApi.toggleVenueActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
      toast.success('Venue status updated');
    },
  });

  const deleteVenueMutation = useMutation({
    mutationFn: venuesApi.deleteVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
      toast.success('Venue deleted');
    },
  });


  const createVenueMutation = useMutation({
    mutationFn: (data: Omit<FeaturedVenue, 'id' | 'isActive'>) => venuesApi.createFeaturedVenue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-venues'] });
      toast.success('Venue added successfully');
    },
  });

  return {
    venues: venuesQuery.data ?? [],
    isLoading: venuesQuery.isLoading,
    toggleVenue: toggleVenueMutation.mutate,
    deleteVenue: deleteVenueMutation.mutate,
    createVenue: createVenueMutation.mutate,
  };
};
