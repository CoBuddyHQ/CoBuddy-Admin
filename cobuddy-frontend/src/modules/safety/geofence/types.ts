export interface GeofenceAlert {
  id: string;
  sessionId: string;
  companionId: string;
  companionName: string;
  expectedLocation: string; // e.g. "Cafe Coffee Day, Bandra"
  actualLocation: string; // coordinates or address
  breachSeverity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
  status: 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED';
}
