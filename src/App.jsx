// Main App Component - Bumi Adipura Warga App
import React, { useState, useEffect } from 'react';
import { Home, Wallet, User, FilePlus, Users, Search, Bell, Loader2, AlertTriangle } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy } from 'firebase/firestore';
//tes
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
  IdCardModal,
  NotificationModal
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
  const [resident, setResident] = useState(null); // Real resident data from Firestore
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('last_active_tab') || 'home');
  const [profile, setProfile] = useState(null);

  // Persist Active Tab
  useEffect(() => {
    localStorage.setItem('last_active_tab', activeTab);
  }, [activeTab]);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isLoginRequired, setIsLoginRequired] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isSearchOpen, setIsSearchOpen] = useState(false); 

  const [isNavBlocked, setIsNavBlocked] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Monitor Notifications & Unread Count
  useEffect(() => {
    if (!resident || !db) return;

    const unsub = onSnapshot(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'news'), orderBy('createdAt', 'desc')), (s) => {
        let allNews = s.docs.map(d => ({id:d.id, ...d.data()}));
        
        // Filter by RT/RW access
        const myRt = resident.rt ? `RT${resident.rt.toString().padStart(2, '0')}` : null;
        allNews = allNews.filter(n => n.createdBy === 'RW' || (myRt && n.createdBy === myRt));

        // Get last read timestamp from resident data (Firestore)
        const lastRead = resident?.lastReadNewsTime || '0';
        const unread = allNews.filter(n => n.createdAt > lastRead);
        
        setUnreadCount(unread.length);

        // Auto-open if there are unread notifications (once per session)
        const hasAutoOpened = sessionStorage.getItem('notif_auto_opened');
        if (unread.length > 0 && !hasAutoOpened) {
            setShowNotifications(true);
            sessionStorage.setItem('notif_auto_opened', 'true');
        }
    });

    return () => unsub();
  }, [resident]);

  // Handle open notifications manually
  const handleOpenNotifications = async () => {
    setShowNotifications(true);
    
    // Mark as read in DB if there are unread items
    if (unreadCount > 0 && resident?.id) {
        try {
            // We'll use a slightly delayed update to allow the modal to open smoothly
            const latestNewsQuery = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'news'), orderBy('createdAt', 'desc'));
            // Just get the absolute latest broadcast time to mark as read point
            const nowIso = new Date().toISOString();
            await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', resident.id), {
                lastReadNewsTime: nowIso
            });
            // Update local state to reflect change immediately
            setResident(prev => ({ ...prev, lastReadNewsTime: nowIso }));
        } catch (e) {
            console.error("Failed to mark notifications as read:", e);
        }
    }
  };

  // Navigation handler with blocker
  const handleTabChange = (tabId) => {
    if (isNavBlocked) {
        setPendingAction({ type: 'TAB', payload: tabId });
        setShowUnsavedModal(true);
        return;
    }
    setActiveTab(tabId);
  };

  // Toast handlers
  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast({ message: '', type: '' });

  // Viewport setup
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
    // Removed overscroll restriction to fix mouse scrolling issues
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) { 
        setUser(u);
        const cachedResident = localStorage.getItem('resident_data');
        if (cachedResident) {
          const parsed = JSON.parse(cachedResident);
          setResident(parsed);
          setProfile(parsed);
          setIsLoginRequired(false);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Profile Sync
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), (docSnap) => {
        if (docSnap.exists()) {
            const newData = docSnap.data();
            console.log("Global sync: Profile updated", newData.name);
            setResident(newData);
            setProfile(newData);
            localStorage.setItem('resident_data', JSON.stringify(newData));
        }
    });

    return () => unsub();
  }, [user?.uid]);

  // Login handler
  const handleUserLogin = async (residentData) => {
      try { 
        // Auth is already handled by LoginScreen (Email/Password)
        // We just need to sync state and Firestore
        const uid = auth.currentUser?.uid || residentData.uid;

        if (uid) {
            // SYNC 1: Copy resident data to user's private profile
            await setDoc(doc(db, 'artifacts', APP_ID, 'users', uid, 'profile', 'main'), residentData);
            
            // SYNC 2: Link this UID back to the public resident document
            await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', residentData.id), {
                linkedUid: uid,
                lastLoginAt: new Date().toISOString()
            });
        }

        setResident(residentData);
        setProfile(residentData);
        localStorage.setItem('resident_data', JSON.stringify(residentData));
        setIsLoginRequired(false);
        showToast(`Selamat datang, ${residentData.name}!`, "success"); 
      } catch (e) { 
        console.error(e);
        showToast("Gagal menyinkronkan data.", "error"); 
      }
  };
  
  // Logout handler
  const handleLogout = async () => { 
    if (isNavBlocked) {
        setPendingAction({ type: 'LOGOUT' });
        setShowUnsavedModal(true);
        return;
    }
    await processLogout();
  };

  const processLogout = async () => {
    await signOut(auth); 
    setUser(null); 
    setResident(null);
    setProfile(null);
    localStorage.removeItem('resident_data');
    setIsLoginRequired(true); 
    setActiveTab('home');
  };

  const confirmPendingAction = () => {
    setShowUnsavedModal(false);
    setIsNavBlocked(false); // Force unblock to allow navigation
    if (pendingAction?.type === 'TAB') {
        setActiveTab(pendingAction.payload);
    } else if (pendingAction?.type === 'LOGOUT') {
        processLogout();
    }
    setPendingAction(null);
  };

  // Loading state
  if (loading) return (
    <div className="h-[100dvh] flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-emerald-600 w-10 h-10"/>
    </div>
  );

  // Login screen
  if (isLoginRequired) return <LoginScreen onLogin={handleUserLogin} showToast={showToast} />;

  // Main app
  return (
    <div className="min-h-[100dvh] bg-[#F5F7FA] font-sans pb-28 relative text-gray-900 overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
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
                <button onClick={handleOpenNotifications} className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors active:scale-95">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white text-[10px] font-black text-white flex items-center justify-center animate-bounce-in shadow-sm shadow-red-200">
                            !
                        </span>
                    )}
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
                <DashboardHero profile={resident || profile} onShowId={() => setShowIdCard(true)} />
                <BillingWidget resident={resident} showToast={showToast} />
                <CompactIoT user={user} />
                <NewsCarousel resident={resident} onNavigate={handleTabChange} />
                <RecentReports user={user} />
             </div>
          )}
          {activeTab === 'finance' && <FinanceScreen resident={resident} showToast={showToast} />}
          {activeTab === 'social' && <SocialScreen user={user} resident={resident} showToast={showToast} />}
          {activeTab === 'report' && <ReportScreen user={user} profile={resident || profile} showToast={showToast} />}
          {activeTab === 'profile' && <ProfileScreen user={user} profile={resident || profile} onLogout={handleLogout} showToast={showToast} setIsNavBlocked={setIsNavBlocked} />}
       </div>

       {/* Bottom Navigation */}
       <div className="fixed bottom-6 left-5 right-5 max-w-[480px] mx-auto bg-white/95 backdrop-blur-xl border border-white/40 h-[72px] rounded-[32px] flex justify-between items-center px-6 shadow-[0_8px_40px_rgba(0,0,0,0.08)] z-40 select-none pb-safe">
          <button onClick={() => handleTabChange('home')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='home'?'text-emerald-600':'text-gray-400'}`}><Home className={`w-6 h-6 ${activeTab==='home'?'fill-current':''}`} /></button>
          <button onClick={() => handleTabChange('finance')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='finance'?'text-emerald-600':'text-gray-400'}`}><Wallet className={`w-6 h-6 ${activeTab==='finance'?'fill-current':''}`} /></button>
          <div className="relative -top-8"><button onClick={() => handleTabChange('profile')} className={`w-[70px] h-[70px] bg-emerald-900 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-900/40 border-[6px] border-[#F5F7FA] active:scale-95 transition-all hover:scale-105 ${activeTab==='profile'?'ring-4 ring-emerald-100':''}`}><User className="w-8 h-8" /></button></div>
          <button onClick={() => handleTabChange('report')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='report'?'text-emerald-600':'text-gray-400'}`}><FilePlus className={`w-6 h-6 ${activeTab==='report'?'fill-current':''}`} /></button>
          <button onClick={() => handleTabChange('social')} className={`flex flex-col items-center gap-1 w-12 transition-all active:scale-90 ${activeTab==='social'?'text-emerald-600':'text-gray-400'}`}><Users className={`w-6 h-6 ${activeTab==='social'?'fill-current':''}`} /></button>
       </div>

       {/* Modals */}
       {showIdCard && <IdCardModal user={user} profile={profile} onClose={() => setShowIdCard(false)} />}
       {showNotifications && <NotificationModal resident={resident} onClose={() => setShowNotifications(false)} />}
       <ConciergeWidget />

       {/* Unsaved Changes Confirmation Modal */}
       {showUnsavedModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-scale-in">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <AlertTriangle className="w-6 h-6 text-yellow-600"/>
                    </div>
                    <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Simpan Perubahan?</h3>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        Anda memiliki perubahan yang belum disimpan. Jika Anda keluar halaman ini, <b>perubahan akan hilang</b>.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowUnsavedModal(false)}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={confirmPendingAction}
                            className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white font-bold text-sm hover:bg-yellow-600 shadow-lg shadow-yellow-200 transition-colors"
                        >
                            Abaikan & Keluar
                        </button>
                    </div>
                </div>
            </div>
       )}
    </div>
  );
}