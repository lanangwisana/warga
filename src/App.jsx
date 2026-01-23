import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Home, CreditCard, AlertTriangle, 
  Bell, Menu, X, CheckCircle, Shield, Activity,
  Plus, RefreshCw, Lock, Unlock, Sparkles, MessageSquare, Send,
  Wifi, Battery, Signal, PieChart, TrendingDown, TrendingUp, DollarSign,
  QrCode, BadgeCheck, MapPin, Briefcase, Wallet, ChevronRight, Loader2,
  Calendar, Users, LogIn, ArrowRight, Phone, Eye, FileText, Megaphone, Image as ImageIcon,
  Lightbulb, Copy, Edit, Save, LogOut, FileCheck, Mail, FilePlus, Upload, Info, ChevronDown,
  Sun, Cloud, CloudRain, Moon, Wind, Thermometer, CloudLightning, CloudFog, Bot, XCircle, Search, ThumbsUp, MessageCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, 
  onSnapshot, query, orderBy, addDoc, updateDoc, where, limit, getDocs
} from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyA2V3XkcYmzTMheaLRmbrz28rJx42DGNds",
  authDomain: "bumi-adipura.firebaseapp.com",
  projectId: "bumi-adipura",
  storageBucket: "bumi-adipura.firebasestorage.app",
  messagingSenderId: "359691605712",
  appId: "1:359691605712:web:50fcba6d5e374f1fdc30d5"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Init Error:", error);
}

const appId = 'smart-residence-v1';

// --- ASSETS ---
const logoUrl = "https://lh3.googleusercontent.com/d/1oPheVvQCJmnBBxqfBp1Ev9iHfebaOSvb"; 
const userPhotoUrl = "https://images.unsplash.com/profile-1766810764004-0d86c0062c85image?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&q=80";

// --- HELPERS ---
const callGeminiAPI = async (prompt, systemInstruction = "") => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, asisten sedang sibuk.";
  } catch (error) { return "Maaf, koneksi ke asisten bermasalah."; }
};

const useWeather = () => {
    const [weather, setWeather] = useState(null);
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Bandung Coordinates
                const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-6.9175&longitude=107.6191&current_weather=true&timezone=auto');
                const data = await res.json();
                if (data && data.current_weather) {
                    setWeather(data.current_weather);
                }
            } catch (e) { console.error("Weather error", e); }
        };
        fetchWeather();
    }, []);
    return weather;
};

const getWeatherIcon = (code, isNight) => {
    if (code === undefined) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (code <= 1) return isNight ? <Moon className="w-5 h-5 text-yellow-200" /> : <Sun className="w-5 h-5 text-yellow-400" />;
    if (code <= 3) return <Cloud className="w-5 h-5 text-gray-200" />;
    if (code <= 48) return <CloudFog className="w-5 h-5 text-gray-300" />;
    if (code <= 67) return <CloudRain className="w-5 h-5 text-blue-300" />;
    if (code <= 82) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (code <= 99) return <CloudLightning className="w-5 h-5 text-purple-400" />;
    return <Sun className="w-5 h-5 text-yellow-400" />;
};

const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
};

// --- SUB-COMPONENTS ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  if (!message) return null;
  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[150] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in-down transition-all ${type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white text-gray-800 border border-gray-100'}`}>
       {type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
       <span className="text-xs font-bold">{message}</span>
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
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

// --- MAIN COMPONENTS ---

const LoginScreen = ({ onLogin, showToast }) => {
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
             {/* Logo Silhouette Clean */}
             <img src={logoUrl} className="w-12 h-12 object-contain brightness-0 invert drop-shadow-md" alt="Logo" onError={(e) => e.target.style.display='none'} />
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

const PaymentModal = ({ bill, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); 
    const [method, setMethod] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const methods = [
        { id: 'bca', name: 'Transfer BCA', icon: '🏦', acc: '123-456-7890 a.n Bendahara RW' },
        { id: 'qris', name: 'QRIS Scan', icon: '📱', acc: 'Scan Code' },
    ];

    const handleUpload = () => {
        setIsUploading(true);
        setTimeout(() => { setIsUploading(false); setStep(3); }, 2000);
    };

    return (
        <Modal title="Pembayaran Iuran" onClose={onClose}>
            {step === 1 && (
                <div className="animate-fade-in">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-6">
                        <p className="text-xs text-emerald-600 mb-1">Rincian Tagihan</p>
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{bill.title}</h4>
                        <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2 mb-3">
                            {bill.breakdown ? bill.breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-gray-600 border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                                    <span>{item.label}</span>
                                    <span className="font-bold">Rp {item.amount.toLocaleString()}</span>
                                </div>
                            )) : <div className="text-xs text-gray-500 italic">Tidak ada rincian.</div>}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                            <span className="font-bold text-emerald-800 text-sm">Total Bayar</span>
                            <span className="font-black text-emerald-700 text-xl">Rp {bill.amount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase">Pilih Metode</p>
                        {methods.map(m => (
                            <button key={m.id} onClick={() => { setMethod(m); setStep(2); }} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all active:scale-[0.98] group">
                                <span className="text-2xl">{m.icon}</span>
                                <div className="text-left"><p className="font-bold text-gray-800 text-sm group-hover:text-emerald-700">{m.name}</p></div>
                                <ChevronRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-emerald-500"/>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="animate-fade-in text-center">
                    <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-dashed border-gray-300">
                        <p className="text-xs text-gray-500 mb-1">Silakan transfer ke:</p>
                        <p className="font-bold text-emerald-600 text-lg">{method.name}</p>
                        <p className="font-mono text-gray-800 text-base mt-1 select-all">{method.acc}</p>
                        <p className="text-xs text-gray-500 mt-2">Nominal: <span className="font-bold text-gray-900">Rp {bill.amount.toLocaleString()}</span></p>
                    </div>
                    <label className="block w-full cursor-pointer">
                        <div className="w-full h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                            {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-600"/> : <Upload className="w-6 h-6 text-gray-400"/>}
                            <span className="text-xs font-bold text-gray-500">{isUploading ? 'Mengunggah...' : 'Upload Bukti Transfer'}</span>
                        </div>
                        <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading}/>
                    </label>
                </div>
            )}
            {step === 3 && (
                <div className="animate-fade-in text-center py-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><CheckCircle className="w-10 h-10 text-green-600"/></div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">Pembayaran Berhasil!</h3>
                    <p className="text-sm text-gray-500 mb-6">Bukti transfer Anda telah dikirim dan sedang diverifikasi oleh admin.</p>
                    <button onClick={onSuccess} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform">Selesai</button>
                </div>
            )}
        </Modal>
    );
};

const DashboardHero = ({ profile, onShowId }) => {
    const weather = useWeather();
    const greeting = getTimeGreeting();
    const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;

    return (
        <div className="px-1 mb-6 mt-2 select-none animate-fade-in">
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-6 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex-1">
                        <p className="text-emerald-100 text-xs font-medium mb-1 tracking-wide opacity-90">{greeting},</p>
                        <h2 className="text-3xl font-bold tracking-tight mb-4 leading-none">{profile?.name?.split(' ')[0] || 'Warga'}</h2>
                        
                        <div className="flex items-center gap-3">
                             {weather ? (
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-sm">
                                    <span className="text-yellow-300 drop-shadow-sm">{getWeatherIcon(weather.weathercode, isNight)}</span>
                                    <span className="text-sm font-bold">{weather.temperature}°</span>
                                </div>
                            ) : (
                                <div className="h-8 w-16 bg-white/10 rounded-2xl animate-pulse"></div>
                            )}
                            
                            <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-200 font-medium">Bumi Adipura</span>
                                <span className="text-[10px] font-bold text-white">{profile?.cluster || 'Cluster A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div onClick={onShowId} className="w-16 h-16 rounded-[20px] bg-white/10 p-1 backdrop-blur-sm border border-white/20 shadow-lg cursor-pointer active:scale-90 transition-transform hover:rotate-3">
                        <img src={userPhotoUrl} className="w-full h-full object-cover rounded-2xl" alt="Profile" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewsCarousel = () => {
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'news'));
      const unsub = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
              const seedNews = [
                { title: "Kerja Bakti Bersih Lingkungan", date: "Minggu, 12 Jan • 08:00 WIB", cat: "Kegiatan", color: "bg-blue-100 text-blue-700", image: "https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=400&q=80", content: "Warga diharapkan membawa alat kebersihan masing-masing. Fokus pembersihan adalah saluran air utama dan taman blok A." },
                { title: "Waspada Demam Berdarah (3M)", date: "Info Penting", cat: "Pengumuman", color: "bg-red-100 text-red-700", image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=400&q=80", content: "Mohon untuk menguras bak mandi minimal seminggu sekali dan menutup tempat penampungan air." },
              ];
              seedNews.forEach(n => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news'), n));
          } else {
              setNews(snapshot.docs.map(d => ({id:d.id, ...d.data()})));
          }
      }, (error) => console.error("News fetch error:", error));
      return () => unsub();
  }, []);

  return (
    <>
    <div className="mb-6 select-none">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-gray-900 text-sm">Berita & Kegiatan</h3>
        <button className="text-xs text-emerald-600 font-bold hover:underline active:text-emerald-800 transition-colors">Lihat Semua</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x touch-pan-x">
        {news.map(n => (
          <div key={n.id} onClick={() => setSelectedNews(n)} className="min-w-[280px] bg-white rounded-2xl border border-gray-100 shadow-sm snap-start overflow-hidden flex flex-col active:scale-[0.98] transition-transform duration-200 cursor-pointer">
            <div className="h-36 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
               <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
               <span className={`absolute top-3 left-3 z-20 text-[10px] font-bold px-2.5 py-1 rounded-full ${n.color} bg-white/95 shadow-sm`}>{n.cat}</span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-800 line-clamp-2 mb-2 leading-snug">{n.title}</h4>
              <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5" /> {n.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {selectedNews && (
        <Modal title={selectedNews.cat} onClose={() => setSelectedNews(null)}>
            <img src={selectedNews.image} className="w-full h-48 object-cover rounded-xl mb-4" alt="News"/>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedNews.title}</h2>
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                <Calendar className="w-4 h-4"/> {selectedNews.date}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{selectedNews.content || "Tidak ada detail tambahan."}</p>
        </Modal>
    )}
    </>
  );
};

const RecentReports = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    if (!user || !db) return;
    // Fetch user's own reports from the public reports collection
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), (s) => {
      const userReports = s.docs
        .map(d => ({id:d.id, ...d.data()}))
        .filter(r => r.userId === user.uid)
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      setReports(userReports);
    }, (error) => console.error("Reports fetch error:", error));
    return () => unsub();
  }, [user]);

  return (
    <>
    <div className="mb-6 px-1">
      <h3 className="font-bold text-gray-900 text-sm mb-3">Status Pengaduan Anda</h3>
      <div className="space-y-3">
        {reports.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada pengaduan.</p> : reports.map(r => (
          <div key={r.id} onClick={() => setSelectedReport(r)} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 active:bg-gray-50 transition-all active:scale-[0.99] cursor-pointer">
            <div className={`p-3 rounded-xl ${r.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}><FileText className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0"><h4 className="text-xs font-bold text-gray-900 truncate">{r.category}</h4><p className="text-[10px] text-gray-500 truncate mt-0.5">{r.description}</p></div>
            <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg tracking-wide ${r.status === 'OPEN' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{r.status === 'IN_PROGRESS' ? 'DIPROSES' : r.status}</span>
          </div>
        ))}
      </div>
    </div>
    {selectedReport && (
        <Modal title="Detail Laporan" onClose={() => setSelectedReport(null)}>
            <div className="space-y-4">
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Kategori</label><p className="font-bold text-gray-900">{selectedReport.category}</p></div>
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Status</label><p className="font-bold text-emerald-600">{selectedReport.status}</p></div>
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Keterangan</label><div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-700 mt-1">{selectedReport.description}</div></div>
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Tanggal</label><p className="text-xs text-gray-600">{new Date(selectedReport.createdAt).toLocaleString()}</p></div>
            </div>
        </Modal>
    )}
    </>
  );
};

// --- FINANCE SCREEN ---
const TransparencyService = ({ user }) => {
  const [scope, setScope] = useState('RW');
  const [data, setData] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() => { 
      if(!user) return;
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'));
      const unsub = onSnapshot(q, (s) => {
          if(s.empty) {
              const seeds = [
                  { description: "Perbaikan Jalan Utama", amount: 2500000, date: "2025-12-01", category: "Infrastruktur" },
                  { description: "Gaji Keamanan (5 Org)", amount: 15000000, date: "2025-12-05", category: "Operasional" },
                  { description: "Biaya Kebersihan", amount: 3000000, date: "2025-12-10", category: "Kebersihan" }
              ];
              seeds.forEach(i => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), i));
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

const BillingWidget = ({ user, showToast }) => {
  const [activeBill, setActiveBill] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
      if(!user) return;
      const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'bills'), where('status', '==', 'UNPAID'));
      const unsub = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
              // Check for PAID status to show "Lunas"
              const qPaid = query(collection(db, 'artifacts', appId, 'users', user.uid, 'bills'), where('status', '==', 'PAID'), limit(1));
              getDocs(qPaid).then(snap => {
                  if(!snap.empty) setActiveBill({status: 'PAID'});
                  else {
                      // Seed initial bill
                      const initialBill = { title: "IPL - Desember 2025", amount: 90000, status: 'UNPAID', dueDate: '2025-12-10', breakdown: [{ label: "Iuran Keamanan & Kebersihan (RW)", amount: 65000 }, { label: "Kas Operasional RT 06", amount: 25000 }] };
                      setDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'bills')), initialBill);
                  }
              });
          } else {
              const bills = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
              setActiveBill(bills[0]);
          }
      }, (err) => console.error("Billing fetch error:", err));
      return () => unsub();
  }, [user]);

  const handlePaymentSuccess = async () => {
      setShowPayment(false);
      showToast("Pembayaran berhasil dikirim!", "success");
      if (activeBill && activeBill.id) {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'bills', activeBill.id), { status: 'PAID' });
      }
  };

  if (!activeBill) return null;

  if (activeBill.status === 'PAID') {
      return (
          <div className="px-1 mb-6 animate-fade-in">
              <div className="bg-emerald-50 p-5 rounded-[24px] border border-emerald-100 flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-full"><CheckCircle className="w-6 h-6 text-emerald-600"/></div>
                  <div>
                      <p className="font-bold text-emerald-800 text-sm">Tagihan Lunas</p>
                      <p className="text-xs text-emerald-600">Terima kasih sudah membayar tepat waktu.</p>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <>
    <div className="px-1 mb-6">
      <div className="bg-white p-5 rounded-[24px] border border-red-100 shadow-lg shadow-red-100/50 flex justify-between items-center relative overflow-hidden group active:scale-[0.98] transition-transform">
         <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full blur-2xl group-active:bg-red-100 transition-colors"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tagihan Aktif (RT 06)</p></div>
            <p className="font-bold text-gray-900 text-sm">{activeBill.title}</p>
            <p className="font-black text-red-600 text-xl mt-1 tracking-tight">Rp {activeBill.amount.toLocaleString()}</p>
         </div>
         <button onClick={() => setShowPayment(true)} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-red-200 active:scale-90 transition-transform relative z-10 hover:bg-red-700">BAYAR</button>
      </div>
    </div>
    {showPayment && <PaymentModal bill={activeBill} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />}
    </>
  );
};

const FinanceScreen = ({ user, showToast }) => {
  const [tab, setTab] = useState('billing'); 
  return (
    <div className="p-6 pt-6 animate-fade-in select-none">
       <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2 tracking-tight"><Wallet className="text-emerald-600 fill-emerald-100"/> Keuangan & Iuran</h2>
       <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
         <button onClick={()=>setTab('billing')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab==='billing'?'bg-white shadow-sm text-emerald-700':'text-gray-400 hover:text-gray-600'}`}>Tagihan Saya</button>
         <button onClick={()=>setTab('transparency')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab==='transparency'?'bg-white shadow-sm text-emerald-700':'text-gray-400 hover:text-gray-600'}`}>Transparansi Kas</button>
       </div>
       {tab === 'billing' ? <BillingWidget user={user} showToast={showToast} /> : <TransparencyService user={user} />}
    </div>
  );
};

const ProfileScreen = ({ user, onLogout, showToast }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});

    useEffect(() => {
        if(!user) return;
        const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), s => {
            if(s.exists()) setProfileData(s.data());
            else {
                const defaultProfile = { name: "Andi Agus Salim", job: "Dosen Telkom University", cluster: "Tahap 1", unit: "Adi Gladiol 18", status: "Warga Tetap" };
                setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), defaultProfile);
                setProfileData(defaultProfile);
            }
        }, (err) => console.error(err));
        return () => unsub();
    }, [user]);

    const handleSaveProfile = async () => {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), profileData);
        setIsEditing(false);
        showToast("Profil berhasil diperbarui!", "success");
    };

    return (
        <div className="p-5 pt-6 animate-fade-in pb-24">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight"><User className="text-emerald-600 fill-emerald-100"/> Profil Warga</h2>
                <button onClick={onLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform hover:bg-red-100"><LogOut className="w-3.5 h-3.5"/> Keluar</button>
            </div>
            
            <div className="relative w-full aspect-[1.58/1] max-w-[400px] mx-auto bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] rounded-[24px] overflow-hidden shadow-2xl shadow-emerald-900/30 border border-white/10 mb-8 transform transition-transform hover:scale-[1.02] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                <div className="p-6 h-full flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/20 shadow-inner">
                                <img src={logoUrl} className="w-full h-full object-contain brightness-0 invert" alt="logo"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-tight text-white leading-none font-sans">Bumi Adipura</h3>
                                <p className="text-[9px] text-emerald-200 uppercase tracking-[0.2em] mt-1 font-medium">Resident Identity</p>
                            </div>
                        </div>
                        <Shield className="w-6 h-6 text-emerald-400 opacity-80" />
                    </div>

                    <div className="flex-1 flex items-center gap-5 mt-2 pl-1">
                        <div className="relative w-[88px] h-[88px] rounded-full p-1 bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-xl">
                            <img src={userPhotoUrl} className="w-full h-full rounded-full object-cover border-[3px] border-[#203A43]" alt="Profile" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-[3px] border-[#203A43] rounded-full flex items-center justify-center shadow-sm">
                                <BadgeCheck className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold text-white tracking-tight truncate leading-tight">{profileData.name || 'Nama Warga'}</h2>
                            <p className="text-emerald-200 text-xs font-medium truncate mb-2.5 opacity-90">{profileData.job || 'Pekerjaan'}</p>
                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/5 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{profileData.status || 'Warga Tetap'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex justify-between items-end border-t border-white/10 pt-3.5">
                        <div>
                            <p className="text-[8px] text-emerald-400 uppercase tracking-wider mb-0.5 font-bold">Unit / Cluster</p>
                            <p className="font-bold text-white text-base font-mono tracking-tight">{profileData.unit || '-'} <span className="text-white/40 mx-1">/</span> {profileData.cluster || '-'}</p>
                        </div>
                        <div className="text-right">
                             <QrCode className="w-8 h-8 text-white opacity-90 mb-1 ml-auto" />
                             <p className="font-mono text-white/60 text-[9px] tracking-widest">{user.uid.substring(0,8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Data Diri & Pengaturan</h3>
                    <button onClick={()=>setIsEditing(!isEditing)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                        {isEditing ? 'Batal' : 'Edit Data'}
                    </button>
                </div>
                {isEditing ? (
                    <div className="w-full space-y-4 mt-2 animate-fade-in">
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Nama Lengkap</label><input className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none" value={profileData.name||''} onChange={e=>setProfileData({...profileData, name:e.target.value})}/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Pekerjaan</label><input className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none" value={profileData.job||''} onChange={e=>setProfileData({...profileData, job:e.target.value})}/></div>
                        <div className="flex gap-3">
                            <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Cluster</label><input className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none" value={profileData.cluster||''} onChange={e=>setProfileData({...profileData, cluster:e.target.value})}/></div>
                            <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Unit</label><input className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none" value={profileData.unit||''} onChange={e=>setProfileData({...profileData, unit:e.target.value})}/></div>
                        </div>
                        <button onClick={handleSaveProfile} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs mt-2 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all"><Save className="w-4 h-4"/> Simpan Perubahan</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><User className="w-5 h-5 text-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase">Nama Lengkap</p><p className="text-sm font-bold text-gray-800">{profileData.name}</p></div></div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><Briefcase className="w-5 h-5 text-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase">Pekerjaan</p><p className="text-sm font-bold text-gray-800">{profileData.job}</p></div></div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><Home className="w-5 h-5 text-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase">Alamat</p><p className="text-sm font-bold text-gray-800">{profileData.cluster}, {profileData.unit}</p></div></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CompactIoT = ({ user }) => {
  const [gateStatus, setGateStatus] = useState({ isOpen: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'iot_devices', 'gate_main'), s => { if (s.exists()) setGateStatus(s.data()); });
    return () => unsub();
  }, [user]);

  const toggleGate = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    try { 
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'iot_devices', 'gate_main'), { isOpen: !gateStatus.isOpen, lastUpdated: new Date().toISOString() }); 
    } catch (e) { 
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'iot_devices', 'gate_main'), { isOpen: true }); 
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

const SocialScreen = ({ user, showToast }) => {
  const [tab, setTab] = useState('events');
  const [showEventGen, setShowEventGen] = useState(false);
  const [eventTheme, setEventTheme] = useState('');
  const [eventIdea, setEventIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => {
        if(s.empty) {
            const seedEvents = [
                { title: 'Posyandu Balita', date: '15 Des', location: 'Balai RW', category: 'Kesehatan', type: 'event' },
                { title: 'Pengajian Masjid Al Kahfi', date: '20 Des', location: 'Masjid Al Kahfi', category: 'Keagamaan', type: 'event' },
                { title: 'Kerja Bakti Akbar', date: '25 Des', location: 'Lingkungan RT 06', category: 'Lingkungan', type: 'event' },
                { title: 'Lomba 17 Agustusan', date: '17 Agu', location: 'Lapangan Utama', category: 'Hiburan', type: 'event' }
            ];
            seedEvents.forEach(e => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), e));
        } else {
            setEvents(s.docs.map(d => ({id:d.id, ...d.data()})));
        }
    }, (err) => console.error("Events fetch error:", err));
    return () => unsub();
  }, []);

  useEffect(() => {
      const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), orderBy('createdAt', 'desc')), (s) => {
          setPosts(s.docs.map(d => ({id:d.id, ...d.data()})));
      }, (err) => console.error("Posts fetch error:", err));
      return () => unsub();
  }, []);
  
  const handleGenerateEvent = async () => {
    if (!eventTheme) return;
    setIsGenerating(true);
    const prompt = `Buatkan ide kegiatan warga untuk tema: "${eventTheme}".`;
    const res = await callGeminiAPI(prompt, "Kamu panitia acara.");
    setEventIdea(res);
    setIsGenerating(false);
    showToast("Ide kegiatan berhasil dibuat!", "success");
  }

  const handlePostSubmit = async (e) => {
      e.preventDefault();
      if(!newPost.trim()) return;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), {
          content: newPost,
          author: 'Andi Agus Salim',
          createdAt: new Date().toISOString(),
          likes: 0
      });
      setNewPost('');
      showToast("Status berhasil diposting!", "success");
  };

  return (
    <div className="p-5 pt-6 animate-fade-in select-none">
       <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 tracking-tight"><Users className="text-emerald-600"/> Sosial & Kegiatan</h2>
       <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
          <button onClick={()=>setTab('events')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab==='events'?'bg-white shadow-sm text-emerald-700':'text-gray-400'}`}>📅 Kegiatan</button>
          <button onClick={()=>setTab('forum')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab==='forum'?'bg-white shadow-sm text-blue-600':'text-gray-400'}`}>💬 Forum Warga</button>
       </div>
       
       {tab === 'events' && (
         <div className="space-y-4">
            <button onClick={()=>setShowEventGen(!showEventGen)} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between group active:scale-[0.98] transition-all">
                <span className="flex items-center gap-2.5 font-bold text-sm"><Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300"/> ✨ Generator Ide Kegiatan</span>
                <ChevronRight className={`w-5 h-5 transition-transform ${showEventGen ? 'rotate-90' : ''}`}/>
            </button>
            {showEventGen && (
                <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm animate-fade-in">
                     <p className="text-xs text-gray-500 mb-3">Tulis tema acara (misal: "Agustusan"), AI akan buatkan rencananya!</p>
                     <div className="flex gap-2 mb-3">
                        <input value={eventTheme} onChange={e=>setEventTheme(e.target.value)} placeholder="Contoh: Lomba Masak" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-base outline-none focus:ring-2 focus:ring-purple-500" />
                        <button onClick={handleGenerateEvent} disabled={isGenerating} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 transition-colors active:scale-95">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Buat Ide'}
                        </button>
                     </div>
                     {eventIdea && <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{eventIdea}</div>}
                </div>
            )}
            
            <div className="space-y-3">
                {events.map(ev => (
                    <div key={ev.id} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors active:scale-[0.99]">
                        <div className="bg-emerald-50 p-3.5 rounded-2xl text-center min-w-[65px]"><p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">{ev.date.split(' ')[1] || 'BULAN'}</p><p className="text-2xl font-black text-emerald-800 leading-none">{ev.date.split(' ')[0] || '01'}</p></div>
                        <div><span className="text-[9px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{ev.category}</span><h4 className="font-bold text-gray-900 mt-1.5">{ev.title}</h4><p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {ev.location}</p></div>
                    </div>
                ))}
            </div>
         </div>
       )}
       
       {tab === 'forum' && (
           <div className="space-y-4">
               <form onSubmit={handlePostSubmit} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                   <textarea value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Apa yang ingin Anda sampaikan kepada warga?" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none resize-none h-20 mb-2 focus:ring-2 focus:ring-blue-500 transition-all"/>
                   <div className="flex justify-end">
                       <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform"><Send className="w-3 h-3"/> Posting</button>
                   </div>
               </form>
               
               <div className="space-y-3">
                   {posts.length === 0 ? <p className="text-center text-xs text-gray-400 italic py-4">Belum ada postingan warga.</p> : posts.map(post => (
                       <div key={post.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                           <div className="flex items-center gap-2 mb-2">
                               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">{post.author.charAt(0)}</div>
                               <div><p className="text-xs font-bold text-gray-900">{post.author}</p><p className="text-[10px] text-gray-400">Warga Tahap 1</p></div>
                           </div>
                           <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                           <div className="flex items-center gap-4 border-t border-gray-50 pt-2 text-gray-400">
                               <button className="flex items-center gap-1 text-xs hover:text-blue-600 transition-colors"><ThumbsUp className="w-3 h-3"/> {post.likes} Suka</button>
                               <button className="flex items-center gap-1 text-xs hover:text-blue-600 transition-colors"><MessageCircle className="w-3 h-3"/> Komentar</button>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       )}
    </div>
  );
};

const ReportScreen = ({ user, profile, showToast }) => {
    const [tab, setTab] = useState('report'); 
    const [desc, setDesc] = useState('');
    const [type, setType] = useState('keramaian');
    const [date, setDate] = useState('');
    const [isBlockingRoad, setIsBlockingRoad] = useState(false);
    const [permits, setPermits] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if(!user) return;
        const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'permits'), (s) => {
            const myPermits = s.docs
                .map(d => ({id:d.id, ...d.data()}))
                .filter(p => p.userId === user.uid)
                .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            setPermits(myPermits);
        }, (err) => console.error("Permits fetch error:", err));
        return () => unsub();
    }, [user]);

    const handleReportSubmit = async () => { 
        if(!desc) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), { 
                category: 'Umum', 
                description: desc, 
                status: 'OPEN', 
                createdAt: new Date().toISOString(),
                userId: user.uid,
                userName: profile?.name || 'Warga',
                userUnit: profile?.unit || '-',
                userCluster: profile?.cluster || '-'
            });
            setDesc(''); 
            setShowForm(false); 
            showToast("Laporan berhasil dikirim!", "success");
        } catch(e) {
            showToast("Gagal mengirim laporan", "error");
        }
        setIsSubmitting(false);
    };

    const handleSmartDraft = async () => {
        if (!desc.trim()) return;
        setIsAnalyzing(true);
        const prompt = `Perbaiki laporan ini agar formal: "${desc}"`;
        const res = await callGeminiAPI(prompt, "Sekretaris profesional.");
        setDesc(res);
        setIsAnalyzing(false);
        showToast("Laporan diperbaiki!", "success");
    };

    const handlePermitSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'permits'), { 
                type, 
                date, 
                description: desc, 
                isBlockingRoad, 
                status: 'PENDING', 
                createdAt: new Date().toISOString(),
                userId: user.uid,
                userName: profile?.name || 'Warga',
                userUnit: profile?.unit || '-',
                userCluster: profile?.cluster || '-'
            });
            setDesc(''); setDate('');
            setShowForm(false); 
            showToast("Pengajuan izin berhasil dikirim!", "success");
        } catch (error) { 
            console.error(error);
            showToast("Gagal mengirim pengajuan", "error");
        }
        setIsSubmitting(false);
    };
    
    return (
        <div className="p-5 pt-6 animate-fade-in select-none">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 tracking-tight"><FileText className="text-emerald-600"/> Pusat Laporan</h2>
            
            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
                <button onClick={()=>setTab('report')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab==='report'?'bg-white shadow-sm text-emerald-700':'text-gray-400'}`}>Pengaduan</button>
                <button onClick={()=>setTab('permit')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab==='permit'?'bg-white shadow-sm text-emerald-700':'text-gray-400'}`}>Surat & Izin</button>
            </div>

            {!showForm && (
                <button onClick={()=>setShowForm(true)} className="w-full bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between group active:scale-[0.98] transition-all mb-6">
                    <span className="flex items-center gap-2 font-bold text-sm">
                        <Plus className="w-5 h-5"/>
                        {tab === 'report' ? 'Buat Pengaduan Baru' : 'Ajukan Surat Izin'}
                    </span>
                    <ChevronRight className="w-5 h-5"/>
                </button>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-900">{tab === 'report' ? 'Formulir Pengaduan' : 'Formulir Perizinan'}</h3>
                            <button onClick={()=>setShowForm(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-5 h-5"/></button>
                        </div>
                        {tab === 'report' ? (
                            <div className="space-y-4">
                                <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-base border-0 focus:ring-2 focus:ring-emerald-500 h-40 resize-none outline-none placeholder-gray-400 text-gray-800" placeholder="Jelaskan masalah..." value={desc} onChange={e=>setDesc(e.target.value)}/>
                                {desc.length > 5 && <button onClick={handleSmartDraft} disabled={isAnalyzing} className="w-full text-xs font-bold text-purple-600 flex items-center justify-center gap-1 bg-purple-50 px-3 py-3 rounded-xl hover:bg-purple-100 transition-colors">{isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} {isAnalyzing ? "Memperbaiki..." : "Perbaiki Tulisan dengan AI"}</button>}
                                <button onClick={handleReportSubmit} disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex justify-center">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : "KIRIM LAPORAN"}</button>
                            </div>
                        ) : (
                            <form onSubmit={handlePermitSubmit} className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Jenis Izin</label><select value={type} onChange={e=>setType(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 text-base outline-none border border-transparent focus:border-emerald-500"><option value="keramaian">Hajatan / Keramaian</option><option value="renovasi">Renovasi Rumah</option><option value="pindah">Pindah Masuk/Keluar</option><option value="pengantar">Surat Pengantar</option></select></div>
                                {type === 'keramaian' && <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100"><div onClick={()=>setIsBlockingRoad(!isBlockingRoad)} className={`w-10 h-6 rounded-full flex items-center transition-colors p-1 cursor-pointer ${isBlockingRoad ? 'bg-orange-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isBlockingRoad ? 'translate-x-4' : 'translate-x-0'}`}></div></div><span className="text-xs font-bold text-orange-800">Menutup Jalan Umum?</span></div>}
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tanggal</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 text-base outline-none" required /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Keterangan</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl mt-1 text-base outline-none h-24 resize-none" placeholder="Detail..." required></textarea></div>
                                <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-all flex justify-center">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : "KIRIM PENGAJUAN"}</button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {tab === 'report' ? <RecentReports user={user} /> : (
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 text-sm px-1 mb-2">Riwayat Pengajuan</h3>
                    {permits.length === 0 ? <div className="text-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">Belum ada data.</div> : permits.map(p => (<div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"><div className={`p-3 rounded-xl ${p.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}><FileCheck className="w-5 h-5" /></div><div className="flex-1 min-w-0"><div className="flex justify-between"><h4 className="text-xs font-bold text-gray-900 uppercase">{p.type}</h4><span className="text-[10px] text-gray-400">{p.date}</span></div><p className="text-[10px] text-gray-500 truncate mt-0.5">{p.description}</p></div></div>))}
                </div>
            )}
        </div>
    );
}

const IdCardModal = ({ user, profile, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm perspective-1000" onClick={e => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 transform hover:scale-[1.02] transition-transform duration-500">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
           <div className="p-8 pb-4 flex justify-between items-start relative z-10">
             <div><h3 className="font-bold text-xl tracking-tight flex items-center gap-2 text-white"><div className="w-7 h-7 rounded bg-white p-0.5 flex items-center justify-center"><img src={logoUrl} className="w-full h-full object-contain"/></div>Bumi Adipura</h3><div className="h-0.5 w-8 bg-yellow-400 mt-2 mb-1 rounded-full"></div><p className="text-[10px] text-emerald-100 uppercase tracking-[0.2em] font-medium">Resident Identity</p></div>
             <Shield className="w-8 h-8 text-yellow-300 opacity-80" />
           </div>
           <div className="flex flex-col items-center mt-4 relative z-10">
             <div className="w-36 h-36 rounded-full p-1.5 bg-gradient-to-tr from-yellow-400 via-orange-300 to-yellow-500 shadow-2xl shadow-yellow-500/20"><img src={userPhotoUrl} className="w-full h-full rounded-full object-cover border-[6px] border-emerald-900" /></div>
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

const ConciergeWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3.5 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.3)] z-40 active:scale-90 transition-transform hover:shadow-emerald-500/50">
            <MessageSquare className="w-6 h-6" />
        </button>
    );
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isLoginRequired, setIsLoginRequired] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isSearchOpen, setIsSearchOpen] = useState(false); 

  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast({ message: '', type: '' });

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
    document.body.style.overscrollBehavior = 'none';
    return () => { document.body.style.overscrollBehavior = 'auto'; }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setIsLoginRequired(false); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUserLogin = async (phone) => {
      try { await signInAnonymously(auth); showToast("Selamat datang kembali!", "success"); } catch (e) { showToast("Gagal masuk.", "error"); }
  };
  
  const handleLogout = async () => { await signOut(auth); setUser(null); setIsLoginRequired(true); setActiveTab('home'); };

  useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), s => {
       if(s.exists()) setProfile(s.data());
       else {
           // SEED PROFILE
           const defaultProfile = { name: "Andi Agus Salim", job: "Dosen Telkom University", cluster: "Tahap 1", unit: "Adi Gladiol 18", status: "Warga Tetap" };
           setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), defaultProfile);
           setProfile(defaultProfile);
       }
    });
    return () => unsub();
  }, [user]);

  if (loading) return <div className="h-[100dvh] flex items-center justify-center bg-white"><Loader2 className="animate-spin text-emerald-600 w-10 h-10"/></div>;
  if (!user || isLoginRequired) return <LoginScreen onLogin={handleUserLogin} showToast={showToast} />;

  return (
    <div className="min-h-[100dvh] bg-[#F5F7FA] font-sans pb-28 relative text-gray-900 overflow-x-hidden touch-pan-y selection:bg-emerald-100 selection:text-emerald-900 overscroll-none">
       <Toast message={toast.message} type={toast.type} onClose={closeToast} />
       
       {/* NEW TOP HEADER */}
       <div className="bg-white/90 backdrop-blur-md px-5 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 select-none shadow-sm">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg shadow-sm p-1.5 flex items-center justify-center">
                    <img src={logoUrl} className="w-full h-full object-contain brightness-0 invert" alt="Logo" />
                </div>
                <h1 className="font-bold text-lg tracking-tight text-gray-900">Bumi<span className="text-emerald-600">Adipura</span></h1>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors active:scale-95">
                    <Search className="w-5 h-5" />
                </button>
                <button onClick={() => showToast("Tidak ada notifikasi baru.", "info")} className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors active:scale-95">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-1 ring-white"></span>
                </button>
            </div>
        </div>
        
        {isSearchOpen && (
            <div className="px-5 py-2 bg-white border-b border-gray-100 animate-fade-in sticky top-[60px] z-20">
                <input type="text" placeholder="Cari layanan, berita..." className="w-full bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700" />
            </div>
        )}

       <div className="min-h-[100dvh] pb-24 max-w-lg mx-auto">
          {activeTab === 'home' && (
             <div className="p-5 pt-2 animate-fade-in space-y-2">
                <DashboardHero profile={profile} onShowId={() => setShowIdCard(true)} />
                <BillingWidget user={user} showToast={showToast} />
                <CompactIoT user={user} />
                <NewsCarousel />
                <RecentReports user={user} />
             </div>
          )}
          {activeTab === 'finance' && <FinanceScreen user={user} showToast={showToast} />}
          {activeTab === 'social' && <SocialScreen user={user} showToast={showToast} />}
          {activeTab === 'report' && <ReportScreen user={user} profile={profile} showToast={showToast} />}
          {activeTab === 'profile' && <ProfileScreen user={user} onLogout={handleLogout} showToast={showToast} />}
       </div>

       <div className="fixed bottom-6 left-5 right-5 max-w-[480px] mx-auto bg-white/95 backdrop-blur-xl border border-white/40 h-[72px] rounded-[32px] flex justify-between items-center px-6 shadow-[0_8px_40px_rgba(0,0,0,0.08)] z-40 select-none pb-safe">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='home'?'text-emerald-600':'text-gray-400'}`}><Home className={`w-6 h-6 ${activeTab==='home'?'fill-current':''}`} /></button>
          <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='finance'?'text-emerald-600':'text-gray-400'}`}><Wallet className={`w-6 h-6 ${activeTab==='finance'?'fill-current':''}`} /></button>
          <div className="relative -top-8"><button onClick={() => setActiveTab('profile')} className={`w-[70px] h-[70px] bg-emerald-900 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-900/40 border-[6px] border-[#F5F7FA] active:scale-95 transition-all hover:scale-105 ${activeTab==='profile'?'ring-4 ring-emerald-100':''}`}><User className="w-8 h-8" /></button></div>
          <button onClick={() => setActiveTab('report')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='report'?'text-emerald-600':'text-gray-400'}`}><FilePlus className={`w-6 h-6 ${activeTab==='report'?'fill-current':''}`} /></button>
          <button onClick={() => setActiveTab('social')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='social'?'text-emerald-600':'text-gray-400'}`}><Users className={`w-6 h-6 ${activeTab==='social'?'fill-current':''}`} /></button>
       </div>
       {showIdCard && <IdCardModal user={user} profile={profile} onClose={() => setShowIdCard(false)} />}
       <ConciergeWidget />
    </div>
  );
}