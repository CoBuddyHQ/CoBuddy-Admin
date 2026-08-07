import { create } from 'zustand';
import { StaffUser, StaffRole } from '../types/role.types';

interface AuthState {
  user: StaffUser | null;
  isAuthenticated: boolean;
  login: (user: StaffUser) => void;
  logout: () => void;
  hasRole: (role: StaffRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: 'mock-superadmin',
    name: 'Admin User',
    email: 'admin@cobuddy.com',
    roles: [StaffRole.SUPER_ADMIN]
  },
  isAuthenticated: true,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  hasRole: (role) => {
    const user = get().user;
    return user ? user.roles.includes(role) : false;
  }
}));
