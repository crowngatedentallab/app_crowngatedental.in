import React, { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Order, OrderStatus, User, Product, UserRole, Notification } from '../types';
import { EditableField } from '../components/EditableField';
import { Modal } from '../components/Modal';
import { OrderForm } from '../components/OrderForm';
import { UserForm } from '../components/UserForm';
import { MobileNav } from '../components/MobileNav';
import { RefreshCw, Filter, Trash2, CheckSquare, Users, ShoppingBag, PlusCircle, X, AlertTriangle, Clock, TrendingUp, Award, Calendar, Search, Pencil, Plus, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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
    const [orderSearch, setOrderSearch] = useState('');

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
        const matchType = filterType === 'All' || order.productType === filterType;
        const matchDoctor = filterDoctor === 'All' || order.doctorName === filterDoctor;
        const matchStatus = filterStatus === 'All' || order.status === filterStatus;
        const matchSearch = !orderSearch ||
            order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
            order.patientName.toLowerCase().includes(orderSearch.toLowerCase());
        return matchType && matchDoctor && matchStatus && matchSearch;
    });

    const clearFilters = () => {
        setFilterType('All');
        setFilterDoctor('All');
        setFilterStatus('All');
        setOrderSearch('');
    };

    // --- CHART DATA PREPARATION ---
    // --- KPI CALCULATIONS ---
    // 1. Best Performing Product Type
    const productCounts = orders.reduce((acc, order) => {
        const type = order.productType || 'Unknown';
        const current = (acc[type] || 0) as number;
        acc[type] = current + 1;
        return acc;
    }, {} as Record<string, number>);
    const bestProduct = Object.entries(productCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0] || ['N/A', 0];

    // 2. Best Turnaround Time
    // Group by product type and calc avg days
    const productTurnarounds = orders.reduce((acc, order) => {
        if (order.completedDate && order.submissionDate && order.productType) {
            const start = new Date(order.submissionDate).getTime();
            const end = new Date(order.completedDate).getTime();
            const days = (end - start) / (1000 * 60 * 60 * 24);
            if (!acc[order.productType]) acc[order.productType] = [];
            (acc[order.productType] as number[]).push(days);
        }
        return acc;
    }, {} as Record<string, number[]>);

    let bestTurnaroundProduct = { name: 'N/A', days: 0 };
    let fastestDays = Infinity;

    Object.entries(productTurnarounds).forEach(([type, times]) => {
        const timeArray = times as number[];
        if (timeArray.length === 0) return;
        const avg = timeArray.reduce((a, b) => a + b, 0) / timeArray.length;
        if (avg < fastestDays) {
            fastestDays = avg;
            bestTurnaroundProduct = { name: type, days: avg };
        }
    });

    // 3. Best & Worst Months
    const monthCounts = orders.reduce((acc, order) => {
        if (order.submissionDate) {
            const date = new Date(order.submissionDate);
            if (!isNaN(date.getTime())) {
                const month = date.toLocaleString('default', { month: 'long' }); // e.g., "January"
                const current = (acc[month] || 0) as number;
                acc[month] = current + 1;
            }
        }
        return acc;
    }, {} as Record<string, number>);

    const sortedMonths = Object.entries(monthCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
    const bestMonth = sortedMonths[0] || ['-', 0];
    const worstMonth = sortedMonths[sortedMonths.length - 1] || ['-', 0];

    // --- WORKLOAD DATA ---
    // Technician Workload Table Data
    const technicianWorkload = users
        .filter(u => u.role === UserRole.TECHNICIAN)
        .map(tech => {
            const techOrders = orders.filter(o => o.assignedTech === tech.fullName);
            const statusCounts = Object.values(OrderStatus).reduce((acc, status) => {
                acc[status] = techOrders.filter(o => o.status === status).length;
                return acc;
            }, {} as Record<OrderStatus, number>);

            return {
                name: tech.fullName,
                total: techOrders.length,
                ...statusCounts
            };
        });

    // Unique Doctors for Filter
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
                        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 bg-white p-2 px-3 rounded text-sm font-medium border border-slate-200 shadow-sm" onClick={loadData}>
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>


            <div className="px-4 md:px-8 space-y-6">
                {activeTab === 'orders' && (
                    <>
                        {/* NEW DASHBOARD LAYOUT */}

                        {/* ROW 1: NEW KPI CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* A. Best Performing Product Type */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                                    <Award size={24} />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Best Performing Product</h3>
                                <div className="mt-2">
                                    <span className="text-2xl font-bold text-slate-800 block">{bestProduct[0]}</span>
                                    <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                        {bestProduct[1]} Orders
                                    </span>
                                </div>
                            </div>

                            {/* B. Best Turnaround Time */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-green-50 text-green-600 rounded-full mb-3">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Best Turnaround Time</h3>
                                <div className="mt-2">
                                    <span className="text-xl font-bold text-slate-800 block">{bestTurnaroundProduct.name}</span>
                                    <span className="text-sm font-medium text-slate-500">
                                        Avg: {bestTurnaroundProduct.days === 0 ? '-' : bestTurnaroundProduct.days.toFixed(1)} Days
                                    </span>
                                </div>
                            </div>

                            {/* C. Best & Worst Months */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide text-center mb-4">Monthly Performance</h3>
                                <div className="flex justify-between items-center w-full px-4 border-b border-slate-100 pb-2 mb-2">
                                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <TrendingUp size={16} className="text-green-500" /> Best
                                    </span>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-800">{bestMonth[0]}</div>
                                        <div className="text-xs text-slate-400">{bestMonth[1]} Orders</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center w-full px-4">
                                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <TrendingUp size={16} className="text-red-500 rotate-180" /> Worst
                                    </span>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-800">{worstMonth[0]}</div>
                                        <div className="text-xs text-slate-400">{worstMonth[1]} Orders</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW 3: MASTER PRODUCTION SCHEDULE */}
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
                            {/* ADVANCED FILTER BAR */}
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                        Master Production Schedule
                                        <span className="bg-brand-100 text-brand-700 text-xs px-2.5 py-0.5 rounded-full font-bold">{filteredOrders.length}</span>
                                    </h2>
                                    <button onClick={() => setIsOrderModalOpen(true)} className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-brand-700 flex items-center gap-2 shadow-sm transition-all active:scale-95">
                                        <PlusCircle size={18} /> New Order
                                    </button>
                                </div>

                                {/* FILTERS GRID */}
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    <div className="relative col-span-2 lg:col-span-2">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Order ID or Patient..."
                                            className="w-full border border-slate-300 rounded-md text-sm p-2 pl-9 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                            value={orderSearch}
                                            onChange={e => setOrderSearch(e.target.value)}
                                        />
                                    </div>

                                    <select className="border border-slate-300 rounded-md text-sm p-2 bg-white focus:border-brand-500 outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                        <option value="All">All Statuses</option>
                                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>

                                    <select className="border border-slate-300 rounded-md text-sm p-2 bg-white focus:border-brand-500 outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                        <option value="All">All Types</option>
                                        {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>

                                    <select className="border border-slate-300 rounded-md text-sm p-2 bg-white focus:border-brand-500 outline-none" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}>
                                        <option value="All">All Doctors</option>
                                        {uniqueDoctors.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>

                                    {(filterType !== 'All' || filterDoctor !== 'All' || filterStatus !== 'All' || orderSearch) && (
                                        <button onClick={clearFilters} className="text-red-600 text-xs font-bold hover:underline flex items-center justify-center md:justify-start h-full">
                                            <X size={14} className="mr-1" /> Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>


                            {/* DESKTOP TABLE */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-600 min-w-[1000px]">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-bold tracking-wider">ID</th>
                                            <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                                            <th className="px-6 py-4 font-bold tracking-wider">Patient</th>
                                            <th className="px-6 py-4 font-bold tracking-wider">Doctor</th>
                                            <th className="px-6 py-4 font-bold tracking-wider">Type</th>
                                            <th className="px-6 py-4 font-bold tracking-wider">Due</th>
                                            <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.length === 0 ? (
                                            <tr><td colSpan={8} className="text-center py-12 text-slate-400 font-medium">No orders found matching criteria.</td></tr>
                                        ) : (
                                            filteredOrders.map(order => (
                                                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-brand-600 transition-colors">{order.id}</td>
                                                    <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(order.submissionDate)}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-900">{order.patientName}</td>
                                                    <td className="px-6 py-4 text-slate-700 font-medium">{order.doctorName}</td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-600 bg-slate-50/50 rounded-lg">{order.productType || (order as any).typeOfWork || '-'}</td>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{formatDate(order.dueDate)}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => openEditOrderModal(order)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-all" title="Edit"><Pencil size={16} /></button>
                                                            <button onClick={() => handleOrderDelete(order.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete"><Trash2 size={16} /></button>
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
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded">{order.id}</span>
                                                        <span className="text-[10px] font-bold uppercase text-slate-400">{formatDate(order.submissionDate)}</span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{order.patientName}</h3>
                                                </div>
                                                <StatusBadge status={order.status} />
                                            </div>

                                            <div className="mb-3">
                                                <span className="inline-block bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded">{order.productType}</span>
                                            </div>

                                            <div className="flex justify-between items-end mt-2 pt-3 border-t border-slate-50">
                                                <div className="text-xs text-slate-500 space-y-1">
                                                    <div className="flex items-center gap-1.5"><Users size={12} className="text-slate-400" /> Dr. {order.doctorName}</div>
                                                    <div className="flex items-center gap-1.5 font-medium text-slate-700"><Calendar size={12} className="text-slate-400" /> Due: {formatDate(order.dueDate)}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditOrderModal(order)} className="p-2 bg-white text-slate-400 hover:text-brand-600 border border-slate-200 rounded shadow-sm">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => handleOrderDelete(order.id)} className="p-2 bg-white text-slate-400 hover:text-red-500 border border-slate-200 rounded shadow-sm">
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
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h2 className="font-bold text-slate-800 text-lg">Technician Workload</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-slate-600">
                                <thead className="bg-slate-100 font-bold text-slate-700 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-slate-200 sticky left-0 bg-slate-100">Technician Name</th>
                                        <th className="px-4 py-3 border-b border-slate-200 text-center bg-blue-50 text-blue-800">Total Cases</th>
                                        {Object.values(OrderStatus).map(status => (
                                            <th key={status} className="px-2 py-3 border-b border-slate-200 text-center whitespace-nowrap min-w-[80px]">
                                                {status}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {technicianWorkload.map(tech => (
                                        <tr key={tech.name} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-bold text-slate-800 border-r border-slate-100 sticky left-0 bg-white">{tech.name}</td>
                                            <td className="px-4 py-3 text-center font-bold text-blue-700 bg-blue-50/30">{tech.total}</td>
                                            {Object.values(OrderStatus).map(status => (
                                                <td key={status} className={`px-2 py-3 text-center ${tech[status] > 0 ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-300'}`}>
                                                    {tech[status] > 0 ? tech[status] : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {technicianWorkload.length === 0 && (
                                        <tr><td colSpan={Object.keys(OrderStatus).length + 2} className="text-center py-8 text-slate-400">No technicians found.</td></tr>
                                    )}
                                </tbody>
                            </table>
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
        </div >
    );
};
