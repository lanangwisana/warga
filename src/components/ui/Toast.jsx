// Toast notification component
import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const Toast = ({ message, type, onClose }) => {
  useEffect(() => { 
    const timer = setTimeout(onClose, 3000); 
    return () => clearTimeout(timer); 
  }, [onClose]);
  
  if (!message) return null;
  
  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[150] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in-down transition-all ${type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white text-gray-800 border border-gray-100'}`}>
       {type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
       <span className="text-xs font-bold">{message}</span>
    </div>
  );
};
