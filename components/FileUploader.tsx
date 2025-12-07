
import React, { useState, useCallback } from 'react';
import { Upload, X, File as FileIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';

interface FileUploaderProps {
    onUploadComplete: (url: string) => void;
    label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete, label = "Upload Files" }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setError(null);

        // Upload only the first file for now (simplification, can loop if needed)
        // Or loop through all
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Validate size/type if needed
                if (file.size > 5 * 1024 * 1024) { // 5MB limit example
                    throw new Error(`File ${file.name} is too large (Max 5MB)`);
                }

                const url = await storageService.uploadFile(file);
                onUploadComplete(url);
                setUploadedFiles(prev => [...prev, file.name]);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        await processFiles(e.dataTransfer.files);
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await processFiles(e.target.files);
    };

    return (
        <div className="w-full"> {/* Debug Border */}
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">{label}</label>

            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer relative
                    ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
            >
                <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    onChange={handleFileInput}
                    multiple
                />

                {isUploading ? (
                    <div className="flex flex-col items-center justify-center text-brand-600">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <span className="text-sm font-medium">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-500">
                        <Upload className="mb-2 text-slate-400" size={24} />
                        <p className="text-sm font-medium text-slate-700">Drag & Drop or Click to Upload</p>
                        <p className="text-xs text-slate-400 mt-1">Images, PDFs, or STL files</p>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <X size={12} /> {error}
                </p>
            )}

            {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                    {uploadedFiles.map((fname, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1.5 rounded border border-green-100">
                            <CheckCircle2 size={12} />
                            <span className="truncate">{fname}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
