// Compact IoT Widget
import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Loader2 } from 'lucide-react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db, APP_ID } from '../../config';

export const CompactIoT = ({ user }) => {
  const [gateStatus, setGateStatus] = useState({ isOpen: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'public', 'data', 'iot_devices', 'gate_main'), s => { if (s.exists()) setGateStatus(s.data()); });
    return () => unsub();
  }, [user]);

  const toggleGate = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    try { 
        await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'iot_devices', 'gate_main'), { isOpen: !gateStatus.isOpen, lastUpdated: new Date().toISOString() }); 
    } catch (e) { 
        await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'iot_devices', 'gate_main'), { isOpen: true }); 
    }
    setTimeout(() => setIsLoading(false), 500); 
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-6 px-1 select-none">
       <div className="bg-gray-900 rounded-[24px] h-32 relative overflow-hidden shadow-lg group active:scale-[0.98] transition-transform">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=60')] bg-cover bg-center opacity-50 group-hover:opacity-60 transition-opacity"></div>
          <div className="absolute inset-0 flex items-center justify-center"><Shield className="w-8 h-8 text-white/90" /></div>
          <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE</div>
          <div className="absolute bottom-3 left-3 text-white font-bold text-xs">CCTV Gerbang</div>
       </div>
       <button onClick={toggleGate} disabled={isLoading} className={`rounded-[24px] flex flex-col items-center justify-center gap-2 shadow-sm border-2 transition-all active:scale-[0.96] touch-manipulation ${gateStatus.isOpen ? 'bg-white border-red-100' : 'bg-emerald-600 border-emerald-500 shadow-emerald-200'}`}>
         {isLoading ? <Loader2 className="w-7 h-7 text-gray-400 animate-spin"/> : (
             <>
             <div className={`p-3 rounded-full transition-colors ${gateStatus.isOpen ? 'bg-red-50' : 'bg-white/20'}`}>{gateStatus.isOpen ? <Unlock className="w-7 h-7 text-red-500" /> : <Lock className="w-7 h-7 text-white" />}</div>
             <span className={`text-[10px] font-extrabold uppercase tracking-wide ${gateStatus.isOpen ? 'text-red-500' : 'text-white'}`}>{gateStatus.isOpen ? "TUTUP GERBANG" : "BUKA GERBANG"}</span>
             </>
         )}
       </button>
    </div>
  );
};
