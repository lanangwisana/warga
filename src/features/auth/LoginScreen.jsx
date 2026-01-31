// Login Screen
import React, { useState } from 'react';
import { User, Home, Lock, Phone, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { LOGO_URL, db, auth, APP_ID } from '../../config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export const LoginScreen = ({ onLogin, showToast }) => {
  const [mode, setMode] = useState('check_phone'); // check_phone, input_password, input_pin, setup_password
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [residentData, setResidentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Check if phone number exists in residents collection
  const checkPhone = async (e) => {
    e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    try {
      // Query residents collection in public data
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

      // Found resident
      const residentDoc = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      setResidentData(residentDoc);
      
      // Determine next step
      if (residentDoc.password) {
        setMode('input_password');
      } else {
        setMode('input_pin');
        showToast("Login pertama kali detected. Silakan masukkan PIN Akses.", "info");
      }
      
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Convert Phone to System Email
  const getSystemEmail = (phoneNum) => {
      // Remove '0', '+62', etc to standard format if needed, but simple append works for consistency if input is validated
      return `${phoneNum.replace(/\D/g,'')}@warga.bumiadipura.id`;
  };

  // Verify Password & Login
  const verifyPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const email = getSystemEmail(phone); // Use phone state or residentData.phone

    try {
        // 1. Try to login to Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // 2. Success - Link UID if missing
        if (!residentData.linkedUid) {
             await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', residentData.id), {
                 linkedUid: userCredential.user.uid
             });
        }

        onLogin({ ...residentData, uid: userCredential.user.uid });

    } catch (error) {
        console.log("Auth Error:", error.code);
        
        // MIGRATION LOGIC: 
        // If user not found in Auth but password matches Firestore data (Legacy User)
        // We create the Auth account for them now.
        if ((error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') && password === residentData.password) {
             try {
                 const newUser = await createUserWithEmailAndPassword(auth, email, password);
                 
                 // Save stable UID
                 await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', residentData.id), {
                     linkedUid: newUser.user.uid
                 });

                 showToast("Akun berhasil dimigrasi ke sistem baru.", "success");
                 onLogin({ ...residentData, uid: newUser.user.uid });
                 return;
             } catch (regError) {
                 console.error(regError);
                 showToast("Gagal migrasi akun: " + regError.message, "error");
             }
        } else {
             showToast("Password salah atau akun bermasalah.", "error");
        }
    } finally {
        setIsLoading(false);
    }
  };

  // Verify PIN (First Time)
  const verifyPin = (e) => {
    e.preventDefault();
    // For prototype/testing, we accept '123456' as universal access PIN
    // Or allow any PIN > 4 chars
    if (pin === '123456' || pin.length >= 6) {
      setMode('setup_password');
      showToast("PIN benar. Silakan buat password baru.", "success");
    } else {
      showToast("PIN Akses salah.", "error");
    }
  };

  // Setup New Password
  const handleSetupPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast("Password minimal 6 karakter.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Konfirmasi password tidak cocok.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const email = getSystemEmail(phone); // Use phone from state

      // 1. Create User in Firebase Auth (Stable UID)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUid = userCredential.user.uid;

      // 2. Update password & UID in Firestore
      const residentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', residentData.id);
      await updateDoc(residentRef, {
        password: password, // Still keeping for redundancy/legacy, optional
        linkedUid: newUid,  // Link to Auth
        isProfileCompleted: true
      });
      
      showToast("Password berhasil dibuat!", "success");
      
      // Auto login
      onLogin({ ...residentData, password, isProfileCompleted: true, uid: newUid });
      
    } catch (err) {
      console.error("Setup Password Error:", err);
      if (err.code === 'auth/email-already-in-use') {
          showToast("Nomor ini sudah terdaftar. Silakan login.", "error");
          setMode('input_password');
      } else {
          showToast("Gagal membuat akun: " + err.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
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

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all duration-300">
            {/* Step 1: Check Phone */}
            {mode === 'check_phone' && (
                <form onSubmit={checkPhone} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nomor WhatsApp</label>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
                            <Phone className="w-5 h-5 text-gray-400 mr-3" />
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)} 
                                placeholder="0812..." 
                                className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" 
                                required 
                                autoFocus
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LANJUTKAN"} 
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">Masukkan nomor yang terdaftar di RT/RW</p>
                </form>
            )}

            {/* Step 2A: PIN (First Time) */}
            {mode === 'input_pin' && (
                <form onSubmit={verifyPin} className="space-y-4 animate-fade-in">
                    <div className="text-center mb-4">
                        <p className="font-bold text-gray-800">{residentData?.name}</p>
                        <p className="text-xs text-gray-500">{residentData?.unit}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">PIN Akses (Aktivasi)</label>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
                            <Lock className="w-5 h-5 text-gray-400 mr-3" />
                            <input 
                                type="text" 
                                value={pin} 
                                onChange={e => setPin(e.target.value)} 
                                placeholder="Masukkan PIN Akses" 
                                className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" 
                                required 
                                autoFocus
                            />
                        </div>
                        <p className="text-[10px] text-blue-500 ml-1 italic">*Gunakan '123456' untuk testing</p>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center justify-center gap-2 mt-2">
                        VERIFIKASI PIN
                    </button>
                    <button type="button" onClick={() => setMode('check_phone')} className="w-full text-gray-400 text-xs font-bold py-2">Kembali</button>
                </form>
            )}

            {/* Step 2B: Password (Returning User) */}
            {mode === 'input_password' && (
                <form onSubmit={verifyPassword} className="space-y-4 animate-fade-in">
                    <div className="text-center mb-4">
                        <p className="font-bold text-gray-800">{residentData?.name}</p>
                        <p className="text-xs text-gray-500">{residentData?.unit}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5 relative">
                            <Lock className="w-5 h-5 text-gray-400 mr-3" />
                            <input 
                                type={showPass ? "text" : "password"}
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="••••••" 
                                className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" 
                                required 
                                autoFocus
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 text-gray-400">
                                {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center justify-center gap-2 mt-2">
                        MASUK
                    </button>
                    <button type="button" onClick={() => setMode('check_phone')} className="w-full text-gray-400 text-xs font-bold py-2">Ganti Akun</button>
                </form>
            )}

            {/* Step 3: Setup Password (New User) */}
            {mode === 'setup_password' && (
                <form onSubmit={handleSetupPassword} className="space-y-4 animate-fade-in">
                    <div className="text-center mb-2">
                        <h3 className="font-bold text-gray-800">Buat Password</h3>
                        <p className="text-xs text-gray-500">Amankan akun Anda untuk login selanjutnya</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password Baru</label>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
                            <Lock className="w-5 h-5 text-gray-400 mr-3" />
                            <input 
                                type="password"
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="Minimal 6 karakter" 
                                className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" 
                                required 
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Konfirmasi Password</label>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
                            <Lock className="w-5 h-5 text-gray-400 mr-3" />
                            <input 
                                type="password"
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                placeholder="Ulangi password" 
                                className="bg-transparent w-full outline-none font-bold text-gray-800 text-base" 
                                required 
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center justify-center gap-2 mt-2">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SIMPAN & MASUK"}
                    </button>
                </form>
            )}
        </div>
        
        <p className="text-center text-[10px] text-gray-400 mt-8 font-medium">Bumi Adipura • Connected Community</p>
      </div>
    </div>
  );
};
