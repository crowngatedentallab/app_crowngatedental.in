
import React, { useState, useEffect } from 'react';
import { sheetService } from '../services/sheetService';
import { generateLabInsights } from '../services/geminiService';
import { Order, OrderStatus, User, Product } from '../types';
import { EditableField } from '../components/EditableField';
import { RefreshCw, Sparkles, Filter, Trash2, TrendingUp, AlertTriangle, CheckSquare, Users, ShoppingBag, PlusCircle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [newProductName, setNewProductName] = useState('');

  // FILTERS STATE
  const [filterType, setFilterType] = useState('All');
  const [filterDoctor, setFilterDoctor] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    loadData();
    const unsubscribe = sheetService.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, usersData, productsData] = await Promise.all([
      sheetService.getOrders(),
      sheetService.getUsers(),
      sheetService.getProducts()
    ]);
    setOrders(ordersData);
    setUsers(usersData);
    setProducts(productsData);
    setLoading(false);
  };

  const handleOrderUpdate = async (id: string, field: keyof Order, value: string) => {
    await sheetService.updateOrder(id, { [field]: value });
  };
  
  const handleOrderDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      await sheetService.deleteOrder(id);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) return;
    await sheetService.addProduct(newProductName);
    setNewProductName('');
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this restoration type?')) {
      await sheetService.deleteProduct(id);
    }
  };

  const fetchInsights = async () => {
    setGeneratingInsights(true);
    const result = await generateLabInsights(orders);
    setInsights(result);
    setGeneratingInsights(false);
  };

  // --- FILTER LOGIC ---
  const filteredOrders = orders.filter(order => {
    const matchType = filterType === 'All' || order.typeOfWork === filterType;
    const matchDoctor = filterDoctor === 'All' || order.doctorName === filterDoctor;
    const matchStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchType && matchDoctor && matchStatus;
  });

  const clearFilters = () => {
    setFilterType('All');
    setFilterDoctor('All');
    setFilterStatus('All');
  };

  // --- CHART DATA PREPARATION (Using raw data, not filtered, for overview) ---
  
  // 1. Status Distribution
  const statusData = Object.values(OrderStatus).map(status => ({
    name: status,
    count: orders.filter(o => o.status === status).length
  }));

  // 2. Monthly Volume
  const getMonthlyVolume = () => {
    const volume: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    orders.forEach(order => {
        if (!order.submissionDate) return;
        const date = new Date(order.submissionDate);
        if (isNaN(date.getTime())) return;
        const monthKey = months[date.getMonth()];
        volume[monthKey] = (volume[monthKey] || 0) + 1;
    });

    return months.map(m => ({
        name: m,
        cases: volume[m] || 0
    }));
  };
  const monthlyData = getMonthlyVolume();

  const activeCount = orders.filter(o => o.status !== OrderStatus.DELIVERED).length;
  
  // Unique Doctors List for Dropdown
  const uniqueDoctors = Array.from(new Set(orders.map(o => o.doctorName).filter(Boolean)));

  return (
    <div className="p-6 mt-12 min-h-screen bg-slate-50">
      
      {/* Header / Control Bar */}
      <div className="bg-white border-b border-slate-200 -mx-6 px-6 py-4 mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Control Panel</h1>
          <p className="text-slate-500 text-sm">Operations & User Administration</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 mr-4">
              <button 
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white shadow text-brand-900' : 'text-slate-500'}`}
              >
                  <ShoppingBag size={14} /> Orders
              </button>
              <button 
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white shadow text-brand-900' : 'text-slate-500'}`}
              >
                  <CheckSquare size={14} /> Restoration Types
              </button>
              <button 
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white shadow text-brand-900' : 'text-slate-500'}`}
              >
                  <Users size={14} /> Users
              </button>
           </div>

          {activeTab === 'orders' && (
              <button 
                onClick={fetchInsights}
                disabled={generatingInsights}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded shadow-sm hover:shadow-md transition-all text-sm font-medium"
              >
                <Sparkles size={16} className={generatingInsights ? 'animate-spin' : ''} />
                <span>AI Insights</span>
              </button>
          )}
          <button onClick={loadData} className="flex items-center space-x-2 bg-brand-700 text-white px-4 py-2 rounded shadow-sm hover:bg-brand-800 text-sm font-medium">
            <RefreshCw size={16} />
            <span>Sync Sheets</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <>
        {/* KPI Cards (Reduced to 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Orders</p>
                    <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
                </div>
                <div className="bg-brand-50 p-3 rounded-full text-brand-600"><CheckSquare size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Urgent Cases</p>
                    <p className="text-2xl font-bold text-red-600">{orders.filter(o => o.priority === 'Urgent').length}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-full text-red-600"><AlertTriangle size={24} /></div>
            </div>
        </div>
        
        {/* Analytics & Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Chart 1: Monthly Volume */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-64">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Monthly Case Volume</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{fontSize: 10}} stroke="#64748b" />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '4px', fontSize: '12px'}}
                            cursor={{fill: '#f1f5f9'}}
                        />
                        <Bar dataKey="cases" fill="#b45309" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Chart 2: Status Breakdown */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-64">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Current Pipeline Status</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#64748b" fontSize={10} hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} stroke="#64748b" />
                        <Tooltip 
                             contentStyle={{backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '4px', fontSize: '12px'}}
                             cursor={{fill: '#f1f5f9'}}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15}>
                             {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === OrderStatus.DISPATCHED ? '#22c55e' : '#3b82f6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Filters & Master Data Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {/* Advanced Filters Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-500" />
                    <h2 className="font-bold text-slate-800">Master Production Schedule</h2>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Restoration Type Filter */}
                    <select 
                        className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                    </select>

                    {/* Doctor Filter */}
                    <select 
                        className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
                        value={filterDoctor}
                        onChange={(e) => setFilterDoctor(e.target.value)}
                    >
                        <option value="All">All Doctors</option>
                        {uniqueDoctors.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select 
                        className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(OrderStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    {(filterType !== 'All' || filterDoctor !== 'All' || filterStatus !== 'All') && (
                        <button 
                            onClick={clearFilters}
                            className="text-slate-500 hover:text-red-600 transition-colors p-1"
                            title="Clear Filters"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-3 font-semibold">Order ID</th>
                    <th className="px-6 py-3 font-semibold">Patient</th>
                    <th className="px-6 py-3 font-semibold">Doctor</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Due Date</th>
                    <th className="px-6 py-3 font-semibold">Stage</th>
                    <th className="px-6 py-3 font-semibold text-center">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                            No orders match the selected filters.
                        </td>
                    </tr>
                ) : (
                    filteredOrders.map((order, idx) => (
                        <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="px-6 py-3 font-mono text-xs text-slate-400">{order.id}</td>
                        <td className="px-6 py-3 font-medium text-slate-900">
                            <EditableField value={order.patientName} onSave={(v) => handleOrderUpdate(order.id, 'patientName', v)} />
                        </td>
                        <td className="px-6 py-3">
                            <EditableField value={order.doctorName} onSave={(v) => handleOrderUpdate(order.id, 'doctorName', v)} />
                        </td>
                        <td className="px-6 py-3">
                            <EditableField value={order.typeOfWork} onSave={(v) => handleOrderUpdate(order.id, 'typeOfWork', v)} />
                        </td>
                        <td className="px-6 py-3">
                            <EditableField type="date" value={order.dueDate} onSave={(v) => handleOrderUpdate(order.id, 'dueDate', v)} />
                        </td>
                        <td className="px-6 py-3">
                            <EditableField 
                            type="select" 
                            value={order.status} 
                            options={Object.values(OrderStatus)}
                            onSave={(v) => handleOrderUpdate(order.id, 'status', v)} 
                            />
                        </td>
                        <td className="px-6 py-3 text-center">
                            <button 
                            onClick={() => handleOrderDelete(order.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                            >
                            <Trash2 size={16} />
                            </button>
                        </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
            
            {/* Footer Summary of Filtered Data */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <span>Showing {filteredOrders.length} of {orders.length} total orders</span>
                {(filterType !== 'All' || filterDoctor !== 'All' || filterStatus !== 'All') && (
                    <span className="font-semibold text-brand-700">Filters Active</span>
                )}
            </div>
        </div>
        </>
      )}

      {activeTab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden max-w-2xl mx-auto">
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <CheckSquare size={16} />
                    Manage Restoration Types
                </h2>
            </div>
            <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="e.g. Gold Crown, Denture..."
                        className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                    />
                    <button 
                        onClick={handleAddProduct}
                        className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-brand-700 flex items-center gap-2"
                    >
                        <PlusCircle size={16} /> Add
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">These items will appear in the "Restoration Type" dropdown for Doctors.</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {products.length === 0 && <div className="p-8 text-center text-slate-400">No types defined.</div>}
                {products.map(product => (
                    <div key={product.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                        <span className="font-medium text-slate-700">{product.name}</span>
                        <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users size={16} />
                    User Directory
                </h2>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200">
                    Read Only View • Manage in Sheets
                </span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-3 font-semibold">User ID</th>
                    <th className="px-6 py-3 font-semibold">Full Name</th>
                    <th className="px-6 py-3 font-semibold">Username</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                    <th className="px-6 py-3 font-semibold">Entity / Clinic</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {users.map((user, idx) => (
                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">{user.id}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{user.fullName}</td>
                    <td className="px-6 py-3">{user.username}</td>
                    <td className="px-6 py-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {user.role}
                        </span>
                    </td>
                    <td className="px-6 py-3">{user.relatedEntity || '-'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
                To add or remove users, please open the 'Users' tab in the Google Sheet directly.
            </div>
        </div>
      )}

    </div>
  );
};
