import axios from '@/lib/api/client';
import { SystemConfig } from './types';

const CONFIG_KEY = 'admin-system-config';

const unwrap = (response: any) => response.data.data?.data ?? response.data.data;

export const configApi = {
  getConfig: async (): Promise<SystemConfig> => {
    const response = await axios.get('/system/app-configs/key/' + CONFIG_KEY);
    const value = unwrap(response)?.value;
    if (!value || typeof value !== 'object')
      throw new Error('System configuration is not set up yet.');
    return value as SystemConfig;
  },

  updateConfig: async (payload: SystemConfig): Promise<SystemConfig> => {
    const response = await axios.put('/system/app-configs/key/' + CONFIG_KEY, { value: payload });
    const value = unwrap(response)?.value;
    if (!value || typeof value !== 'object')
      throw new Error('System configuration is not set up yet.');
    return value as SystemConfig;
  },

  updateActivityMultiplier: async (activityId: string, multiplier: number): Promise<void> => {
    await axios.patch('/master-data/interests/' + activityId + '/multiplier', {
      basePriceMultiplier: multiplier,
    });
  },
};
