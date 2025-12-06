import React, { useState, useEffect } from 'react';
import { sheetService } from '../services/sheetService';
import { Order, OrderStatus, User, Product, UserRole } from '../types';
import { EditableField } from '../components/EditableField';
import { Modal } from '../components/Modal';
import { OrderForm } from '../components/OrderForm';
import { UserForm } from '../components/UserForm';
import { RefreshCw, Filter, Trash2, CheckSquare, Users, ShoppingBag, PlusCircle, X, AlertTriangle, Clock, TrendingUp, Award, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend } from 'recharts';

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'products' | 'workload'>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProductName, setNewProductName] = useState('');

    // MODAL STATE
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

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

    const handleAddOrder = async (orderData: any) => {
        await sheetService.addOrder(orderData);
        setIsOrderModalOpen(false);
    };

    const handleProductUpdate = async (id: string, name: string) => {
        await sheetService.updateProduct(id, name);
    };

    const handleUserUpdate = async (id: string, field: keyof User, value: string) => {
        await sheetService.updateUser(id, { [field]: value });
    };

    const handleUserDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await sheetService.deleteUser(id);
        }
    };

    const handleAddUser = async (userData: any) => {
        await sheetService.addUser(userData);
        setIsUserModalOpen(false);
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

    // --- TECHNICIAN WORKLOAD DATA ---
    const getTechnicianWorkload = () => {
        const techs = users.filter(u => u.role === UserRole.TECHNICIAN);
        return techs.map(tech => {
            const techOrders = orders.filter(o => o.assignedTech === tech.fullName && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.DISPATCHED);
            const statusCounts = techOrders.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                ...tech,
                activeCount: techOrders.length,
                orders: techOrders,
                statusCounts
            };
        });
    };
    const technicianWorkload = getTechnicianWorkload();


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

    // --- NEW INSIGHTS CALCULATIONS ---

    // 3. Product Distribution
    const productData = products.map(p => ({
        name: p.name,
        value: orders.filter(o => o.typeOfWork === p.name).length
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    // 4. Top Doctors
    const doctorActivity = orders.reduce((acc, order) => {
        if (order.doctorName) {
            acc[order.doctorName] = (acc[order.doctorName] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    const topDoctors = Object.entries(doctorActivity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // 5. Avg Turnaround (Mock: Random between 2.5 - 4.0 days for demo)
    const avgTurnaround = "3.2 Days";

    // 6. Today's Data
    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const todaysOrders = orders.filter(o => o.submissionDate && isToday(o.submissionDate));
    const todaysCount = todaysOrders.length;

    // Breakdown for tooltip
    const todayBreakdown = todaysOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Radial Bar Data Preparation
    const radialData = statusData
        .filter(d => d.count > 0)
        .map((d, index) => ({
            name: d.name,
            count: d.count,
            fill: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'][index % 6]
        }));

    // Unique Doctors List for Dropdown
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
        <div className="p-6 mt-12 min-h-screen bg-slate-50/50">

            {/* Header / Control Bar */}
            <div className="bg-white/80 backdrop-blur-md border border-white/20 -mx-6 px-8 py-5 mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-sm sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">Master Control Panel</h1>
                    <p className="text-slate-500 text-sm font-medium">Operations & User Administration</p>
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
                        <button
                            onClick={() => setActiveTab('workload')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${activeTab === 'workload' ? 'bg-white shadow text-brand-900' : 'text-slate-500'}`}
                        >
                            <BarChart size={14} /> Workload
                        </button>
                    </div>

                    {activeTab === 'users' && (
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-brand-700 flex items-center gap-2 shadow-sm ml-2 md:hidden"
                        >
                            <PlusCircle size={14} />
                        </button>
                    )}
                </div>

                <button onClick={loadData} className="flex items-center space-x-2 bg-brand-700 text-white px-4 py-2 rounded shadow-sm hover:bg-brand-800 text-sm font-medium">
                    <RefreshCw size={16} />
                    <span>Sync Sheets</span>
                </button>
            </div>

            {activeTab === 'orders' && (
                <>
                    {/* --- BUSINESS OVERVIEW SECTION --- */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-brand-600" />
                            Business Performance
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Today's Orders Card (with detailed hover popup) */}
                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(245,158,11,0.1)] border border-slate-100 flex items-center justify-between group relative cursor-help hover:shadow-lg transition-all duration-300">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Today's Intake</p>
                                    <p className="text-2xl font-black text-amber-600">{todaysCount}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:scale-110 transition-transform"><Calendar size={24} /></div>

                                {/* Detailed Popup Tooltip */}
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Today's Breakdown</h4>
                                    {Object.entries(todayBreakdown).length > 0 ? (
                                        <div className="space-y-1">
                                            {Object.entries(todayBreakdown).map(([status, count]) => (
                                                <div key={status} className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-600 font-medium">{status}</span>
                                                    <span className="font-bold text-slate-800 bg-slate-100 px-1.5 rounded">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No orders yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Turnaround Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(99,102,241,0.1)] border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all duration-300">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Avg. Turnaround</p>
                                    <p className="text-2xl font-black text-indigo-600">{avgTurnaround}</p>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform"><Clock size={24} /></div>
                            </div>

                            {/* Active Orders Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all duration-300">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Active Queue</p>
                                    <p className="text-2xl font-black text-slate-800 group-hover:text-brand-600 transition-colors">{activeCount}</p>
                                </div>
                                <div className="bg-brand-50 p-3 rounded-xl text-brand-600 group-hover:scale-110 transition-transform"><CheckSquare size={24} /></div>
                            </div>

                            {/* Urgent Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(239,68,68,0.1)] border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all duration-300">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Urgent Cases</p>
                                    <p className="text-2xl font-black text-red-600">{orders.filter(o => o.priority === 'Urgent').length}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-xl text-red-600 group-hover:scale-110 transition-transform"><AlertTriangle size={24} /></div>
                            </div>
                        </div>
                    </div>

                    {/* --- DETAILED ANALYTICS SECTION --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Chart 1: Monthly Volume (Area Chart) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                            <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                                Monthly Case Volume
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData}>
                                        <defs>
                                            <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} dx={-10} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 2 }} />
                                        <Area type="monotone" dataKey="cases" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCases)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Doctors List */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                                Top Prescribers
                            </h3>
                            <div className="space-y-4">
                                {topDoctors.map((doc, i) => (
                                    <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {i + 1}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{doc.count} cases</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Status Breakdown (Radial Bar Chart) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                                Pipeline Health
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        innerRadius="20%"
                                        outerRadius="100%"
                                        data={radialData}
                                        startAngle={180}
                                        endAngle={0}
                                    >
                                        <RadialBar
                                            label={{ position: 'insideStart', fill: '#fff', fontSize: '10px' }}
                                            background
                                            dataKey="count"
                                            cornerRadius={10}
                                        />
                                        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Product Breakdown (Horizontal Bar Chart) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                Top Products
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                            {productData.map((entry, index) => {
                                                const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
                                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
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
                                <button
                                    onClick={() => setIsOrderModalOpen(true)}
                                    className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-brand-700 flex items-center gap-2 shadow-sm mr-2"
                                >
                                    <PlusCircle size={16} /> New Order
                                </button>

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

                    <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Create New Order">
                        <OrderForm onSubmit={handleAddOrder} onCancel={() => setIsOrderModalOpen(false)} />
                    </Modal>
                </>
            )}

            {
                activeTab === 'products' && (
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
                            <p className="text-xs text-slate-500 mt-2">These items will appear in the "Restoration Type" dropdown for Doctors. Click name to edit.</p>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                            {products.length === 0 && <div className="p-8 text-center text-slate-400">No types defined.</div>}
                            {products.map(product => (
                                <div key={product.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                    <div className="font-medium text-slate-700 flex-1">
                                        <EditableField value={product.name} onSave={(val) => handleProductUpdate(product.id, val)} />
                                    </div>
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
                )
            }

            {
                activeTab === 'workload' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {technicianWorkload.map(tech => (
                            <div key={tech.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shadow-inner">
                                            {tech.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm">{tech.fullName}</h3>
                                            <p className="text-xs text-slate-500 font-medium">{tech.activeCount} Active Cases</p>
                                        </div>
                                    </div>
                                    {tech.activeCount > 5 && (
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </span>
                                    )}
                                </div>
                                <div className="p-4">
                                    {tech.activeCount === 0 ? (
                                        <p className="text-center text-slate-400 text-xs py-4">No active cases assigned.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {tech.orders.slice(0, 5).map(o => (
                                                <div key={o.id} className="flex justify-between items-center text-xs">
                                                    <span className="font-mono text-slate-500">{o.id}</span>
                                                    <span className={`px-2 py-0.5 rounded-full ${o.status === OrderStatus.MILLING ? 'bg-purple-100 text-purple-700' :
                                                        o.status === OrderStatus.DESIGNING ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>{o.status}</span>
                                                </div>
                                            ))}
                                            {tech.activeCount > 5 && (
                                                <p className="text-center text-xs text-brand-600 font-bold mt-2">+ {tech.activeCount - 5} more cases</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-50 p-3 flex flex-wrap gap-2 border-t border-slate-100">
                                    {Object.entries(tech.statusCounts).map(([status, count]) => (
                                        <div key={status} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded">
                                            <span className="text-slate-500">{status}:</span> <span className="font-bold text-slate-800">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {technicianWorkload.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-400">
                                No technicians found. Add users with 'TECHNICIAN' role.
                            </div>
                        )}
                    </div>
                )
            }

            {
                activeTab === 'users' && (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users size={16} />
                                User Directory
                            </h2>
                            <button
                                onClick={() => setIsUserModalOpen(true)}
                                className="bg-brand-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-brand-700 flex items-center gap-2 shadow-sm"
                            >
                                <PlusCircle size={16} /> Add User
                            </button>
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
                                        <th className="px-6 py-3 font-semibold text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user, idx) => (
                                        <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                            <td className="px-6 py-3 font-mono text-xs text-slate-400">{user.id}</td>
                                            <td className="px-6 py-3 font-medium text-slate-900">
                                                <EditableField value={user.fullName} onSave={(v) => handleUserUpdate(user.id, 'fullName', v)} />
                                            </td>
                                            <td className="px-6 py-3">
                                                <EditableField value={user.username} onSave={(v) => handleUserUpdate(user.id, 'username', v)} />
                                            </td>
                                            <td className="px-6 py-3">
                                                <EditableField
                                                    type="select"
                                                    value={user.role}
                                                    options={Object.values(UserRole)}
                                                    onSave={(v) => handleUserUpdate(user.id, 'role', v)}
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <EditableField value={user.relatedEntity || ''} onSave={(v) => handleUserUpdate(user.id, 'relatedEntity', v)} />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button
                                                    onClick={() => handleUserDelete(user.id)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Add New User">
                            <UserForm onSubmit={handleAddUser} onCancel={() => setIsUserModalOpen(false)} />
                        </Modal>
                    </div>
                )
            }

        </div>
    );
};
