// ID Card Modal Component
import React from 'react';
import { Shield, BadgeCheck, QrCode, X } from 'lucide-react';
import { LOGO_URL, USER_PHOTO_URL } from '../../config';

export const IdCardModal = ({ user, profile, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm perspective-1000" onClick={e => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 transform hover:scale-[1.02] transition-transform duration-500">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
           <div className="p-8 pb-4 flex justify-between items-start relative z-10">
             <div><h3 className="font-bold text-xl tracking-tight flex items-center gap-2 text-white"><div className="w-7 h-7 rounded bg-white p-0.5 flex items-center justify-center"><img src={LOGO_URL} className="w-full h-full object-contain"/></div>Bumi Adipura</h3><div className="h-0.5 w-8 bg-yellow-400 mt-2 mb-1 rounded-full"></div><p className="text-[10px] text-emerald-100 uppercase tracking-[0.2em] font-medium">Resident Identity</p></div>
             <Shield className="w-8 h-8 text-yellow-300 opacity-80" />
           </div>
           <div className="flex flex-col items-center mt-4 relative z-10">
             <div className="w-36 h-36 rounded-full p-1.5 bg-gradient-to-tr from-yellow-400 via-orange-300 to-yellow-500 shadow-2xl shadow-yellow-500/20"><img src={USER_PHOTO_URL} className="w-full h-full rounded-full object-cover border-[6px] border-emerald-900" /></div>
             <h2 className="mt-5 text-2xl font-bold text-white tracking-tight">{profile?.name}</h2>
             <p className="text-emerald-200 text-sm font-medium mt-1 opacity-90">{profile?.job}</p>
             <div className="mt-4 flex items-center gap-2 bg-emerald-950/80 px-5 py-2 rounded-full border border-yellow-400/40 shadow-xl backdrop-blur-sm"><BadgeCheck className="w-4 h-4 text-yellow-400" /><span className="text-[10px] font-bold text-white uppercase tracking-wider">{profile?.status}</span></div>
           </div>
           <div className="mt-8 bg-white p-6 flex items-center justify-between relative z-10">
             <div className="space-y-0.5"><p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Access Code</p><p className="text-xl font-mono text-emerald-900 font-black tracking-widest">{user.uid.substring(0,4)}-{user.uid.substring(4,8)}</p></div>
             <div className="bg-emerald-900 p-2.5 rounded-2xl shadow-lg"><QrCode className="w-8 h-8 text-white" /></div>
           </div>
        </div>
        <button onClick={onClose} className="absolute -top-12 right-0 bg-white/20 p-2 rounded-full text-white backdrop-blur-md hover:bg-white/30 transition-colors"><X className="w-6 h-6"/></button>
      </div>
    </div>
  );
};
