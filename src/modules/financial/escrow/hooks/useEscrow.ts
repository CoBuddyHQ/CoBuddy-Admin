import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escrowApi } from '../api';
import { toast } from 'sonner';

export const useEscrow = (escrowPage: number, walletPage: number) => {
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({
    queryKey: ['escrow-records', escrowPage],
    queryFn: () => escrowApi.getRecords(escrowPage),
  });
  const walletsQuery = useQuery({
    queryKey: ['wallets', walletPage],
    queryFn: () => escrowApi.getWallets(walletPage),
  });
  const releaseMutation = useMutation({
    mutationFn: escrowApi.releaseEscrow,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['escrow-records'] }),
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
        queryClient.invalidateQueries({ queryKey: ['revenue-stats'] }),
      ]);
      toast.success('Escrow released');
    },
    onError: () =>
      toast.error('Escrow could not be released. Refresh and check the booking status.'),
  });
  return { recordsQuery, walletsQuery, releaseMutation };
};
