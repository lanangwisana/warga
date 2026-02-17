// Login Screen with Smart Flow
// Flow: Phone Check → Login or Activate (returning users skip to Login)
import React, { useState } from 'react';
import { User, Lock, Phone, ArrowRight, Loader2, Eye, EyeOff, Mail, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { LOGO_URL, db, auth, APP_ID } from '../../config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export const LoginScreen = ({ onLogin, showToast }) => {
  // Smart mode: check localStorage to skip phone check for returning users
  const [mode, setMode] = useState(() => {
    const hasLoggedIn = localStorage.getItem('warga_has_logged_in');
    return hasLoggedIn === 'true' ? 'login' : 'phone_check';
  });
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [residentData, setResidentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // --- PHONE CHECK (Smart Entry Point) ---
  const handlePhoneCheck = async (e) => {
    e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'residents'),
        where('phone', '==', phone)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        showToast("Nomor WhatsApp tidak terdaftar sebagai warga.", "error");
        setIsLoading(false);
        return;
      }

      const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      
      // Already activated? → Go to login
      if (data.linkedUid || (data.email && data.email.includes('@') && !data.email.includes('@warga.bumiadipura.id'))) {
        // Pre-fill email if available
        if (data.email && data.email.includes('@')) {
          setEmail(data.email);
        }
        setMode('login');
        showToast(`Hai ${data.name}! Silakan masukkan password.`, "success");
      } else {
        // Not activated → Go to activation
        setResidentData(data);
        setMode('activate');
        showToast(`Data warga ditemukan! Silakan buat akun baru.`, "success");
      }
    } catch (error) {
      console.error("Phone Check Error:", error);
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Find Resident Data by UID
      const q = query(
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'residents'),
        where('linkedUid', '==', userCredential.user.uid)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        // Save to localStorage for next visit
        localStorage.setItem('warga_has_logged_in', 'true');
        onLogin({ ...data, uid: userCredential.user.uid });
      } else {
        // Fallback: Check via email
        const qEmail = query(
            collection(db, 'artifacts', APP_ID, 'public', 'data', 'residents'),
            where('email', '==', email)
        );
        const snapshotEmail = await getDocs(qEmail);
        
        if (!snapshotEmail.empty) {
             const data = { id: snapshotEmail.docs[0].id, ...snapshotEmail.docs[0].data() };
             if (!data.linkedUid) {
                 await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', data.id), {
                     linkedUid: userCredential.user.uid
                 });
             }
             localStorage.setItem('warga_has_logged_in', 'true');
             onLogin({ ...data, uid: userCredential.user.uid });
        } else {
            showToast("Akun tidak terhubung dengan data warga.", "error");
            auth.signOut();
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
      let msg = '';
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          msg = 'Email atau Password salah.';
          break;
        case 'auth/too-many-requests':
          msg = 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.';
          break;
        case 'auth/user-disabled':
          msg = 'Akun Anda dinonaktifkan. Hubungi pengurus RT/RW.';
          break;
        case 'auth/invalid-email':
          msg = 'Format email tidak valid.';
          break;
        default:
          msg = 'Gagal login: ' + error.message;
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIVATION LOGIC ---
  const completeActivation = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return showToast("Password minimal 6 karakter.", "error");
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return showToast("Konfirmasi password tidak cocok.", "error");
    }
    
    setIsLoading(true);
    setErrorMessage('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', residentData.id), {
        linkedUid: userCredential.user.uid,
        email: email,
        isProfileCompleted: true
      });

      localStorage.setItem('warga_has_logged_in', 'true');
      showToast("Aktivasi berhasil! Anda otomatis login.", "success");
      onLogin({ ...residentData, uid: userCredential.user.uid, email, isProfileCompleted: true });

    } catch (error) {
      console.error("Activation Error:", error);
      
      if (error.code === 'auth/weak-password') {
          const msg = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
          setErrorMessage(msg);
          showToast(msg, 'error');
      } else if (error.code === 'auth/invalid-email') {
          const msg = 'Format email tidak valid. Periksa kembali.';
          setErrorMessage(msg);
          showToast(msg, 'error');
      } else if (error.code === 'auth/too-many-requests') {
          const msg = 'Terlalu banyak percobaan. Coba lagi nanti.';
          setErrorMessage(msg);
          showToast(msg, 'error');
      } else if (error.code === 'auth/email-already-in-use') {
          try {
              const userCredential = await signInWithEmailAndPassword(auth, email, password);
              await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', residentData.id), {
                linkedUid: userCredential.user.uid,
                email: email,
                isProfileCompleted: true
              });
              localStorage.setItem('warga_has_logged_in', 'true');
              showToast("Akun sudah ada & berhasil ditautkan!", "success");
              onLogin({ ...residentData, uid: userCredential.user.uid, email, isProfileCompleted: true });
              return;
          } catch (loginErr) {
              let msg = '';
              if (loginErr.code === 'auth/invalid-credential') {
                  msg = 'Email sudah terdaftar dengan password berbeda. Silakan gunakan password yang sesuai atau login langsung.';
              } else {
                  msg = 'Gagal aktivasi: Email sudah digunakan.';
              }
              setErrorMessage(msg);
              showToast(msg, 'error');
          }
      } else {
        const msg = 'Gagal aktivasi: ' + error.message;
        setErrorMessage(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- FORGOT PASSWORD ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return showToast("Masukkan email Anda.", "error");

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Link reset dikirim. Cek Inbox atau folder Spam!", "success");
      setMode('login');
    } catch (error) {
      console.error("Reset Error:", error);
      switch (error.code) {
        case 'auth/user-not-found':
          showToast("Email tidak terdaftar.", "error");
          break;
        case 'auth/too-many-requests':
          showToast("Terlalu banyak permintaan reset. Coba lagi nanti.", "error");
          break;
        case 'auth/invalid-email':
          showToast("Format email tidak valid.", "error");
          break;
        default:
          showToast("Gagal mengirim link: " + error.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- GANTI AKUN (Reset localStorage & kembali ke phone check) ---
  const handleSwitchAccount = () => {
    localStorage.removeItem('warga_has_logged_in');
    setEmail('');
    setPassword('');
    setPhone('');
    setMode('phone_check');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#F5F7FA] relative overflow-hidden touch-none select-none overscroll-none">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-100 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-60"></div>
      
      <div className="z-10 w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center mx-auto mb-4 transform rotate-3 ring-4 ring-white">
             <img src={LOGO_URL} className="w-10 h-10 object-contain brightness-0 invert drop-shadow-md" alt="Logo" onError={(e) => e.target.style.display='none'} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bumi Adipura</h1>
          <p className="text-sm text-gray-500 font-medium">Smart Living App</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all duration-300">
          
          {/* ==================== MODE: PHONE CHECK ==================== */}
          {mode === 'phone_check' && (
            <form onSubmit={handlePhoneCheck} className="space-y-4 animate-fade-in">
              <div className="text-center mb-4">
                <h3 className="font-bold text-gray-800">Selamat Datang!</h3>
                <p className="text-xs text-gray-500">Masukkan nomor WhatsApp yang terdaftar di RT</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nomor WhatsApp</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="0812..." 
                    className="bg-transparent w-full outline-none font-bold text-gray-800 text-sm" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> LANJUTKAN</>}
              </button>

              {/* Option for returning users who cleared cache */}
              <div className="pt-3 border-t border-gray-100 mt-4">
                <p className="text-center text-[10px] text-gray-400 mb-2">Sudah punya akun & ingat email?</p>
                <button 
                  type="button" 
                  onClick={() => setMode('login')} 
                  className="w-full py-2.5 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  LOGIN LANGSUNG DENGAN EMAIL
                </button>
              </div>
            </form>
          )}

          {/* ==================== MODE: LOGIN ==================== */}
          {mode === 'login' && (
            <form onSubmit={(e) => { setErrorMessage(''); handleLogin(e); }} className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="nama@email.com" 
                    className="bg-transparent w-full outline-none font-bold text-gray-800 text-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
                  <button type="button" onClick={() => setMode('forgot_password')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700">Lupa Password?</button>
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all relative">
                  <Lock className="w-5 h-5 text-gray-400 mr-3" />
                  <input 
                    type={showPass ? "text" : "password"}
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••" 
                    className="bg-transparent w-full outline-none font-bold text-gray-800 text-sm" 
                    required 
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              {/* Inline Error Alert */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl animate-fade-in">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Login Gagal</p>
                    <p className="text-xs mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "MASUK SEKARANG"}
              </button>

              <div className="pt-4 border-t border-gray-100 mt-6 space-y-2">
                <button 
                  type="button" 
                  onClick={handleSwitchAccount} 
                  className="w-full py-2.5 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Ganti Akun / Nomor Lain
                </button>
              </div>

              <div className="mt-2 text-center">
                  <p className="text-[10px] text-gray-400 italic">
                    Tidak menerima email verifikasi/reset? Cek folder <b>SPAM</b>.
                  </p>
              </div>
            </form>
          )}

          {/* ==================== MODE: ACTIVATE ==================== */}
          {mode === 'activate' && (
            <form onSubmit={(e) => { setErrorMessage(''); completeActivation(e); }} className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50 p-4 rounded-2xl mb-4 border border-emerald-100">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                     <CheckCircle className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="font-bold text-sm text-gray-800">{residentData?.name}</p>
                     <p className="text-xs text-emerald-600 font-medium">Data Terverifikasi ✓</p>
                   </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Aktif</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="Email untuk login" 
                        className="bg-transparent w-full outline-none font-bold text-gray-800 text-sm" 
                        required 
                    />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Buat Password</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all relative">
                    <Lock className="w-5 h-5 text-gray-400 mr-3" />
                    <input 
                        type={showPass ? "text" : "password"}
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Minimal 6 karakter" 
                        className="bg-transparent w-full outline-none font-bold text-gray-800 text-sm" 
                        required 
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 text-gray-400">
                      {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Konfirmasi Password</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all relative">
                    <Lock className="w-5 h-5 text-gray-400 mr-3" />
                    <input 
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="Ulangi password" 
                        className="bg-transparent w-full outline-none font-bold text-gray-800 text-sm" 
                        required 
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 text-gray-400">
                      {showConfirmPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                    </div>
                </div>
              </div>

              {/* Inline Error Alert */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl animate-fade-in">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Aktivasi Gagal</p>
                    <p className="text-xs mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AKTIFKAN AKUN"}
              </button>
              
              <button type="button" onClick={handleSwitchAccount} className="w-full text-gray-400 text-xs font-bold py-3 hover:text-gray-600">Batal & Kembali</button>
            </form>
          )}

          {/* ==================== MODE: FORGOT PASSWORD ==================== */}
          {mode === 'forgot_password' && (
             <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
                <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 text-yellow-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-800">Lupa Password?</h3>
                    <p className="text-xs text-gray-500">Masukkan email Anda untuk reset password</p>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Terdaftar</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="nama@email.com" 
                        className="bg-transparent w-full outline-none font-bold text-gray-800 text-sm" 
                        required 
                    />
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "KIRIM LINK RESET"}
                </button>

                <p className="text-[10px] text-yellow-600 mt-3 text-center italic px-4">
                    * Cek Inbox atau folder <b>SPAM</b> jika email konfirmasi tidak muncul.
                </p>
                
                <button type="button" onClick={() => setMode('login')} className="w-full text-gray-400 text-xs font-bold py-3 hover:text-gray-600">Kembali ke Login</button>
             </form>
          )}

        </div>
        
        <p className="text-center text-[10px] text-gray-400 mt-8 font-medium">Bumi Adipura • Connected Community</p>
      </div>
    </div>
  );
};
