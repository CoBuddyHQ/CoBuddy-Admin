import { CompanionApplication, ApplicationDecisionPayload } from './types';

const mockApplications: CompanionApplication[] = [
  {
    id: 'APP-1002',
    applicantName: 'Neha Gupta',
    email: 'neha.g@example.com',
    phone: '+91 9876543211',
    city: 'Mumbai',
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
    dateOfBirth: '1995-06-15',
    gender: 'Female',
    bio: 'Looking forward to showing people around my beautiful city.',
    backgroundCheckStatus: 'PENDING'
  },
  {
    id: 'APP-1001',
    applicantName: 'Rahul Singh',
    email: 'rahul.s@example.com',
    phone: '+91 9876543212',
    city: 'Delhi',
    status: 'IN_REVIEW',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    assignedTo: 'Admin User',
    trustScore: 85,
    dateOfBirth: '1992-04-20',
    gender: 'Male',
    bio: 'History buff and foodie.',
    backgroundCheckStatus: 'PASSED'
  }
];

export const companionAppApi = {
  getApplications: async (): Promise<CompanionApplication[]> => {
    return Promise.resolve([...mockApplications]);
  },

  getApplication: async (id: string): Promise<CompanionApplication> => {
    const app = mockApplications.find(a => a.id === id);
    if (!app) throw new Error('Application not found');
    return Promise.resolve({ ...app });
  },

  assignApplication: async (id: string, staffName: string): Promise<CompanionApplication> => {
    const app = mockApplications.find(a => a.id === id);
    if (!app) throw new Error('Application not found');
    app.assignedTo = staffName;
    app.status = 'IN_REVIEW';
    return Promise.resolve(app);
  },

  submitDecision: async (payload: ApplicationDecisionPayload): Promise<CompanionApplication> => {
    const app = mockApplications.find(a => a.id === payload.id);
    if (!app) throw new Error('Application not found');
    app.status = payload.decision === 'APPROVE' ? 'APPROVED' : 
                 payload.decision === 'REJECT' ? 'REJECTED' : 'WAITLISTED';
    app.interviewNotes = payload.notes;
    return Promise.resolve(app);
  }
};
