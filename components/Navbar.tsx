
import React from 'react';
import { User, UserRole } from '../types';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  toggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout, toggleSidebar }) => {
  return (
    <nav className="h-16 bg-white border-b border-slate-200 fixed top-0 w-full z-50 flex items-center justify-between px-4 lg:px-8 shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Only show menu button if user is logged in (sidebar context usually implies logged in) */}
        {currentUser && (
          <button onClick={toggleSidebar} className="lg:hidden text-slate-500">
            <Menu />
          </button>
        )}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden">
             <Logo className="w-full h-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 leading-tight">
              CROWNGATE
            </span>
            <span className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase">
              Dental Technologies
            </span>
          </div>
        </div>
      </div>

      {currentUser && (
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800">{currentUser.fullName}</span>
            <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">
              {currentUser.role === UserRole.DOCTOR && currentUser.relatedEntity 
                ? currentUser.relatedEntity 
                : currentUser.role}
            </span>
          </div>

          <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-bold border border-brand-200">
             <UserIcon size={16} />
          </div>
          
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