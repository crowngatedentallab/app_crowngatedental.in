
import React, { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Order, OrderStatus, User } from '../types';
import { LogOut, Filter, CheckSquare, Clock, ChevronRight, Lock, CheckCircle2, Stethoscope } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { MobileNav } from '../components/MobileNav';
import { Modal } from '../components/Modal';
import { authService } from '../services/authService';
import { CaseActionForm } from '../components/CaseActionForm';

interface TechnicianViewProps {
  user: User;
  refreshTrigger?: number;
  initialOrderId?: string;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({ user, refreshTrigger }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'todo' | 'history'>('todo');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
    // Realtime subscription removed for MVP migration
  }, [user]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadOrders();
    }
  }, [refreshTrigger]);

  const loadOrders = async () => {
    // Get orders where I am assigned OR I was previously assigned
    const all = await firestoreService.getOrders();
    const myWork = all.filter(o =>
      o.assignedTech === user.fullName ||
      (o.technicianHistory && o.technicianHistory.includes(user.fullName))
    );
    setOrders(myWork);

    const users = await firestoreService.getUsers();
    setTechnicians(users.filter(u => u.role === 'TECHNICIAN'));
  };

  const openActionModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleActionSubmit = async (updates: Partial<Order>) => {
    if (selectedOrder) {
      await firestoreService.updateOrder(selectedOrder.id, updates);
      setIsModalOpen(false);
      setSelectedOrder(null);
      loadOrders();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Expects YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    }
    return dateString;
  };

  // Todo: Assigned to me AND not completed
  const todoOrders = orders.filter(o =>
    o.assignedTech === user.fullName &&
    o.status !== OrderStatus.DELIVERED &&
    o.status !== OrderStatus.DISPATCHED
  );

  // History: (Completed) OR (Assigned to someone else but I worked on it)
  const completedOrders = orders.filter(o =>
    o.status === OrderStatus.DELIVERED ||
    o.status === OrderStatus.DISPATCHED ||
    (o.assignedTech !== user.fullName && o.technicianHistory?.includes(user.fullName))
  );

  const displayedOrders = activeTab === 'todo' ? todoOrders : completedOrders;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 mt-16 pb-24 md:pb-20 bg-slate-50 min-h-screen">

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200 relative mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lab Station</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Lock size={10} /> {user.fullName} • Logged In
          </p>
        </div>
        <div className="flex items-center gap-3">

          <button
            onClick={() => {
              authService.logout();
              window.location.reload();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex  bg-slate-100 p-1 rounded-lg mt-4 w-full shadow-inner">
        <button
          onClick={() => setActiveTab('todo')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'todo' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
        >
          To Do ({todoOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'history' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
        >
          History
        </button>
      </div>

      <div className="space-y-4">
        {displayedOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-lg border border-slate-200 border-dashed">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-slate-200" />
            <p>No orders found in {activeTab}.</p>
          </div>
        ) : (
          displayedOrders.map(order => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${order.priority === 'Urgent' ? 'bg-red-500' : 'bg-brand-500'
                }`} />

              <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{order.patientName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1 rounded">#{order.id}</span>
                    <span className="text-xs font-medium text-slate-600">{order.productType}</span>
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="space-y-2 pl-2 text-sm text-slate-600 mt-4 pt-4 border-t border-slate-50">
                <div className="flex justify-between">
                  <span className="text-xs uppercase font-bold text-slate-400">Doctor</span>
                  <div className="flex items-center gap-1">
                    <Stethoscope size={14} className="text-slate-400" />
                    <span>{order.doctorName.replace(/^Dr\.\s*/i, '')}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs uppercase font-bold text-slate-400">Due Date</span>
                  <span className={`font-bold ${new Date(order.dueDate) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatDate(order.dueDate)}
                  </span>
                </div>
              </div>

              {activeTab === 'todo' && (
                <button
                  onClick={() => openActionModal(order)}
                  className="w-full mt-4 bg-slate-50 hover:bg-slate-100 text-brand-700 font-bold py-3 rounded border border-slate-200 transition-colors flex justify-center items-center gap-2"
                >
                  <span>Update Status</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {
        selectedOrder && (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Update Case Status">
            <CaseActionForm
              order={selectedOrder}
              technicians={technicians}
              onSubmit={handleActionSubmit}
              onCancel={() => setIsModalOpen(false)}
            />
          </Modal>
        )
      }

      {/* Mobile Nav for Tech */}
      <MobileNav activeTab={activeTab === 'todo' ? 'todo' : 'history'} onTabChange={(t) => setActiveTab(t as any)} userRole="TECHNICIAN" />
    </div >
  );
};