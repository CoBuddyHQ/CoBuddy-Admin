import { EmergencyWorkflow } from './types';

let mockWorkflows: EmergencyWorkflow[] = [
  { id: 'EWF-001', sosAlertId: 'SOS-991', status: 'STEP_1_CONTACT_USER', log: [{ timestamp: new Date().toISOString(), action: 'Workflow initiated.', handledBy: 'System' }], createdAt: new Date().toISOString() }
];

export const emergencyWorkflowApi = {
  getWorkflows: async (): Promise<EmergencyWorkflow[]> => Promise.resolve([...mockWorkflows]),
  advanceStep: async (id: string, newStatus: EmergencyWorkflow['status'], actionDetail: string, handler: string): Promise<void> => {
    const wf = mockWorkflows.find(w => w.id === id);
    if (wf) {
      wf.status = newStatus;
      wf.log.push({ timestamp: new Date().toISOString(), action: actionDetail, handledBy: handler });
    }
    return Promise.resolve();
  }
};
