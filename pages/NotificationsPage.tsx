import React, { useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { firestoreService } from '../services/firestoreService';
import { ArrowLeft, Check, CheckCircle, AlertTriangle, Info, BellRing, Trash2 } from 'lucide-react';

interface NotificationsPageProps {
    user: User;
    onBack: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ user, onBack }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        setLoading(true);
        if (user?.id) {
            const data = await firestoreService.getNotifications(user.id);
            setNotifications(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        await firestoreService.markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        await Promise.all(unreadIds.map(id => firestoreService.markNotificationRead(id)));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <div className="p-2 bg-green-100 text-green-600 rounded-full"><CheckCircle size={24} /></div>;
            case 'warning': return <div className="p-2 bg-amber-100 text-amber-600 rounded-full"><AlertTriangle size={24} /></div>;
            case 'error': return <div className="p-2 bg-red-100 text-red-600 rounded-full"><AlertTriangle size={24} /></div>;
            default: return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Info size={24} /></div>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-20 px-4 pb-12">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                            <p className="text-slate-500 text-sm">Stay updated with your latest alerts</p>
                        </div>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-sm font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin text-brand-500 mb-2"><BellRing size={32} className="mx-auto" /></div>
                        <p className="text-slate-400">Loading updates...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <BellRing size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">You're all caught up!</h3>
                        <p className="text-slate-500">No new notifications at the moment.</p>
                        <button onClick={onBack} className="mt-8 px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 shadow-sm transition-all">
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`group relative bg-white p-5 rounded-2xl border transition-all duration-200 ${notification.read ? 'border-slate-100 opacity-75 hover:opacity-100' : 'border-slate-200 shadow-md transform hover:-translate-y-0.5'}`}
                            >
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`text-base ${notification.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs font-medium text-slate-400 whitespace-nowrap ml-2">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                            <span className="text-xs text-slate-400">
                                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full transition-colors"
                                                >
                                                    <Check size={14} /> Mark Read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!notification.read && (
                                    <div className="absolute top-5 right-5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
