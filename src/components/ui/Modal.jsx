// Modal component
import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-gray-50">
                <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-5 h-5"/></button>
            </div>
            {children}
        </div>
    </div>
);
