// Transparency Service Component
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Sparkles, Loader2, X, Bot } from 'lucide-react';
import { collection, onSnapshot, addDoc, query } from 'firebase/firestore';
import { db, APP_ID } from '../../config';
import { callGeminiAPI } from '../../utils';

export const TransparencyService = ({ user }) => {
  const [scope, setScope] = useState('RW');
  const [data, setData] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() => { 
      if(!user) return;
      const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'expenses'));
      const unsub = onSnapshot(q, (s) => {
          if(s.empty) {
              const seeds = [
                  { description: "Perbaikan Jalan Utama", amount: 2500000, date: "2025-12-01", category: "Infrastruktur" },
                  { description: "Gaji Keamanan (5 Org)", amount: 15000000, date: "2025-12-05", category: "Operasional" },
                  { description: "Biaya Kebersihan", amount: 3000000, date: "2025-12-10", category: "Kebersihan" }
              ];
              seeds.forEach(i => addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'expenses'), i));
          } else {
              setData(s.docs.map(d => ({id:d.id, ...d.data()})));
          }
      }, (err) => console.error(err));
      return () => unsub();
  }, [user]);

  const handleAnalyze = async () => {
      setIsAnalyzing(true);
      const prompt = `Analisa data keuangan kas warga: ${JSON.stringify(data)}. Saldo: 45 Juta. Berikan insight singkat.`;
      const res = await callGeminiAPI(prompt, "Kamu adalah konsultan keuangan.");
      setAiAnalysis(res);
      setIsAnalyzing(false);
  };

  return (
    <div className="space-y-4 px-1">
       <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
           {['RT', 'RW'].map((s) => (
             <button key={s} onClick={()=>setScope(s)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${scope===s ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400'}`}>Kas {s}</button>
           ))}
       </div>
       <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-[28px] text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-6 opacity-20 transform rotate-12"><DollarSign className="w-32 h-32 text-yellow-300" /></div>
          <div className="relative z-10">
             <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider mb-1">Sisa Saldo Kas {scope}</p>
             <h3 className="text-3xl font-black tracking-tight text-yellow-300">Rp {scope==='RW'?'45.000.000':'8.500.000'}</h3>
             <div className="mt-6 flex gap-6">
                <div><p className="text-[10px] text-emerald-100 flex items-center gap-1 opacity-80"><TrendingUp className="w-3 h-3 text-yellow-300" /> Pemasukan</p><p className="font-bold text-sm">Rp {scope==='RW'?'65.500.000':'12.000.000'}</p></div>
                <div><p className="text-[10px] text-emerald-100 flex items-center gap-1 opacity-80"><TrendingDown className="w-3 h-3 text-red-300" /> Pengeluaran</p><p className="font-bold text-sm">Rp 20.500.000</p></div>
             </div>
          </div>
       </div>
       {!aiAnalysis ? (
           <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors">
               {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
               {isAnalyzing ? 'Menganalisa data...' : '✨ Analisa Keuangan Otomatis'}
           </button>
       ) : (
           <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-800 leading-relaxed animate-fade-in relative">
               <p className="font-bold mb-1 flex items-center gap-2"><Bot className="w-3 h-3"/> Insight AI</p>
               {aiAnalysis}
               <button onClick={()=>setAiAnalysis('')} className="absolute top-2 right-2 p-1"><X className="w-3 h-3"/></button>
           </div>
       )}
       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
             <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">Riwayat Pengeluaran {scope}</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {data.map((item, i) => (
                <div key={i} className="p-4 flex justify-between items-center active:bg-gray-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">{item.category}</span><span className="text-[10px] text-gray-400">{item.date}</span></div>
                    <p className="text-sm font-bold text-gray-800">{item.description}</p>
                  </div>
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">- {item.amount.toLocaleString()}</span>
                </div>
            ))}
          </div>
       </div>
    </div>
  );
};
