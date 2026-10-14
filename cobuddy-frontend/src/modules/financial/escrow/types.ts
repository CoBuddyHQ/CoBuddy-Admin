export interface EscrowRecord {
  id: string;
  bookingRef: string;
  status: string;
  customer: { id: string; name: string };
  companion: { id: string; name: string } | null;
  companionNetAmount: string;
  platformFeeAmount: string;
  escrowReleaseAt: string;
}

export interface WalletRecord {
  id: string;
  ownerType: string;
  currency: string;
  balance: string;
  customer: { id: string; name: string } | null;
  companion: { id: string; name: string } | null;
  updatedAt: string;
}

export interface Page<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
