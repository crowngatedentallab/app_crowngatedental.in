
import React, { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Order, OrderStatus, User, Product } from '../types';
import { Plus, Calendar, FileText, Lock, Loader2, X, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { MobileNav } from '../components/MobileNav';

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
    priority: 'Normal' as 'Normal' | 'Urgent',
    attachments: [] as string[]
  });

  useEffect(() => {
    loadData();
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

      loadData();

      setShowForm(false);
      // Reset form
      setFormData({
        patientName: '',
        toothNumber: '',
        typeOfWork: products[0]?.name || '',
        shade: '',
        dueDate: '',
        notes: '',
        priority: 'Normal',
        attachments: []
      });
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
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

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 mt-16 pb-24 md:pb-6">

      {/* Clinic Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
          <p className="text-slate-500 text-sm flex items-center gap-1">
            <Lock size={12} /> {user.relatedEntity || 'Secure Portal'} • Authenticated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-brand-600 bg-white rounded-full border border-slate-200 shadow-sm transition-all active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={isSubmitting ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={isSubmitting}
            className="hidden md:flex items-center space-x-2 bg-brand-800 hover:bg-brand-900 text-white px-5 py-2.5 rounded shadow-md transition-all font-medium text-sm disabled:opacity-50"
          >
            <Plus size={18} />
            <span>New Lab Order</span>
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-600/30 flex items-center justify-center z-50 hover:bg-brand-700 active:scale-95 transition-all"
      >
        <Plus size={28} />
      </button>

      {/* New Order Form Modal/Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-brand-800 flex items-center gap-2">
                <FileText size={20} /> New Work Authorization
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Doctor</label>
                  <input disabled type="text" value={user.fullName} className="w-full bg-slate-100 border border-slate-200 rounded p-2.5 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Patient Name <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="Last Name, First Name" className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={formData.patientName} onChange={e => setFormData({ ...formData, patientName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Required Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input required type="date" min={today} className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none"
                      value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Tooth #</label>
                  <input placeholder="e.g. 11, 21" type="text" className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={formData.toothNumber} onChange={e => setFormData({ ...formData, toothNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Shade</label>
                  <input placeholder="e.g. A2" type="text" className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={formData.shade} onChange={e => setFormData({ ...formData, shade: e.target.value })} />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Restoration Type</label>
                  <select className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={formData.typeOfWork} onChange={e => setFormData({ ...formData, typeOfWork: e.target.value })}>
                    {products.length === 0 ? <option>Loading types...</option> :
                      products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Notes / Instructions</label>
                  <textarea rows={3} placeholder="Additional details..." className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                      checked={formData.priority === 'Urgent'} onChange={e => setFormData({ ...formData, priority: e.target.checked ? 'Urgent' : 'Normal' })} />
                    <span className="font-bold text-slate-700">Mark as URGENT Rush Case</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex gap-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-slate-300 rounded text-slate-600 font-bold hover:bg-slate-50" disabled={isSubmitting}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-brand-700 text-white rounded font-bold hover:bg-brand-800 shadow-lg disabled:opacity-70 flex justify-center items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">My Open Cases</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl border-dashed">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No active orders</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">Use the "New Lab Order" button to submit a new case.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${order.priority === 'Urgent' ? 'bg-red-500' : 'bg-brand-500'
                }`} />

              <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                  <span className="text-xs font-mono text-slate-400 block mb-1">#{order.id}</span>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{order.patientName}</h3>
                  <div className="text-sm text-slate-500 font-medium">{order.typeOfWork}</div>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="space-y-2 pl-2 text-sm text-slate-600 mt-4 pt-4 border-t border-slate-50">
                <div className="flex justify-between">
                  <span>Required:</span>
                  <span className="font-bold text-slate-800">{formatDate(order.dueDate)}</span>
                </div>
                {order.shade && (
                  <div className="flex justify-between">
                    <span>Shade:</span>
                    <span className="font-mono bg-slate-100 px-1.5 rounded text-xs">{order.shade}</span>
                  </div>
                )}
                {order.toothNumber && (
                  <div className="flex justify-between">
                    <span>Tooth #:</span>
                    <span className="font-mono bg-slate-100 px-1.5 rounded text-xs">{order.toothNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Nav for Doctor */}
      <MobileNav activeTab="orders" onTabChange={() => { }} userRole="DOCTOR" />
    </div>
  );
};
