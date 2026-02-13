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
    // Disabled while in development
    return;
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-6 px-1 select-none">
       {/* CCTV Card */}
       <div className="bg-gray-900 rounded-[24px] h-32 relative overflow-hidden shadow-lg group transition-transform">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=60')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
          <div className="absolute inset-0 flex items-center justify-center"><Shield className="w-8 h-8 text-white/40" /></div>
          
          {/* Development Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
             <div className="bg-amber-500/90 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg border border-amber-400/50 flex items-center gap-1.5 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Pengembangan
             </div>
          </div>

          <div className="absolute top-3 left-3 bg-gray-500/50 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 opacity-50">
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> LIVE
          </div>
          <div className="absolute bottom-3 left-3 text-white/50 font-bold text-xs uppercase tracking-tighter">CCTV Gerbang</div>
       </div>

       {/* Gate Control Card */}
       <div className="bg-gray-100 rounded-[24px] h-32 relative overflow-hidden shadow-inner border border-gray-200 p-4 flex flex-col items-center justify-center gap-2 cursor-not-allowed">
          <div className="p-3 bg-gray-200 rounded-full">
            <Lock className="w-7 h-7 text-gray-400" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400">Tutup Gerbang</span>
          
          {/* Development Badge Overlay */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
             <div className="bg-gray-800/90 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Pengembangan
             </div>
          </div>
       </div>
    </div>
  );
};
