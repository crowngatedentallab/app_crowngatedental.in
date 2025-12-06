import React, { useState, useEffect } from 'react';
import { sheetService } from '../services/sheetService';
import { Order, OrderStatus, User } from '../types';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

interface TechnicianViewProps {
  user: User;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');

  useEffect(() => {
    loadOrders();
    const unsubscribe = sheetService.subscribe(loadOrders);
    return unsubscribe;
  }, [user]);

  const loadOrders = async () => {
    const all = await sheetService.getOrders();
    // STRICT FILTER: Only show orders assigned to the logged-in technician
    const myWork = all.filter(o => o.assignedTech === user.fullName);
    setOrders(myWork);
  };

  const advanceStatus = async (order: Order) => {
    const statuses = Object.values(OrderStatus);
    const currentIndex = statuses.indexOf(order.status);
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1];
      await sheetService.updateOrder(order.id, { status: nextStatus });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Expects YYYY-MM-DD from sheetService normalization
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    }
    return dateString;
  };

  const todoOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.DISPATCHED);
  const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.DISPATCHED);
  
  const displayedOrders = activeTab === 'todo' ? todoOrders : completedOrders;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 mt-16 pb-20 bg-slate-50 min-h-screen">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
            <h1 className="text-xl font-bold text-slate-900">Lab Station</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Lock size={10} /> {user.fullName} • Logged In
            </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
        <button 
          onClick={() => setActiveTab('todo')}
          className={`flex-1 py-2.5 text-sm font-bold rounded transition-all ${activeTab === 'todo' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          My Queue ({todoOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 text-sm font-bold rounded transition-all ${activeTab === 'completed' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          History ({completedOrders.length})
        </button>
      </div>

      <div className="space-y-4">
        {displayedOrders.map(order => (
          <div key={order.id} className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm relative overflow-hidden group">
            {/* Priority Strip */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${order.priority === 'Urgent' ? 'bg-red-500' : 'bg-brand-500'}`} />

            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 rounded">{order.id}</span>
                    <span className={`text-xs font-bold ${order.priority === 'Urgent' ? 'text-red-600' : 'text-slate-400'}`}>
                        Due: {formatDate(order.dueDate)}
                    </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{order.typeOfWork}</h3>
                <p className="text-slate-600 text-sm mt-1 mb-3">Patient: {order.patientName}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="block text-[10px] uppercase text-slate-400">Shade</span>
                        <span className="font-bold text-slate-800">{order.shade}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="block text-[10px] uppercase text-slate-400">Tooth</span>
                        <span className="font-bold text-slate-800">{order.toothNumber}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <StatusBadge status={order.status} />
                    
                    {activeTab === 'todo' && (
                      <button 
                          onClick={() => advanceStatus(order)}
                          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded shadow-sm hover:bg-brand-700 active:scale-95 transition-all"
                      >
                          <span className="text-sm font-bold">Complete {order.status}</span>
                          <ArrowRight size={16} />
                      </button>
                    )}
                </div>
            </div>
          </div>
        ))}
        {displayedOrders.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-lg border border-slate-200 border-dashed">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-slate-200" />
            <p>No orders found in {activeTab}.</p>
          </div>
        )}
      </div>
    </div>
  );
};