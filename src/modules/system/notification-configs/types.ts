export interface NotificationConfig {
  fcmServerKey: string;
  apnsKeyId: string;
  apnsTeamId: string;
  apnsTopic: string;
  smsProvider: 'TWILIO' | 'MSG91' | 'AWS_SNS';
  smsApiKey: string;
  enableSmsFallback: boolean;
}
