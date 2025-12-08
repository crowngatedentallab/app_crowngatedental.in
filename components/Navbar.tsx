import React from 'react';
import { User, UserRole } from '../types';
import { Menu, LogOut, User as UserIcon, RefreshCw } from 'lucide-react';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  toggleSidebar: () => void;
  onNavigate?: (view: 'dashboard' | 'notifications') => void;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout, toggleSidebar, onNavigate, onRefresh }) => {
  return (
    <nav className="h-16 bg-white border-b border-slate-200 fixed top-0 w-full z-50 flex items-center justify-between px-4 lg:px-8 shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Mobile menu removed as per user request */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate && onNavigate('dashboard')}>
          <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0">
            <Logo className="w-full h-full" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-lg font-bold text-slate-900 leading-tight truncate max-w-[150px] md:max-w-none">
              CROWNGATE
            </span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase truncate hidden xs:block md:block">
              The Oral Prosthetic Centre
            </span>
          </div>
        </div>
      </div>

      {currentUser && (
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-brand-600 transition-colors rounded-full hover:bg-slate-50"
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>

          <NotificationBell user={currentUser} onClick={() => onNavigate && onNavigate('notifications')} />

          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-red-600 transition-colors p-2"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      )}
    </nav>
  );
};