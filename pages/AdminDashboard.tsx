import React, { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Order, OrderStatus, User, Product, UserRole, Notification } from '../types';
import { EditableField } from '../components/EditableField';
import { Modal } from '../components/Modal';
import { OrderForm } from '../components/OrderForm';
import { UserForm } from '../components/UserForm';
import { MobileNav } from '../components/MobileNav';
import { RefreshCw, Filter, Trash2, CheckSquare, Users, ShoppingBag, PlusCircle, X, AlertTriangle, Clock, TrendingUp, Award, Calendar, Search, Pencil, Plus, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend } from 'recharts';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'products' | 'workload'>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProductName, setNewProductName] = useState('');
    const [newProductCode, setNewProductCode] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const [productCounters, setProductCounters] = useState<Record<string, number>>({});
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // MODAL STATE
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

    // FILTERS STATE
    const [filterType, setFilterType] = useState('All');
    const [filterDoctor, setFilterDoctor] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
        }
        return dateString;
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await firestoreService.initializeDefaults();
            await loadData();
            setLoading(false);
        };
        init();
    }, []);

    const loadData = async () => {
        try {
            // Load core data first
            const [ordersData, usersData, productsData] = await Promise.all([
                firestoreService.getOrders(),
                firestoreService.getUsers(),
                firestoreService.getProducts()
            ]);
            setOrders(ordersData);
            setUsers(usersData);
            setProducts(productsData);

            // Fetch Counters
            const countersData = await Promise.all(productsData.map(async p => {
                if (!p.code) return { code: 'N/A', count: 0 };
                const count = await firestoreService.getCounter(p.code);
                return { code: p.code, count };
            }));
            const newCounters = countersData.reduce((acc, curr) => ({ ...acc, [curr.code]: curr.count }), {} as Record<string, number>);
            setProductCounters(newCounters);

            // Attempt to load notifications safely
            try {
                // Find current admin user ID if possible, or just look for the default 'admin' user since we can't get auth context here easily yet
                // For this MVP, we will try to find a user named 'admin' or just pass 'admin' and fix the service to handle it
                const adminUser = usersData.find(u => u.username === 'admin');
                const targetId = adminUser ? adminUser.id : 'admin';
                const notificationsData = await firestoreService.getNotifications(targetId);
                setNotifications(notificationsData);
            } catch (err) {
                console.warn("Failed to load notifications:", err);
                // Don't crash the dashboard
            }

        } catch (error) {
            console.error("Critical error loading dashboard data:", error);
            // Even if this fails, we should try to render what we can, but if core fails, we are in trouble.
        }
    };

    const handleOrderUpdate = async (id: string, field: keyof Order, value: string) => {
        await firestoreService.updateOrder(id, { [field]: value });
        loadData();
    };

    const handleOrderDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this order?')) {
            await firestoreService.deleteOrder(id);
            loadData();
        }
    };

    const handleAddProduct = async () => {
        if (!newProductName.trim() || !newProductCode.trim()) return;
        await firestoreService.createProduct({
            name: newProductName,
            code: newProductCode.toUpperCase(),
            isActive: true
        });
        setNewProductName('');
        setNewProductCode('');
        loadData();
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm('Delete this restoration type?')) {
            await firestoreService.deleteProduct(id);
            loadData();
        }
    };

    const handleAddOrder = async (orderData: any) => {
        await firestoreService.createOrder(orderData);
        setIsOrderModalOpen(false);
        loadData();
    };

    const handleProductUpdate = async (id: string, name: string) => {
        await firestoreService.updateProduct(id, { name });
        loadData();
    };

    const handleProductCodeUpdate = async (id: string, code: string) => {
        await firestoreService.updateProduct(id, { code: code.toUpperCase() });
        loadData();
    };

    const handleProductCounterUpdate = async (productCode: string, val: string) => {
        const newSeq = parseInt(val, 10);
        if (!isNaN(newSeq)) {
            await firestoreService.updateCounter(productCode, newSeq);
            loadData();
        }
    };

    const handleUserUpdate = async (id: string, field: keyof User, value: string) => {
        await firestoreService.updateUser(id, { [field]: value });
        loadData();
    };

    const handleUserDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await firestoreService.deleteUser(id);
            loadData();
        }
    };

    const handleAddUser = async (userData: any) => {
        await firestoreService.createUser(userData);
        setIsUserModalOpen(false);
        loadData();
    };

    const openEditUserModal = (user: User) => {
        setEditingUser(user);
        setIsEditUserModalOpen(true);
    };

    const handleEditUserSubmit = async (userData: any) => {
        if (editingUser) {
            await firestoreService.updateUser(editingUser.id, userData);
            setIsEditUserModalOpen(false);
            setEditingUser(undefined);
            loadData();
        }
    };

    const openEditOrderModal = (order: Order) => {
        setEditingOrder(order);
        setIsEditOrderModalOpen(true);
    };

    const handleEditOrderSubmit = async (orderData: any) => {
        if (editingOrder) {
            await firestoreService.updateOrder(editingOrder.id, orderData);
            setIsEditOrderModalOpen(false);
            setEditingOrder(undefined);
            loadData();
        }
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

    // --- CHART DATA PREPARATION ---
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
        return months.map(m => ({ name: m, cases: volume[m] || 0 }));
    };
    const monthlyData = getMonthlyVolume();

    const activeCount = orders.filter(o => o.status !== OrderStatus.DELIVERED).length;

    // 3. Product Distribution
    const productData = products.map(p => ({
        name: p.name,
        value: orders.filter(o => o.typeOfWork === p.name).length
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    // 4. Top Doctors
    const doctorActivity = orders.reduce((acc, order) => {
        if (order.doctorName) { acc[order.doctorName] = (acc[order.doctorName] || 0) + 1; }
        return acc;
    }, {} as Record<string, number>);
    const topDoctors = Object.entries(doctorActivity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // 5. Avg Turnaround (Mock)
    const avgTurnaround = "3.2 Days";

    // 6. Today's Data
    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };
    const todaysOrders = orders.filter(o => o.submissionDate && isToday(o.submissionDate));
    const todaysCount = todaysOrders.length;
    const todayBreakdown = todaysOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Get Technicians for Dropdown
    const technicians = users
        .filter(u => u.role === UserRole.TECHNICIAN)
        .map(u => u.fullName)
        .filter(Boolean);

    // Radial Bar Data
    const radialData = statusData
        .filter(d => d.count > 0)
        .map((d, index) => ({
            name: d.name,
            count: d.count,
            fill: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'][index % 6]
        }));

    // Unique Doctors
    const uniqueDoctors = Array.from(new Set(orders.map(o => o.doctorName).filter(Boolean)));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg">
                    <p className="font-bold text-slate-800 text-sm mb-1">{label}</p>
                    <p className="text-brand-600 font-bold text-lg">
                        {payload[0].value} <span className="text-xs text-slate-500 font-normal">cases</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="pb-20 md:pb-0 min-h-screen bg-slate-50/50">
            {/* Header / Control Bar (Sticky on Desktop) */}
            <div className="bg-white/80 backdrop-blur-md border border-white/20 px-4 md:px-8 py-4 mb-4 md:mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-sm sticky top-16 z-30">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
                        {activeTab === 'orders' ? 'Order Management' :
                            activeTab === 'users' ? 'User Directory' :
                                activeTab === 'products' ? 'Products' : 'Operation Stats'}
                    </h1>
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                    {/* Desktop Tabs / Actions */}
                    <div className="hidden md:flex bg-slate-100 p-1 rounded-md border border-slate-200 mr-4">
                        <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-white shadow text-brand-900' : 'text-slate-500'}`}>
                            <ShoppingBag size={14} /> Orders
                        </button>
                        <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white shadow text-brand-900' : 'text-slate-500'}`}>
                            <CheckSquare size={14} /> Types
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white shadow text-brand-900' : 'text-slate-500'}`}>
                            <Users size={14} /> Users
                        </button>
                        <button onClick={() => setActiveTab('workload')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'workload' ? 'bg-white shadow text-brand-900' : 'text-slate-500'}`}>
                            <BarChart size={14} /> Workload
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* NOTIFICATION BELL */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 text-slate-400 hover:text-brand-600 relative transition-colors"
                            >
                                <Bell size={20} />
                                {notifications.some(n => !n.read) && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                                )}
                            </button>

                            {/* NOTIFICATION DROPDOWN */}
                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden">
                                    <div className="p-3 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Notifications</span>
                                        <button className="text-[10px] text-brand-600 font-bold hover:underline">Mark all read</button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">No new notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-brand-50/30' : ''}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-green-500' : n.type === 'warning' ? 'bg-orange-500' : 'bg-brand-500'}`} />
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">{n.title}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                                            <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleTimeString()} • {new Date(n.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 bg-white p-2 px-3 rounded text-sm font-medium border border-slate-200 shadow-sm" onClick={loadData}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden md:inline">Refresh</span>
                        </button>    <span className="md:hidden">Sync</span>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8">
                {activeTab === 'orders' && (
                    <>
                        {/* STATS CARDS */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Today</p>
                                    <div className="text-amber-600"><Calendar size={16} md:size={20} /></div>
                                </div>
                                <p className="text-xl md:text-2xl font-black text-amber-600 mt-2">{todaysCount}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Active</p>
                                    <div className="text-brand-600"><CheckSquare size={16} md:size={20} /></div>
                                </div>
                                <p className="text-xl md:text-2xl font-black text-slate-800 mt-2">{activeCount}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Speed</p>
                                    <div className="text-indigo-600"><Clock size={16} md:size={20} /></div>
                                </div>
                                <p className="text-xl md:text-2xl font-black text-indigo-600 mt-2">{avgTurnaround}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Urgents</p>
                                    <div className="text-red-600"><AlertTriangle size={16} md:size={20} /></div>
                                </div>
                                <p className="text-xl md:text-2xl font-black text-red-600 mt-2">{orders.filter(o => o.priority === 'Urgent').length}</p>
                            </div>
                        </div>

                        {/* ORDERS LIST */}
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
                            {/* Filter Bar */}
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <h2 className="font-bold text-slate-800 hidden md:block">Master Production Schedule</h2>

                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                    <button onClick={() => setIsOrderModalOpen(true)} className="hidden md:flex bg-brand-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-brand-700 items-center gap-2 shadow-sm mr-2">
                                        <PlusCircle size={16} /> New Order
                                    </button>

                                    {/* Filters - Horizontal Scroll on Mobile */}
                                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                                        {['All', OrderStatus.SUBMITTED, OrderStatus.DESIGNING, OrderStatus.MILLING, OrderStatus.DISPATCHED].map(status => (
                                            <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${filterStatus === status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                {status === 'All' ? 'All' : status}
                                            </button>
                                        ))}
                                        {(filterType !== 'All' || filterDoctor !== 'All' || filterStatus !== 'All') && (
                                            <button onClick={clearFilters} className="text-slate-500 hover:text-red-600 transition-colors p-1 flex-shrink-0" title="Clear Filters"><X size={16} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* DESKTOP TABLE */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-600">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">ID</th>
                                            <th className="px-6 py-3 font-semibold">Date</th>
                                            <th className="px-6 py-3 font-semibold">Patient</th>
                                            <th className="px-6 py-3 font-semibold">Doctor</th>
                                            <th className="px-6 py-3 font-semibold">Type</th>
                                            <th className="px-6 py-3 font-semibold">Due</th>
                                            <th className="px-6 py-3 font-semibold">Status</th>
                                            <th className="px-6 py-3 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.length === 0 ? (
                                            <tr><td colSpan={8} className="text-center py-8 text-slate-400">No orders match filters.</td></tr>
                                        ) : (
                                            filteredOrders.map(order => (
                                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-mono text-xs text-slate-400">{order.id}</td>
                                                    <td className="px-6 py-3 text-slate-500 text-xs">{formatDate(order.submissionDate)}</td>
                                                    <td className="px-6 py-3 font-bold text-slate-900">{order.patientName}</td>
                                                    <td className="px-6 py-3">{order.doctorName}</td>
                                                    <td className="px-6 py-3 text-xs">{order.typeOfWork}</td>
                                                    <td className="px-6 py-3 text-xs">{formatDate(order.dueDate)}</td>
                                                    <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => openEditOrderModal(order)} className="text-slate-400 hover:text-brand-600"><Pencil size={16} /></button>
                                                            <button onClick={() => handleOrderDelete(order.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE CARD LIST */}
                            <div className="md:hidden flex flex-col divide-y divide-slate-100">
                                {filteredOrders.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">No orders found.</div>
                                ) : (
                                    filteredOrders.map(order => (
                                        <div key={order.id} className="p-4 bg-white active:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{order.patientName}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">{order.id}</span>
                                                        <span className="text-xs text-slate-500">{order.typeOfWork}</span>
                                                    </div>
                                                </div>
                                                <StatusBadge status={order.status} />
                                            </div>
                                            <div className="flex justify-between items-end mt-3">
                                                <div className="text-xs text-slate-400">
                                                    <div className="flex items-center gap-1"><Users size={12} /> Dr. {order.doctorName}</div>
                                                    <div className="flex items-center gap-1 mt-1"><Calendar size={12} /> Due: {formatDate(order.dueDate)}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditOrderModal(order)} className="p-2 bg-slate-50 text-brand-600 border border-slate-200 rounded shadow-sm">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => handleOrderDelete(order.id)} className="p-2 bg-slate-50 text-red-500 border border-slate-200 rounded shadow-sm">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Sticky FAB for Orders */}
                        <button
                            onClick={() => setIsOrderModalOpen(true)}
                            className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg shadow-brand-600/30 flex items-center justify-center z-50 hover:bg-brand-700 active:scale-95 transition-all"
                        >
                            <Plus size={28} />
                        </button>
                    </>
                )}

                {activeTab === 'users' && (
                    <>
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-6">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <h2 className="font-bold text-slate-800">User Directory</h2>
                                <button onClick={() => setIsUserModalOpen(true)} className="hidden md:flex bg-brand-600 text-white px-3 py-1.5 rounded text-sm font-bold items-center gap-2">
                                    <PlusCircle size={16} /> Add User
                                </button>
                            </div>

                            {/* DESKTOP USERS TABLE */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Username</th>
                                            <th className="px-6 py-3">Entity</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td className="px-6 py-3"><span className="text-[10px] uppercase font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{u.role}</span></td>
                                                <td className="px-6 py-3 font-bold text-slate-800">{u.fullName}</td>
                                                <td className="px-6 py-3 font-mono text-xs text-slate-500">{u.username}</td>
                                                <td className="px-6 py-3 text-slate-500">{u.relatedEntity || '-'}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openEditUserModal(u)} className="text-slate-400 hover:text-brand-600"><Pencil size={16} /></button>
                                                        <button onClick={() => handleUserDelete(u.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* MOBILE USER LIST */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {users.map(u => (
                                    <div key={u.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-slate-900">{u.fullName}</div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                <span className="bg-slate-100 px-1.5 rounded text-[10px] uppercase font-bold">{u.role}</span>
                                                <span>{u.relatedEntity}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => openEditUserModal(u)} className="text-brand-600"><Pencil size={18} /></button>
                                            <button onClick={() => handleUserDelete(u.id)} className="text-red-400"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setIsUserModalOpen(true)} className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center z-50">
                            <Plus size={28} />
                        </button>
                    </>
                )}

                {activeTab === 'products' && (
                    <>
                        <div className="flex gap-2 mb-4 md:hidden">
                            <input type="text" placeholder="Search..." value={productSearchTerm} onChange={e => setProductSearchTerm(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-20">
                            {/* DESKTOP HEADER */}
                            <div className="hidden md:flex p-4 border-b border-slate-200 bg-slate-50 justify-between items-center">
                                <h2 className="font-bold text-slate-800">Restoration Types</h2>
                                <button onClick={() => setIsProductModalOpen(true)} className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2">
                                    <PlusCircle size={16} /> Add Product
                                </button>
                            </div>

                            {/* LIST */}
                            <div className="divide-y divide-slate-100">
                                {products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).map(product => (
                                    <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                                        <div className="flex-1">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Product Name</div>
                                            <EditableField value={product.name} onSave={(val) => handleProductUpdate(product.id, val)} />
                                        </div>
                                        <div className="w-20 md:w-32">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Code</div>
                                            <EditableField value={product.code || 'N/A'} onSave={(val) => handleProductCodeUpdate(product.id, val)} className="font-mono bg-slate-100 px-2 rounded text-xs" />
                                        </div>
                                        <div className="w-16 md:w-24 text-center">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Seq #</div>
                                            <EditableField value={(productCounters[product.code || ''] || 0).toString()} onSave={(val) => handleProductCounterUpdate(product.code || '', val)} className="font-mono bg-slate-100 px-2 rounded text-center text-xs" />
                                        </div>
                                        <button onClick={() => handleDeleteProduct(product.id)} className="text-slate-300 hover:text-red-500 pt-3"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setIsProductModalOpen(true)} className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center z-50">
                            <Plus size={28} />
                        </button>
                    </>
                )}

                {activeTab === 'workload' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Case Volume (Monthly)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="cases" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Work Distribution</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={20} data={radialData}>
                                    <RadialBar background dataKey="count" />
                                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                                    <Tooltip />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* SHARED MODALS */}
            <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Create New Order">
                <OrderForm onSubmit={handleAddOrder} />
            </Modal>
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Add New Product">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name</label>
                        <input className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-brand-600 focus:outline-none" placeholder="e.g. Zirconia Crown" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Product Code (2-4 chars)</label>
                        <input className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-brand-600 focus:outline-none uppercase font-mono" placeholder="e.g. ZC" maxLength={4} value={newProductCode} onChange={(e) => setNewProductCode(e.target.value.toUpperCase())} />
                    </div>
                    <button onClick={handleAddProduct} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 rounded transition-colors">Add Product</button>
                </div>
            </Modal>
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Add New User">
                <UserForm onSubmit={handleAddUser} />
            </Modal>
            <Modal isOpen={isEditOrderModalOpen} onClose={() => setIsEditOrderModalOpen(false)} title="Edit Order">
                <OrderForm onSubmit={handleEditOrderSubmit} initialData={editingOrder} isEditMode />
            </Modal>
            <Modal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} title="Edit User">
                <UserForm onSubmit={handleEditUserSubmit} initialData={editingUser} />
            </Modal>

            {/* MOBILE NAVIGATION BAR (Bottom Fixed) */}
            <MobileNav activeTab={activeTab} onTabChange={(t) => setActiveTab(t as any)} userRole="ADMIN" />
        </div>
    );
};
