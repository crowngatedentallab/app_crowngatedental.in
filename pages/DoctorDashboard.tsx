
import React, { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Order, OrderStatus, User, Product } from '../types';
import { Plus, Calendar, FileText, Lock, Loader2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

interface DoctorDashboardProps {
  user: User;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    toothNumber: '',
    typeOfWork: '', // Will default to first product
    shade: '',
    dueDate: '',
    notes: '',
    priority: 'Normal' as 'Normal' | 'Urgent'
  });

  useEffect(() => {
    loadData();
    // Realtime subscription removed for MVP
  }, [user]);

  const loadData = async () => {
    const [allOrders, allProducts] = await Promise.all([
      firestoreService.getOrders(),
      firestoreService.getProducts()
    ]);

    // STRICT FILTER: Only show orders where doctorName matches the logged-in user
    const myOrders = allOrders.filter(o => o.doctorName === user.fullName);
    setOrders(myOrders);
    setProducts(allProducts);

    // Set default product if none selected
    if (allProducts.length > 0 && !formData.typeOfWork) {
      setFormData(prev => ({ ...prev, typeOfWork: allProducts[0].name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await firestoreService.createOrder({
        ...formData,
        typeOfWork: formData.typeOfWork || (products[0]?.name || 'Standard Crown'),
        doctorName: user.fullName, // Enforce correct doctor name from Auth
        clinicName: user.relatedEntity // Enforce clinic name from Auth
      });

      loadData(); // Reload logic

      setShowForm(false);
      // Reset form
      setFormData({
        patientName: '',
        toothNumber: '',
        typeOfWork: products[0]?.name || '',
        shade: '',
        dueDate: '',
        notes: '',
        priority: 'Normal'
      });
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 mt-16">

      {/* Clinic Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
          <p className="text-slate-500 text-sm flex items-center gap-1">
            <Lock size={12} /> {user.relatedEntity || 'Secure Portal'} • Authenticated
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={isSubmitting}
          className="flex items-center space-x-2 bg-brand-800 hover:bg-brand-900 text-white px-5 py-2.5 rounded shadow-md transition-all font-medium text-sm disabled:opacity-50"
        >
          <Plus size={18} />
          <span>New Lab Order</span>
        </button>
      </div>

      {/* New Order Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-xl animate-in fade-in slide-in-from-top-4 relative">
          <button
            onClick={() => !isSubmitting && setShowForm(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 mb-6 text-brand-800 border-b border-slate-100 pb-2">
            <FileText size={20} />
            <h2 className="text-lg font-bold">New Work Authorization</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Doctor</label>
              <input
                disabled
                type="text"
                value={user.fullName}
                className="w-full bg-slate-100 border border-slate-200 rounded p-2.5 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Patient Name <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                placeholder="Last Name, First Name"
                className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none transition-all"
                value={formData.patientName}
                onChange={e => setFormData({ ...formData, patientName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Required Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  required
                  type="date"
                  min={today}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:border-brand-600 focus:outline-none appearance-none"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                />
                {/* Calendar icon pointer-events-none ensures clicking icon passes through to input */}
                <Calendar className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Tooth #</label>
              <input
                placeholder="e.g. 11, 21"
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:border-brand-600 focus:outline-none"
                value={formData.toothNumber}
                onChange={e => setFormData({ ...formData, toothNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Shade</label>
              <input
                placeholder="e.g. A2"
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:border-brand-600 focus:outline-none"
                value={formData.shade}
                onChange={e => setFormData({ ...formData, shade: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Restoration Type</label>
              <select
                className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:border-brand-600 focus:outline-none"
                value={formData.typeOfWork}
                onChange={e => setFormData({ ...formData, typeOfWork: e.target.value })}
              >
                {products.length === 0 ? (
                  <option>Loading types...</option>
                ) : (
                  products.map(prod => (
                    <option key={prod.id} value={prod.name}>{prod.name}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Case Priority</label>
              <select
                className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:border-brand-600 focus:outline-none"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as 'Normal' | 'Urgent' })}
              >
                <option value="Normal">Standard</option>
                <option value="Urgent">Rush (Urgent)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Clinical Notes / Instructions</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:border-brand-600 focus:outline-none h-24 resize-none"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded shadow-sm text-sm font-bold uppercase tracking-wide flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                {isSubmitting ? 'Processing...' : 'Authorize Case'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-l-4 border-brand-600 pl-3">
          My Active Cases
        </h3>
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center rounded-lg">
            <p className="text-slate-400">No active cases found for {user.fullName}.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white border border-slate-200 p-5 rounded-lg hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-lg text-slate-900">{order.patientName}</span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{order.id}</span>
                    {order.priority === 'Urgent' && (
                      <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold uppercase tracking-wider">Rush</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap gap-x-6 gap-y-1 mt-2">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>Tooth #{order.toothNumber || '-'}</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{order.typeOfWork}</span>
                    <span className="flex items-center gap-1 text-brand-700 font-medium"><Calendar size={12} /> Due: {formatDate(order.dueDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-2 md:mt-0">
                  {/* Status Timeline */}
                  <div className="hidden lg:flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Stage</span>
                    <div className="flex items-center gap-1">
                      {[OrderStatus.SUBMITTED, OrderStatus.DESIGNING, OrderStatus.MILLING, OrderStatus.GLAZING, OrderStatus.DISPATCHED].map((step, idx) => {
                        const currentIdx = Object.values(OrderStatus).indexOf(order.status);
                        const stepIdx = Object.values(OrderStatus).indexOf(step);
                        const isCompleted = currentIdx >= stepIdx;
                        return (
                          <div key={step} className={`h-1 w-6 rounded-full ${isCompleted ? 'bg-brand-600' : 'bg-slate-200'}`} />
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-right">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
