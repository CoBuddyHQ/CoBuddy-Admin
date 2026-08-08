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

  const placeTypesQuery = useQuery({
    queryKey: ['place-types'],
    queryFn: venuesApi.getPlaceTypes,
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

  const togglePlaceTypeMutation = useMutation({
    mutationFn: venuesApi.togglePlaceTypeAllowed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place-types'] });
      toast.success('Place category rule updated');
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
    placeTypes: placeTypesQuery.data ?? [],
    isLoading: venuesQuery.isLoading || placeTypesQuery.isLoading,
    toggleVenue: toggleVenueMutation.mutate,
    deleteVenue: deleteVenueMutation.mutate,
    togglePlaceType: togglePlaceTypeMutation.mutate,
    createVenue: createVenueMutation.mutate,
  };
};
