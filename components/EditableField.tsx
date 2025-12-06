import React, { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  type?: 'text' | 'date' | 'select';
  options?: string[];
  label?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onSave, 
  type = 'text', 
  options = [],
  label 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-1 animate-in fade-in duration-200 z-10 relative">
        {type === 'select' ? (
          <select
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className="bg-white border border-brand-500 text-slate-900 rounded-sm px-2 py-1 text-sm focus:outline-none shadow-sm min-w-[120px]"
            autoFocus
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            className="bg-white border border-brand-500 text-slate-900 rounded-sm px-2 py-1 text-sm w-full focus:outline-none shadow-sm min-w-[120px]"
            autoFocus
          />
        )}
        <button onClick={handleSave} className="bg-green-100 text-green-700 p-1 rounded hover:bg-green-200">
          <Check size={14} />
        </button>
        <button onClick={handleCancel} className="bg-red-100 text-red-700 p-1 rounded hover:bg-red-200">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className="group cursor-pointer flex items-center space-x-2 hover:bg-slate-100 p-1.5 rounded -ml-1.5 transition-colors border border-transparent hover:border-slate-200"
      title={`Click to edit ${label || 'value'}`}
    >
      <span className={`truncate ${type === 'date' && new Date(value) < new Date() ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
        {value}
      </span>
      <Edit2 size={10} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};