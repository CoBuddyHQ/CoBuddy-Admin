export interface SpecialEvent {
  id: string;
  cityId: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkedCategory?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
