import { unavailableFeature } from '@/lib/unavailable-feature';
import { CityLaunch, WaitlistConfig, WaitlistEntry } from './types';
export const cityLaunchApi = {
  getLaunches: async (): Promise<CityLaunch[]> => {
    return unavailableFeature('operations/city-launch');
  },
  updateStatus: async (_id: string, _status: CityLaunch['status']): Promise<void> => {
    return unavailableFeature('operations/city-launch');
  },
  createLaunch: async (_data: {
    cityName: string;
    region: string;
    targetLaunchDate: string;
    managerName: string;
  }): Promise<void> => {
    return unavailableFeature('operations/city-launch');
  },
  toggleChecklistTask: async (_cityId: string, _taskId: string): Promise<void> => {
    return unavailableFeature('operations/city-launch');
  },
  getConfig: async (): Promise<WaitlistConfig> => {
    return unavailableFeature('operations/city-launch');
  },
  updateConfig: async (_config: WaitlistConfig): Promise<void> => {
    return unavailableFeature('operations/city-launch');
  },
  getEntries: async (): Promise<WaitlistEntry[]> => {
    return unavailableFeature('operations/city-launch');
  },
  approveEntry: async (_id: string): Promise<void> => {
    return unavailableFeature('operations/city-launch');
  },
};
