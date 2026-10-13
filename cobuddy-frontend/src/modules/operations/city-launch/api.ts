import axios from '@/lib/api/client';
import { CityLaunch, WaitlistConfig, WaitlistEntry } from './types';
export const cityLaunchApi = {
  getLaunches: async (): Promise<CityLaunch[]> => {
    return (await axios.get('/operations/city-launch')).data.data;
  },
  updateStatus: async (id: string, status: CityLaunch['status']): Promise<void> => {
    await axios.patch('/operations/city-launch/' + encodeURIComponent(id) + '/status', { status });
  },
  createLaunch: async (data: {
    cityName: string;
    region: string;
    targetLaunchDate: string;
    managerName: string;
  }): Promise<void> => {
    await axios.post('/operations/city-launch', data);
  },
  toggleChecklistTask: async (id: string, taskId: string, completed: boolean): Promise<void> => {
    await axios.patch(
      '/operations/city-launch/' +
        encodeURIComponent(id) +
        '/checklist/' +
        encodeURIComponent(taskId) +
        '',
      { completed },
    );
  },
  getConfig: async (): Promise<WaitlistConfig> => {
    return (await axios.get('/operations/city-launch/waitlist/config')).data.data;
  },
  updateConfig: async (config: WaitlistConfig): Promise<void> => {
    await axios.put('/operations/city-launch/waitlist/config', config);
  },
  getEntries: async (): Promise<WaitlistEntry[]> => {
    return (await axios.get('/operations/city-launch/waitlist')).data.data;
  },
  approveEntry: async (id: string): Promise<void> => {
    await axios.post('/operations/city-launch/waitlist/' + encodeURIComponent(id) + '/approve');
  },
};
