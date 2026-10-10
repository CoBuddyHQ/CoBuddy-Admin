import axios from '@/lib/api/client';
import { AppConfig } from './types';

const CONFIG_KEY = 'admin-app-config';
const unwrap = (response: any) => response.data.data?.data ?? response.data.data;

export const appConfigsApi = {
  getConfig: async (): Promise<AppConfig> => {
    const response = await axios.get('/system/app-configs/key/' + CONFIG_KEY);
    const value = unwrap(response)?.value;
    if (!value) throw new Error('App configuration has not been initialized');
    return value as AppConfig;
  },
  updateConfig: async (config: AppConfig): Promise<void> => {
    await axios.put('/system/app-configs/key/' + CONFIG_KEY, { value: config });
  },
};
