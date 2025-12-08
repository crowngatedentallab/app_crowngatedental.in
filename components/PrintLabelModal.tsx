import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas'; // Using html2canvas via html-to-image usually implies html-to-image lib, but let's check what I installed. I installed html-to-image. I should use that or html2canvas. The plan said html-to-image. I will use html-to-image.
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { X, Printer, Download, Monitor } from 'lucide-react';
import { Order } from '../types';

interface PrintLabelModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onPrintRecord: (size: string) => void;
}

const LABEL_SIZES = [
    { id: '30x50', name: '30mm x 50mm', widthMm: 50, heightMm: 30 },
    { id: '50x80', name: '50mm x 80mm', widthMm: 80, heightMm: 50 },
    { id: '70x100', name: '70mm x 100mm', widthMm: 100, heightMm: 70 },
    { id: 'custom', name: 'Custom Size', widthMm: 0, heightMm: 0 },
];

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({ isOpen, onClose, order, onPrintRecord }) => {
    const [selectedSize, setSelectedSize] = useState(LABEL_SIZES[1]);
    const [customWidth, setCustomWidth] = useState(80);
    const [customHeight, setCustomHeight] = useState(50);
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const currentWidth = selectedSize.id === 'custom' ? customWidth : selectedSize.widthMm;
    const currentHeight = selectedSize.id === 'custom' ? customHeight : selectedSize.heightMm;

    // Convert mm to pixels for screen display (approx 3.78 px per mm)
    const pxPerMm = 3.78;
    const previewScale = 1.5; // Scale up for better preview readability
    const displayWidth = currentWidth * pxPerMm * previewScale;
    const displayHeight = currentHeight * pxPerMm * previewScale;

    // Actual dimensions for printing/exporting
    // We will use CSS to force the print size when printing via window.print()
    // For export, we render at high resolution.

    const handlePrint = () => {
        window.print();
        onPrintRecord(`${currentWidth}x${currentHeight}mm`);
    };

    const handleDownloadPNG = async () => {
        if (!printRef.current) return;
        try {
            const dataUrl = await toPng(printRef.current, { quality: 1.0, pixelRatio: 3 });
            const link = document.createElement('a');
            link.download = `Label-${order.id}.png`;
            link.href = dataUrl;
            link.click();
            onPrintRecord(`${currentWidth}x${currentHeight}mm (PNG)`);
        } catch (err) {
            console.error('Failed to generate PNG', err);
        }
    };

    const handleDownloadPDF = () => {
        // Create PDF with exact mm dimensions
        const pdf = new jsPDF({
            orientation: currentWidth > currentHeight ? 'l' : 'p',
            unit: 'mm',
            format: [currentWidth, currentHeight]
        });

        // We can use html2canvas/toPng to get image and put it in PDF, 
        // or just add text manually. Adding image is often safer for exact layout reproduction.
        if (printRef.current) {
            toPng(printRef.current, { quality: 1.0, pixelRatio: 3 })
                .then((imgData) => {
                    pdf.addImage(imgData, 'PNG', 0, 0, currentWidth, currentHeight);
                    pdf.save(`Label-${order.id}.pdf`);
                    onPrintRecord(`${currentWidth}x${currentHeight}mm (PDF)`);
                });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block print:static">

            {/* NO-PRINT: Modal UI */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] print:hidden">

                {/* SETTINGS PANEL (Left) */}
                <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Printer size={24} className="text-brand-600" />
                            Print Label
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 md:hidden">
                            <X size={20} />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Select Size</label>
                        <div className="space-y-2">
                            {LABEL_SIZES.map(size => (
                                <button
                                    key={size.id}
                                    onClick={() => setSelectedSize(size)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedSize.id === size.id
                                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-500'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                                        }`}
                                >
                                    <div className="font-bold">{size.name}</div>
                                    <div className="text-xs opacity-75">{size.id !== 'custom' ? `${size.widthMm}mm x ${size.heightMm}mm` : 'Enter dimensions manually'}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedSize.id === 'custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Width (mm)</label>
                                <input
                                    type="number"
                                    value={customWidth}
                                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                                    className="w-full border border-slate-300 p-2 rounded focus:ring-brand-500 focus:border-brand-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Height (mm)</label>
                                <input
                                    type="number"
                                    value={customHeight}
                                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                                    className="w-full border border-slate-300 p-2 rounded focus:ring-brand-500 focus:border-brand-500 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-auto space-y-3 pt-6 border-t border-slate-200">
                        <button
                            onClick={handlePrint}
                            className="w-full py-3 bg-brand-600 text-white rounded-lg font-bold shadow hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Printer size={20} /> Print Label
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleDownloadPNG}
                                className="py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Download size={16} /> PNG
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Download size={16} /> PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* PREVIEW PANEL (Right) */}
                <div className="w-full md:w-2/3 bg-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-slate-600 transition-colors hidden md:block">
                        <X size={24} />
                    </button>

                    <div className="mb-4 text-slate-500 text-sm font-medium flex items-center gap-2">
                        <Monitor size={16} /> Live Print Preview
                    </div>

                    <div className="overflow-auto max-w-full max-h-full border-[12px] border-white shadow-xl rounded-sm bg-white">
                        {/* THIS IS THE ACTUAL LABEL COMPONENT */}
                        {/* We use inline styles for width/height to simulate the MM size */}
                        <div
                            ref={printRef}
                            id="label-print-area"
                            className="bg-white text-black flex flex-col font-sans relative overflow-hidden print:fixed print:top-0 print:left-0 print:m-0"
                            style={{
                                width: `${currentWidth}mm`,
                                height: `${currentHeight}mm`,
                                padding: '4mm',
                                boxSizing: 'border-box',
                                border: '1px solid #ccc', // Shown in preview, removed in print via CSS if needed, but helpful boundary
                            }}
                        >
                            {/* PRINT CONTENT */}
                            <div className="flex-1 flex flex-col h-full border-2 border-black p-1.5">
                                {/* Header */}
                                <div className="text-center border-b-2 border-black pb-1 mb-1.5">
                                    <h1 className="font-bold text-[10pt] leading-tight uppercase tracking-wider">Crowngate Dental Lab</h1>
                                </div>

                                {/* Body */}
                                <div className="flex-1 flex gap-2 min-h-0">
                                    <div className="flex-1 text-[9pt] font-bold space-y-1.5 overflow-hidden">
                                        <div>
                                            <span className="font-normal text-[7pt] block text-slate-600">Clinic Name (Entity):</span>
                                            <div className="line-clamp-2 uppercase leading-tight">{order.clinicName || order.relatedEntity || order.doctorName}</div>
                                        </div>
                                        <div>
                                            <span className="font-normal text-[7pt] block text-slate-600">Patient Name:</span>
                                            <div className="line-clamp-1 uppercase leading-tight">{order.patientName}</div>
                                        </div>
                                        <div>
                                            <span className="font-normal text-[7pt] block text-slate-600">Type of Work:</span>
                                            <div className="line-clamp-2 uppercase leading-tight">{order.productType || (order as any).typeOfWork}</div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div>
                                                <span className="font-normal text-[7pt] block text-slate-600">Case ID:</span>
                                                <div className="font-mono text-[10pt] leading-tight">{order.id}</div>
                                            </div>
                                            <div>
                                                <span className="font-normal text-[7pt] block text-slate-600">Delivery:</span>
                                                <div className="leading-tight">{order.dueDate.split('-').reverse().join('-')}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                                        <QRCodeSVG
                                            value={`https://app.crowngatedental.in/order/${order.id}`}
                                            size={70}
                                            level="M"
                                        />
                                        <div className="text-[7pt] text-center w-full mt-1 font-mono font-bold">{order.id}</div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-auto pt-1 border-t border-black text-[7pt] text-center font-bold">
                                    PREMIUM QUALITY DENTAL RESTORATIONS
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-slate-500 text-xs">
                        Dimensions: {currentWidth}mm x {currentHeight}mm
                    </div>
                </div>
            </div>

            {/* PRINT STYLES - Hidden globally, applied when printing */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #label-print-area, #label-print-area * {
                        visibility: visible;
                    }
                    #label-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: ${currentWidth}mm !important;
                        height: ${currentHeight}mm !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important; /* Let the internal padding handle it, or zero it out if wrapper */
                    }
                    @page {
                        size: ${currentWidth}mm ${currentHeight}mm;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
};
