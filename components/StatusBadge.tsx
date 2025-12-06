import React from 'react';
import { OrderStatus } from '../types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.SUBMITTED]: 'bg-slate-100 text-slate-600 border-slate-200',
  [OrderStatus.RECEIVED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [OrderStatus.DESIGNING]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [OrderStatus.MILLING]: 'bg-amber-50 text-amber-700 border-amber-200', // Industrial feel
  [OrderStatus.GLAZING]: 'bg-orange-50 text-orange-700 border-orange-200',
  [OrderStatus.QUALITY_CHECK]: 'bg-rose-50 text-rose-700 border-rose-200',
  [OrderStatus.DISPATCHED]: 'bg-brand-50 text-brand-700 border-brand-200',
  [OrderStatus.DELIVERED]: 'bg-green-50 text-green-700 border-green-200',
};

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider font-semibold border ${STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
};