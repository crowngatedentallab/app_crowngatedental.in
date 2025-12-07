import React from 'react';
import { OrderStatus } from '../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.SUBMITTED]: 'bg-slate-100 text-slate-600 border-slate-200',
  [OrderStatus.RECEIVED]: 'bg-blue-100 text-blue-700',
  [OrderStatus.DESIGNING]: 'bg-purple-100 text-purple-700',
  [OrderStatus.MILLING]: 'bg-indigo-100 text-indigo-700',
  [OrderStatus.GLAZING]: 'bg-pink-100 text-pink-700',
  [OrderStatus.QUALITY_CHECK]: 'bg-orange-100 text-orange-700',
  [OrderStatus.DISPATCHED]: 'bg-teal-100 text-teal-700',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-700',

  // New Statuses
  [OrderStatus.METAL_COPING]: 'bg-zinc-200 text-zinc-700',
  [OrderStatus.BISQUE_TRIAL]: 'bg-amber-100 text-amber-800',
  [OrderStatus.METAL_TRIAL]: 'bg-slate-200 text-slate-700',
  [OrderStatus.PROCESSING]: 'bg-sky-100 text-sky-700',
  [OrderStatus.TEETH_ARRANGEMENT]: 'bg-rose-100 text-rose-700',
  [OrderStatus.TRIAL_WORK]: 'bg-fuchsia-100 text-fuchsia-700',
};

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider font-semibold border ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
};