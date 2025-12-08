import React, { useState } from 'react';
import { firestoreService } from '../services/firestoreService';
import { Order, OrderStatus, User, Product } from '../types';
import { FileUploader } from './FileUploader';

interface OrderFormProps {
    initialData?: Partial<Order>;
    onSubmit: (order: Omit<Order, 'id' | 'status' | 'submissionDate'>) => Promise<void>;
    onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Load Doctors and Products for Dropdowns
    const [formData, setFormData] = useState({
        patientName: initialData?.patientName || '',
        doctorName: initialData?.doctorName || '',
        clinicName: initialData?.clinicName || '',
        toothNumber: initialData?.toothNumber || '',
        shade: initialData?.shade || '',
        productType: initialData?.productType || '',
        dueDate: initialData?.dueDate || '',
        notes: initialData?.notes || '',
        priority: (initialData?.priority || 'Normal') as 'Normal' | 'Urgent',
        attachments: initialData?.attachments || [] as string[]
    });

    React.useEffect(() => {
        const loadOptions = async () => {
            const [usersData, productsData] = await Promise.all([
                firestoreService.getUsers(),
                firestoreService.getProducts()
            ]);
            setDoctors(usersData.filter(u => u.role === 'DOCTOR'));
            setProducts(productsData.filter(p => p.isActive));
        };
        loadOptions();
    }, []);

    const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDoctorName = e.target.value;
        const doctor = doctors.find(d => d.fullName === selectedDoctorName);
        setFormData(prev => ({
            ...prev,
            doctorName: selectedDoctorName,
            clinicName: doctor?.relatedEntity || '' // Auto-fill Clinic
        }));
    };

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
                    <select
                        required
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                        value={formData.doctorName}
                        onChange={handleDoctorChange}
                    >
                        <option value="">Select Doctor...</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.fullName}>{d.fullName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinic (Auto-filled)</label>
                    <input
                        type="text"
                        className="w-full border border-slate-300 rounded p-2 text-sm bg-slate-50 text-slate-500 focus:outline-none cursor-not-allowed"
                        value={formData.clinicName}
                        readOnly
                        title="Auto-filled based on selected Doctor"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type of Work</label>
                    <select
                        required
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                        value={formData.productType}
                        onChange={e => setFormData({ ...formData, productType: e.target.value })}
                    >
                        <option value="">Select Restoration Type...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name} ({p.code})</option>
                        ))}
                    </select>
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
                    label="Attachments (Images / STL / PDF)"
                    onUploadComplete={(url) => setFormData(prev => ({ ...prev, attachments: [...prev.attachments, url] }))}
                />
                {/* Show existing/new attachments list if needed, though FileUploader shows current session uploads. 
                    Ideally we should verify if we need to show previously saved attachments here for EDIT mode. 
                    The current FileUploader only shows 'uploadedFiles' state which is local. 
                    For now, I will just add the uploader as requested. 
                */}
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
                    {loading ? 'Saving...' : (initialData ? 'Update Order' : 'Add Order')}
                </button>
            </div>
        </form>
    );
};
