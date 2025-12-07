import React, { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Order, OrderStatus, User } from '../types';
import { ArrowRight, CheckCircle2, Lock, GitCompareArrows } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { CaseActionForm } from '../components/CaseActionForm';

interface TechnicianViewProps {
  user: User;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
    // Realtime subscription removed for MVP migration
  }, [user]);

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
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm relative overflow-hidden group">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2 font-semibold text-left">Order ID</th>
                  <th className="px-4 py-2 font-semibold text-left">Created</th>
                  <th className="px-4 py-2 font-semibold text-left">Patient</th>
                  <th className="px-4 py-2 font-semibold text-left">Type & Shade</th>
                  <th className="px-4 py-2 font-semibold text-left">Due Date</th>
                  <th className="px-4 py-2 font-semibold text-left">Status</th>
                  <th className="px-4 py-2 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{order.id}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{formatDate(order.submissionDate)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{order.patientName}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-medium text-xs">{order.typeOfWork}</div>
                      <div className="text-[10px] text-slate-400">Shade: {order.shade}</div>
                      <div className="text-[10px] text-slate-400">Tooth: {order.toothNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{formatDate(order.dueDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openActionModal(order)}
                        className="text-brand-600 hover:text-brand-800 font-bold text-xs border border-brand-200 hover:border-brand-500 px-3 py-1 rounded transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {displayedOrders.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-lg border border-slate-200 border-dashed">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-slate-200" />
            <p>No orders found in {activeTab}.</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Update Case Status">
          <CaseActionForm
            order={selectedOrder}
            technicians={technicians}
            onSubmit={handleActionSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};