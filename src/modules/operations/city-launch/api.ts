import { CityLaunch, WaitlistConfig, WaitlistEntry } from './types';

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

let mockConfig: WaitlistConfig = {
  requireInviteCode: true,
  autoApproveWaitlist: false,
  maxDailyInvites: 50,
};

const mockEntries: WaitlistEntry[] = [
  { id: 'WL-01', email: 'test1@example.com', phone: '+919876543210', city: 'Mumbai', signupDate: new Date().toISOString(), status: 'PENDING' },
  { id: 'WL-02', email: 'test2@example.com', phone: '+919876543211', city: 'Delhi', signupDate: new Date(Date.now() - 86400000).toISOString(), status: 'APPROVED' },
];

export const cityLaunchApi = {
  getLaunches: async (): Promise<CityLaunch[]> => {
    return [...mockLaunches];
  },
  
  updateStatus: async (id: string, status: CityLaunch['status']): Promise<void> => {
    const launch = mockLaunches.find(l => l.id === id);
    if (!launch) return;
    
    // ITEM 3: Link City Launch's "Go Live" Action to Master Data's Cities List
    if (status === 'LIVE' && launch.status !== 'LIVE') {
      try {
        const { masterDataApi } = await import('@/modules/system/master-data/api');
        const cities = await masterDataApi.getCities();
        const existingCity = cities.find(c => c.name.en.toLowerCase() === launch.cityName.toLowerCase());
        
        if (existingCity) {
          if (!existingCity.active) {
            await masterDataApi.toggleCity(existingCity.id);
          }
        } else {
          await masterDataApi.addCity({
            name: { en: launch.cityName },
            state: launch.region,
            country: 'India',
            active: true
          });
        }
      } catch (err) {
        console.error('Failed to update Master Data:', err);
      }
    }

    mockLaunches = mockLaunches.map(l => l.id === id ? { ...l, status } : l);
  },

  createLaunch: async (data: { cityName: string; region: string; targetLaunchDate: string; managerName: string }): Promise<void> => {
    const newId = `CITY-${(mockLaunches.length + 1).toString().padStart(3, '0')}`;
    const newLaunch: CityLaunch = {
      ...data,
      id: newId,
      status: 'PLANNING',
      checklist: [
        { id: `${newId}-CHK-1`, task: 'Onboard 50 initial companions', completed: false },
        { id: `${newId}-CHK-2`, task: 'Verify local emergency contacts', completed: false },
        { id: `${newId}-CHK-3`, task: 'Configure local venue whitelist', completed: false },
        { id: `${newId}-CHK-4`, task: 'Marketing pre-launch campaign', completed: false },
      ]
    };
    mockLaunches = [newLaunch, ...mockLaunches];
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
  },

  getConfig: async (): Promise<WaitlistConfig> => Promise.resolve({ ...mockConfig }),
  updateConfig: async (config: WaitlistConfig): Promise<void> => {
    mockConfig = { ...config };
    return Promise.resolve();
  },
  getEntries: async (): Promise<WaitlistEntry[]> => Promise.resolve([...mockEntries]),
  approveEntry: async (id: string): Promise<void> => {
    const e = mockEntries.find(x => x.id === id);
    if (e) e.status = 'APPROVED';
    return Promise.resolve();
  }
};
