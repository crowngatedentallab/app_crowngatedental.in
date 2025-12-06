import React, { useState } from 'react';
import { Order, OrderStatus, User } from '../types';
import { ArrowRight, User as UserIcon } from 'lucide-react';

interface CaseActionFormProps {
    order: Order;
    technicians: User[];
    onSubmit: (updates: Partial<Order>) => Promise<void>;
    onCancel: () => void;
}

export const CaseActionForm: React.FC<CaseActionFormProps> = ({ order, technicians, onSubmit, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [assignedTech, setAssignedTech] = useState<string>(order.assignedTech || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({ status, assignedTech });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 p-3 rounded border border-slate-100 mb-4">
                <p className="text-xs text-slate-500 uppercase font-bold">Current Case</p>
                <p className="font-medium text-slate-800">{order.typeOfWork} for {order.patientName}</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Update Status</label>
                <select
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                    value={status}
                    onChange={e => setStatus(e.target.value as OrderStatus)}
                >
                    {Object.values(OrderStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign / Handover To</label>
                <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                        className="w-full border border-slate-300 rounded p-2 pl-9 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                        value={assignedTech}
                        onChange={e => setAssignedTech(e.target.value)}
                    >
                        <option value="">-- Unassigned --</option>
                        {technicians.map(tech => (
                            <option key={tech.id} value={tech.fullName}>
                                {tech.fullName} {tech.relatedEntity ? `(${tech.relatedEntity})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Select another technician to transfer this case from your queue.</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? 'Updating...' : (
                        <>
                            <span>Update Case</span>
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
