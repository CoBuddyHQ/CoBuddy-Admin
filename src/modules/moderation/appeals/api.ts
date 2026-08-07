import { AppealItem } from './types';

const mockAppeals: AppealItem[] = [
  { id: 'APP-001', userId: 'CompB', userName: 'Bob', originalBanReason: 'Severe policy violation', appealStatement: 'It was a misunderstanding, here is the proof.', status: 'PENDING', submittedAt: new Date().toISOString() }
];

export const appealsApi = {
  getAppeals: async (): Promise<AppealItem[]> => Promise.resolve([...mockAppeals]),
  resolveAppeal: async (id: string, action: 'UPHELD' | 'REVERSED' | 'REDUCED_TO_WARNING'): Promise<void> => {
    const a = mockAppeals.find(x => x.id === id);
    if (a) {
      a.status = action;
    }
    return Promise.resolve();
  }
};
