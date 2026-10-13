export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  totalBookings: number;
  walletBalance: number;
  flags: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}

export interface BookingHistoryEntry {
  id: string;
  date: string;
  companionName: string;
  activity: string;
  venue: string;
  status: 'COMPLETED' | 'CANCELLED' | 'UPCOMING';
  amount: number;
}

export interface TransactionEntry {
  id: string;
  date: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
}
