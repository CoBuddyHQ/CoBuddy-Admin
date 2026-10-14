export interface AppConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  forceUpdateIos: boolean;
  minVersionIos: string;
  forceUpdateAndroid: boolean;
  minVersionAndroid: string;
  maxDailyBookingsPerUser: number;
}
