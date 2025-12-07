import React from 'react';
import { Home, Users, Package, BarChart2, CheckSquare, Clock, PlusCircle } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, userRole }) => {

  let tabs = [];

  if (userRole === 'ADMIN') {
    tabs = [
      { id: 'orders', icon: Home, label: 'Orders' },
      { id: 'users', icon: Users, label: 'Users' },
      { id: 'products', icon: Package, label: 'Products' },
      { id: 'workload', icon: BarChart2, label: 'Stats' },
    ];
  } else if (userRole === 'DOCTOR') {
    tabs = [
      { id: 'orders', icon: Home, label: 'My Orders' },
      // Doctors mainly just view orders for now
    ];
  } else if (userRole === 'TECHNICIAN') {
    tabs = [
      { id: 'todo', icon: CheckSquare, label: 'To Do' },
      { id: 'history', icon: Clock, label: 'History' },
    ];
  }

  if (tabs.length <= 1) return null; // Don't show if simple view or no tabs

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
