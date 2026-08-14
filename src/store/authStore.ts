import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StaffUser, StaffRole } from '../types/role.types';

interface AuthState {
  user: StaffUser | null;
  isAuthenticated: boolean;
  login: (user: StaffUser) => void;
  logout: () => void;
  hasRole: (role: StaffRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      hasRole: (role) => {
        const user = get().user;
        return user ? user.roles.includes(role) : false;
      }
    }),
    {
      name: 'auth-storage', // unique name
    }
  )
);
