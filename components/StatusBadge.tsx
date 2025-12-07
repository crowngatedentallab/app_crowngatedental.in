import React from 'react';
import { OrderStatus } from '../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.SUBMITTED]: 'bg-slate-100 text-slate-600 border-slate-200', // Gray
  [OrderStatus.DESIGNING]: 'bg-blue-100 text-blue-700', // Blue
  [OrderStatus.METAL_COPING]: 'bg-zinc-200 text-zinc-700',
  [OrderStatus.BISQUE_TRIAL]: 'bg-amber-100 text-amber-800',
  [OrderStatus.METAL_TRIAL]: 'bg-slate-200 text-slate-700',
  [OrderStatus.PROCESSING]: 'bg-sky-100 text-sky-700',
  [OrderStatus.TEETH_ARRANGEMENT]: 'bg-rose-100 text-rose-700',
  [OrderStatus.TRIAL_WORK]: 'bg-fuchsia-100 text-fuchsia-700',
  [OrderStatus.MILLING]: 'bg-indigo-100 text-indigo-700',
  [OrderStatus.GLAZING]: 'bg-orange-100 text-orange-700', // Orange as requested
  [OrderStatus.DISPATCHED]: 'bg-[#3BB54A]/10 text-[#3BB54A] border-[#3BB54A]/20', // Green #3BB54A
  [OrderStatus.DELIVERED]: 'bg-[#3BB54A]/10 text-[#3BB54A] border-[#3BB54A]/20', // Green #3BB54A
};

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider font-semibold border ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
};