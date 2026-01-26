// Login Screen
import React, { useState } from 'react';
import { User, Home, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { LOGO_URL } from '../../config';

export const LoginScreen = ({ onLogin, showToast }) => {
  const [mode, setMode] = useState('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState(''); 
  const [unit, setUnit] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        if (mode === 'login') {
            if(!phone || !pin) return;
            onLogin(phone);
        } else {
            if(!phone || !pin || !name) return;
            setIsLoading(false);
            showToast("Pendaftaran berhasil! Tunggu aktivasi Admin.", "success");
            setMode('login');
        }
    }, 1500);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#F5F7FA] relative overflow-hidden touch-none select-none overscroll-none">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-100 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-60"></div>
      <div className="z-10 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-3xl shadow-xl shadow-emerald-200 flex items-center justify-center mx-auto mb-6 transform rotate-3 ring-4 ring-white">
             <img src={LOGO_URL} className="w-12 h-12 object-contain brightness-0 invert drop-shadow-md" alt="Logo" onError={(e) => e.target.style.display='none'} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Bumi Adipura</h1>
          <p className="text-gray-500 font-medium">Smart Living & Community App</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all duration-300">
          {mode === 'register' && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nama Lengkap</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5"><User className="w-5 h-5 text-gray-400 mr-3" /><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama Anda" className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" required /></div>
              </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nomor WhatsApp</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5"><Phone className="w-5 h-5 text-gray-400 mr-3" /><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812..." className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" required /></div>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">PIN {mode === 'register' ? '(Buat Baru)' : 'Akses'}</label>
             <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5"><Lock className="w-5 h-5 text-gray-400 mr-3" /><input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••••" className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" required /></div>
          </div>
          {mode === 'register' && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Unit / Blok</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5"><Home className="w-5 h-5 text-gray-400 mr-3" /><input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="Contoh: A1 / 10" className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" required /></div>
              </div>
          )}
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? "MASUK APLIKASI" : "AJUKAN PENDAFTARAN")} 
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
        <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">{mode === 'login' ? "Belum punya akun?" : "Sudah punya akun?"} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-bold text-emerald-600 hover:underline">{mode === 'login' ? "Daftar Warga Baru" : "Masuk Disini"}</button></p>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-8 font-medium">Versi 5.5 • Database Secure Fix</p>
      </div>
    </div>
  );
};
