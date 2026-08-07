import { CityLaunch } from './types';

let mockLaunches: CityLaunch[] = [
  {
    id: 'CITY-001',
    cityName: 'Pune',
    region: 'Maharashtra',
    targetLaunchDate: '2023-12-01',
    status: 'IN_PROGRESS',
    managerName: 'Kunal',
    checklist: [
      { id: 'CHK-1', task: 'Onboard 50 initial companions', completed: true },
      { id: 'CHK-2', task: 'Verify local emergency contacts', completed: true },
      { id: 'CHK-3', task: 'Configure local venue whitelist', completed: false },
      { id: 'CHK-4', task: 'Marketing pre-launch campaign', completed: false },
    ]
  },
  {
    id: 'CITY-002',
    cityName: 'Indore',
    region: 'Madhya Pradesh',
    targetLaunchDate: '2024-01-15',
    status: 'PLANNING',
    managerName: 'Aditi',
    checklist: [
      { id: 'CHK-5', task: 'Market research & demand mapping', completed: true },
      { id: 'CHK-6', task: 'Hire local city manager', completed: false },
    ]
  }
];

export const cityLaunchApi = {
  getLaunches: async (): Promise<CityLaunch[]> => {
    return [...mockLaunches];
  },
  
  updateStatus: async (id: string, status: CityLaunch['status']): Promise<void> => {
    mockLaunches = mockLaunches.map(l => l.id === id ? { ...l, status } : l);
  },

  toggleChecklistTask: async (cityId: string, taskId: string): Promise<void> => {
    mockLaunches = mockLaunches.map(l => {
      if (l.id === cityId) {
        return {
          ...l,
          checklist: l.checklist.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return l;
    });
  }
};
