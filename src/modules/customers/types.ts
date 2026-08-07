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
