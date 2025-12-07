import React from 'react';
import { OrderStatus } from '../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.SUBMITTED]: 'bg-gray-100 text-gray-700 border-gray-200',
  [OrderStatus.DESIGNING]: 'bg-blue-50 text-blue-700 border-blue-100',
  [OrderStatus.METAL_COPING]: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  [OrderStatus.BISQUE_TRIAL]: 'bg-amber-50 text-amber-700 border-amber-100',
  [OrderStatus.METAL_TRIAL]: 'bg-slate-100 text-slate-700 border-slate-200',
  [OrderStatus.PROCESSING]: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  [OrderStatus.TEETH_ARRANGEMENT]: 'bg-rose-50 text-rose-700 border-rose-100',
  [OrderStatus.TRIAL_WORK]: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  [OrderStatus.MILLING]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  [OrderStatus.GLAZING]: 'bg-orange-50 text-orange-700 border-orange-100',
  [OrderStatus.DISPATCHED]: 'bg-[#34A853]/10 text-[#34A853] border-[#34A853]/20',
  [OrderStatus.DELIVERED]: 'bg-[#34A853] text-white border-[#34A853]', // Solid Green as requested for "Completed" vibe
};

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider font-semibold border ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
};