import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { FileUploader } from './FileUploader';

interface OrderFormProps {
    onSubmit: (order: Omit<Order, 'id' | 'status' | 'submissionDate'>) => Promise<void>;
    onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        patientName: '',
        doctorName: '',
        clinicName: '',
        toothNumber: '',
        shade: '',
        typeOfWork: '',
        dueDate: '',
        notes: '',
        priority: 'Normal' as 'Normal' | 'Urgent',
        attachments: [] as string[]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Name</label>
                <input
                    required
                    type="text"
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.patientName}
                    onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Doctor Name</label>
                    <input
                        required
                        type="text"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.doctorName}
                        onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinic (Optional)</label>
                    <input
                        type="text"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.clinicName}
                        onChange={e => setFormData({ ...formData, clinicName: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type of Work</label>
                    <input
                        required
                        type="text"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.typeOfWork}
                        onChange={e => setFormData({ ...formData, typeOfWork: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
                    <input
                        required
                        type="date"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tooth No.</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. 21"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.toothNumber}
                        onChange={e => setFormData({ ...formData, toothNumber: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shade</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. A2"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.shade}
                        onChange={e => setFormData({ ...formData, shade: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                    <select
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value as 'Normal' | 'Urgent' })}
                    >
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
                <textarea
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
            </div>

            <div>
                <FileUploader
                    label="Attachments"
                    onUploadComplete={(url) => setFormData(prev => ({
                        ...prev,
                        attachments: [...(prev.attachments || []), url]
                    }))}
                />
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
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded shadow-sm disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Order'}
                </button>
            </div>
        </form>
    );
};
