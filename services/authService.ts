
import { sheetService } from './sheetService';
import { User } from '../types';

export const authService = {
  login: async (username: string, password: string): Promise<User | null> => {
    const users = await sheetService.getUsers();
    
    // In a real app, do NOT store plain text passwords. This is for the demo/sheet prototype only.
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
      // Persist session
      sessionStorage.setItem('crowngate_user', JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => {
    sessionStorage.removeItem('crowngate_user');
  },

  getCurrentUser: (): User | null => {
    const stored = sessionStorage.getItem('crowngate_user');
    return stored ? JSON.parse(stored) : null;
  }
};
