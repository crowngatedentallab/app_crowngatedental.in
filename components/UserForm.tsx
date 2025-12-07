import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserFormProps {
    onSubmit: (user: Omit<User, 'id'>) => Promise<void>;
    onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        role: UserRole.DOCTOR,
        relatedEntity: ''
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                    required
                    type="text"
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username</label>
                    <input
                        required
                        type="text"
                        autoComplete="off"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                    <input
                        required
                        type="text"
                        autoComplete="new-password"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role</label>
                <select
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                    <option value={UserRole.DOCTOR}>Doctor</option>
                    <option value={UserRole.TECHNICIAN}>Technician</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                </select>
            </div>

            {formData.role === UserRole.DOCTOR && (
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinic Name</label>
                    <input
                        type="text"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.relatedEntity}
                        onChange={e => setFormData({ ...formData, relatedEntity: e.target.value })}
                    />
                </div>
            )}

            {formData.role === UserRole.TECHNICIAN && (
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specialization (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. Ceramics"
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.relatedEntity}
                        onChange={e => setFormData({ ...formData, relatedEntity: e.target.value })}
                    />
                </div>
            )}

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
                    {loading ? 'Adding...' : 'Add User'}
                </button>
            </div>
        </form>
    );
};
