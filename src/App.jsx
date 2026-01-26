// Main App Component - Bumi Adipura Warga App
import React, { useState, useEffect } from 'react';
import { Home, Wallet, User, FilePlus, Users, Search, Bell, Loader2 } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// Config
import { auth, db, APP_ID, LOGO_URL } from './config';

// Components
import { Toast } from './components';

// Features
import {
  LoginScreen,
  DashboardHero,
  NewsCarousel,
  RecentReports,
  BillingWidget,
  CompactIoT,
  FinanceScreen,
  SocialScreen,
  ReportScreen,
  ProfileScreen,
  IdCardModal
} from './features';

// Concierge Widget
const ConciergeWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3.5 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.3)] z-40 active:scale-90 transition-transform hover:shadow-emerald-500/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
    );
};

// Main App
export default function App() {
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isLoginRequired, setIsLoginRequired] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isSearchOpen, setIsSearchOpen] = useState(false); 

  // Toast handlers
  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast({ message: '', type: '' });

  // Viewport setup
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
    document.body.style.overscrollBehavior = 'none';
    return () => { document.body.style.overscrollBehavior = 'auto'; }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setIsLoginRequired(false); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Login handler
  const handleUserLogin = async (phone) => {
      try { 
        await signInAnonymously(auth); 
        showToast("Selamat datang kembali!", "success"); 
      } catch (e) { 
        showToast("Gagal masuk.", "error"); 
      }
  };
  
  // Logout handler
  const handleLogout = async () => { 
    await signOut(auth); 
    setUser(null); 
    setIsLoginRequired(true); 
    setActiveTab('home'); 
  };

  // Profile listener
  useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), s => {
       if(s.exists()) setProfile(s.data());
       else {
           const defaultProfile = { name: "Andi Agus Salim", job: "Dosen Telkom University", cluster: "Tahap 1", unit: "Adi Gladiol 18", status: "Warga Tetap" };
           setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), defaultProfile);
           setProfile(defaultProfile);
       }
    });
    return () => unsub();
  }, [user]);

  // Loading state
  if (loading) return (
    <div className="h-[100dvh] flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-emerald-600 w-10 h-10"/>
    </div>
  );

  // Login screen
  if (!user || isLoginRequired) return <LoginScreen onLogin={handleUserLogin} showToast={showToast} />;

  // Main app
  return (
    <div className="min-h-[100dvh] bg-[#F5F7FA] font-sans pb-28 relative text-gray-900 overflow-x-hidden touch-pan-y selection:bg-emerald-100 selection:text-emerald-900 overscroll-none">
       <Toast message={toast.message} type={toast.type} onClose={closeToast} />
       
       {/* Header */}
       <div className="bg-white/90 backdrop-blur-md px-5 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 select-none shadow-sm">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg shadow-sm p-1.5 flex items-center justify-center">
                    <img src={LOGO_URL} className="w-full h-full object-contain brightness-0 invert" alt="Logo" />
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
        
        {/* Search bar */}
        {isSearchOpen && (
            <div className="px-5 py-2 bg-white border-b border-gray-100 animate-fade-in sticky top-[60px] z-20">
                <input type="text" placeholder="Cari layanan, berita..." className="w-full bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700" />
            </div>
        )}

       {/* Main Content */}
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

       {/* Bottom Navigation */}
       <div className="fixed bottom-6 left-5 right-5 max-w-[480px] mx-auto bg-white/95 backdrop-blur-xl border border-white/40 h-[72px] rounded-[32px] flex justify-between items-center px-6 shadow-[0_8px_40px_rgba(0,0,0,0.08)] z-40 select-none pb-safe">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='home'?'text-emerald-600':'text-gray-400'}`}><Home className={`w-6 h-6 ${activeTab==='home'?'fill-current':''}`} /></button>
          <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='finance'?'text-emerald-600':'text-gray-400'}`}><Wallet className={`w-6 h-6 ${activeTab==='finance'?'fill-current':''}`} /></button>
          <div className="relative -top-8"><button onClick={() => setActiveTab('profile')} className={`w-[70px] h-[70px] bg-emerald-900 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-900/40 border-[6px] border-[#F5F7FA] active:scale-95 transition-all hover:scale-105 ${activeTab==='profile'?'ring-4 ring-emerald-100':''}`}><User className="w-8 h-8" /></button></div>
          <button onClick={() => setActiveTab('report')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='report'?'text-emerald-600':'text-gray-400'}`}><FilePlus className={`w-6 h-6 ${activeTab==='report'?'fill-current':''}`} /></button>
          <button onClick={() => setActiveTab('social')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='social'?'text-emerald-600':'text-gray-400'}`}><Users className={`w-6 h-6 ${activeTab==='social'?'fill-current':''}`} /></button>
       </div>

       {/* Modals */}
       {showIdCard && <IdCardModal user={user} profile={profile} onClose={() => setShowIdCard(false)} />}
       <ConciergeWidget />
    </div>
  );
}