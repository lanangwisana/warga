// Profile Screen Component
import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, Home, LogOut, Save, BadgeCheck, Shield, QrCode, Phone, Users, Plus, Trash2, Camera, X as XIcon } from 'lucide-react';
import { doc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth, APP_ID, LOGO_URL, USER_PHOTO_URL } from '../../config';
import { compressImage } from '../../utils/helpers';

export const ProfileScreen = ({ user, onLogout, showToast, setIsNavBlocked }) => {
    const [editData, setEditData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [showSingleConfirm, setShowSingleConfirm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, index: null });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [tempFamily, setTempFamily] = useState({ name: '', relation: 'Anak' });
    const [customJob, setCustomJob] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
    const photoInputRef = useRef(null);

    // Navigation and Browser reload protection
    useEffect(() => {
        if (setIsNavBlocked) {
            setIsNavBlocked(isEditing);
        }

        const handleBeforeUnload = (e) => {
            if (isEditing) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (setIsNavBlocked) setIsNavBlocked(false);
        };
    }, [isEditing, setIsNavBlocked]);

    useEffect(() => {
        if(!user?.uid) return;
        console.log("Setting up profile listener for:", user.uid);
        const unsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), s => {
            if(s.exists()) {
                console.log("Received profile update from DB");
                setProfileData(s.data());
            } else {
                // DATA HILANG / DIHAPUS ADMIN -> Auto Logout
                console.warn("Profile data missing! Logging out...");
                onLogout();
            }
        }, (err) => console.error(err));
        return () => unsub();
    }, [user?.uid, onLogout]);

    const handleStartEdit = () => {
        setEditData({ ...profileData });
        setIsEditing(true);
    };

    // Handle photo upload
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Pilih file gambar (JPG/PNG)', 'error');
            return;
        }
        setIsUploadingPhoto(true);
        try {
            const base64 = await compressImage(file, 400, 0.6);
            setEditData(prev => ({ ...prev, profilePhoto: base64 }));
            showToast('Foto berhasil dipilih! Tekan Simpan untuk menyimpan.', 'success');
        } catch (err) {
            console.error(err);
            showToast('Gagal memproses foto.', 'error');
        }
        setIsUploadingPhoto(false);
        if (photoInputRef.current) photoInputRef.current.value = '';
    };

    const handleRemovePhoto = () => {
        setShowDeletePhotoConfirm(true);
    };

    const confirmRemovePhoto = async () => {
        setShowDeletePhotoConfirm(false);
        setEditData(prev => ({ ...prev, profilePhoto: '' }));
        try {
            // Delete from private profile
            await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), {
                profilePhoto: deleteField()
            });
            // Also delete from public residents collection
            if (profileData.id) {
                await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', profileData.id), {
                    profilePhoto: deleteField()
                });
            }
            showToast('Foto profil berhasil dihapus!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Gagal menghapus foto.', 'error');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleSaveProfile = async () => {
        if (!editData) return;
        setIsSaving(true);
        // Handle custom job logic
        let finalJob = editData.job;
        if (editData.job === '_CUSTOM_') {
            finalJob = customJob.trim() || '-';
        }

        // Handle pending family member (Auto-add if user forgot to click +)
        let finalFamily = Array.isArray(editData.family) ? [...editData.family] : [];
        if (tempFamily.name && tempFamily.name.trim() !== '') {
            finalFamily.push(tempFamily);
        }

        try {
            // 1. Update Private Profile (Local)
            const payload = {
                ...editData,
                job: finalJob,
                family: finalFamily,
                updatedAt: new Date().toISOString()
            };
            // Remove cluster data if any
            delete payload.cluster;

            // If photo was removed, use deleteField() to remove from Firestore entirely
            if (!payload.profilePhoto) {
                payload.profilePhoto = deleteField();
            }

            await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), payload);

            // 2. Sync to Public Data (Admin) - IF resident ID exists
            // We use editData.id (preserved from profileData)
            if (editData.id) {
                const publicSyncData = {
                    name: editData.name,
                    job: finalJob,
                    phone: editData.phone || '',
                    isSingle: editData.isSingle || false,
                    family: finalFamily,
                    email: editData.email || user.email || '', // Sync Email
                    updatedBy: 'USER_SYNC',
                    lastSyncAt: new Date().toISOString()
                };
                // Sync profilePhoto to public collection
                if (editData.profilePhoto) {
                    publicSyncData.profilePhoto = editData.profilePhoto;
                }
                await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', editData.id), publicSyncData);
                console.log("Synced to public resident data:", editData.id);
            }

            // Update local state to reflect changes (Optimistic)
            setProfileData(payload);
            setTempFamily({ name: '', relation: 'Anak' });
            
            setIsEditing(false);
            setEditData(null);
            showToast("Profil berhasil diperbarui & disinkronkan!", "success");
        } catch (error) {
            console.error(error);
            showToast("Gagal menyimpan profil.", "error");
        }
        setIsSaving(false);
    };

    const handleResetPassword = () => {
        if (!profileData.email && !user.email) {
            showToast("Email tidak ditemukan.", "error");
            return;
        }
        setShowResetConfirmModal(true);
    };

    const confirmResetPassword = async () => {
        setShowResetConfirmModal(false);
        const emailToReset = profileData.email || user.email;
        try {
            await sendPasswordResetEmail(auth, emailToReset);
            showToast(`Link reset dikirim ke ${emailToReset}. Cek Inbox/Spam ya!`, "success");
        } catch (error) {
            console.error("Reset Password Error:", error);
            showToast("Gagal mengirim link reset password.", "error");
        }
    };
    


    const addFamilyMember = () => {
        if(!tempFamily.name) return;
        setEditData(prev => {
            const currentFamily = Array.isArray(prev.family) ? prev.family : [];
            return { ...prev, family: [...currentFamily, tempFamily] };
        });
        setTempFamily({ name: '', relation: 'Anak' });
    };

    const removeFamilyMember = (idx) => {
        setDeleteConfirm({ show: true, index: idx });
    };

    const confirmDeleteFamilyMember = () => {
        // Just update draft state, no DB write yet
        if (editData) {
            const currentFamily = Array.isArray(editData.family) ? editData.family : [];
            const newFamily = currentFamily.filter((_, i) => i !== deleteConfirm.index);
            setEditData({ ...editData, family: newFamily });
            setDeleteConfirm({ show: false, index: null });
        }
    };

    const getFamilyList = () => {
        const sourceFn = isEditing && editData ? editData : profileData;
        return Array.isArray(sourceFn.family) ? sourceFn.family : [];
    };

    const jobOptions = [
        "Wiraswasta", "PNS", "TNI/Polri", "Karyawan Swasta", "Guru/Dosen", 
        "Dokter", "Mahasiswa", "Pelajar", "Ibu Rumah Tangga", "Pensiunan", 
        "Tidak Bekerja", "Lainnya"
    ];

    return (
        <div className="p-5 pt-6 animate-fade-in pb-24">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight"><User className="text-emerald-600 fill-emerald-100"/> Profil Warga</h2>
                <button onClick={() => setShowLogoutConfirm(true)} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform hover:bg-red-100"><LogOut className="w-3.5 h-3.5"/> Keluar</button>
            </div>
            
            {/* ID Card */}
            <div className="relative w-full max-w-[400px] mx-auto bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] rounded-[24px] overflow-hidden shadow-2xl shadow-emerald-900/30 border border-white/10 mb-8 transform transition-transform hover:scale-[1.02] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                <div className="p-6 flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/20 shadow-inner">
                                <img src={LOGO_URL} className="w-full h-full object-contain brightness-0 invert" alt="logo"/>
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
                            {(() => {
                                const photo = isEditing && editData ? editData.profilePhoto : profileData.profilePhoto;
                                const nameSource = isEditing && editData?.name ? editData.name : profileData.name || 'W';
                                const initials = nameSource.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
                                return photo ? (
                                    <img src={photo} alt="profile" className="w-full h-full rounded-full object-cover border-[3px] border-[#203A43]" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center border-[3px] border-[#203A43]">
                                        <span className="text-2xl font-bold text-white">{initials}</span>
                                    </div>
                                );
                            })()}
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-[3px] border-[#203A43] rounded-full flex items-center justify-center shadow-sm">
                                <BadgeCheck className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            {(() => {
                                const cardName = profileData.name || 'Nama Warga';
                                const cardNameSize = cardName.length <= 15 ? 'text-2xl' : cardName.length <= 22 ? 'text-xl' : 'text-base';
                                return <h2 className={`${cardNameSize} font-bold text-white tracking-tight leading-tight break-words`}>{cardName}</h2>;
                            })()}
                            <p className="text-emerald-200 text-xs font-medium truncate mb-2.5 opacity-90">{profileData.job || 'Pekerjaan'}</p>
                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/5 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{profileData.status || 'Warga Tetap'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex justify-between items-end border-t border-white/10 pt-3.5">
                        <div className="flex-1">
                            <p className="text-[8px] text-emerald-400 uppercase tracking-wider mb-0.5 font-bold">Unit</p>
                            <p className="font-bold text-white text-base font-mono tracking-tight">{profileData.unit || '-'}</p>
                        </div>
                        <div className="text-right">
                             <QrCode className="w-8 h-8 text-white opacity-90 mb-1 ml-auto" />
                             <p className="font-mono text-white/60 text-[9px] tracking-widest">{user?.uid ? user.uid.substring(0,8).toUpperCase() : 'UNKNOWN'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Data Diri & Pengaturan</h3>
                    <button 
                        onClick={isEditing ? handleCancelEdit : handleStartEdit} 
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all ${isEditing ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}
                    >
                        {isEditing ? 'Batal' : 'Edit Data'}
                    </button>
                </div>
                {isEditing && editData ? (
                    <div className="w-full space-y-4 mt-2 animate-fade-in">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <div className="relative">
                                {editData.profilePhoto ? (
                                    <div className="relative">
                                        <img src={editData.profilePhoto} alt="preview" className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-md" />
                                        <button onClick={handleRemovePhoto} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                                            <XIcon className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <Camera className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoUpload} className="hidden" />
                            <button 
                                onClick={() => photoInputRef.current?.click()} 
                                disabled={isUploadingPhoto}
                                className="text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Camera className="w-3.5 h-3.5" />
                                {isUploadingPhoto ? 'Memproses...' : editData.profilePhoto ? 'Ganti Foto' : 'Upload Foto Profil'}
                            </button>
                            <p className="text-[10px] text-gray-400">JPG/PNG, otomatis dikompresi</p>
                        </div>

                        {/* Editable Fields */}
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Nama Lengkap</label><input className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none" value={editData.name||''} onChange={e=>setEditData({...editData, name:e.target.value})}/></div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Pekerjaan</label>
                            <select 
                                className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none"
                                value={jobOptions.includes(editData.job) ? editData.job : '_CUSTOM_'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '_CUSTOM_') {
                                        setEditData({...editData, job: '_CUSTOM_'});
                                    } else {
                                        setEditData({...editData, job: val});
                                    }
                                }}
                            >
                                <option value="">-- Pilih Pekerjaan --</option>
                                {jobOptions.map(opt => (
                                    <option key={opt} value={opt === 'Lainnya' ? '_CUSTOM_' : opt}>{opt}</option>
                                ))}
                            </select>
                            {(editData.job === '_CUSTOM_' || (!jobOptions.includes(editData.job) && !['', '-'].includes(editData.job))) && (
                                <input 
                                    className="w-full bg-gray-50 p-3 rounded-xl text-sm mt-2 border border-emerald-200 outline-none" 
                                    placeholder="Tulis pekerjaan..."
                                    value={editData.job === '_CUSTOM_' ? customJob : (jobOptions.includes(editData.job) ? '' : editData.job)}
                                    onChange={e => {
                                        setCustomJob(e.target.value);
                                        setEditData({...editData, job: '_CUSTOM_'});
                                    }}
                                />
                            )}
                        </div>
                        
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">No. WhatsApp</label><input className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none" placeholder="08..." value={editData.phone||''} onChange={e=>setEditData({...editData, phone:e.target.value})}/></div>

                        {/* Keamanan Akun */}
                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                             <p className="text-[10px] font-bold text-yellow-600 uppercase mb-3 flex items-center gap-1"><Shield className="w-3 h-3"/> Keamanan Akun</p>
                             
                             <div className="mb-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Email Terdaftar</label>
                                <input disabled className="w-full bg-white p-2 rounded-lg text-sm font-bold border border-gray-200 text-gray-500" value={editData.email || user.email || '-'} />
                             </div>

                             <button 
                                onClick={handleResetPassword}
                                className="w-full py-2 bg-white border border-yellow-200 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-100 transition-colors"
                             >
                                Ubah Password via Email
                             </button>
                             
                             <p className="text-[10px] text-yellow-600 mt-2 text-center italic">
                                * Link reset akan dikirim ke email. Cek folder <b>SPAM</b> jika tidak ada di Inbox.
                             </p>
                        </div>

                        {/* Read Only Fields (Locked) */}
                        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                             <p className="text-[10px] font-bold text-red-400 uppercase mb-2 flex items-center gap-1"><Shield className="w-3 h-3"/> Data Terkunci (Hubungi RT)</p>
                             <div className="opacity-70">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Unit / Blok</label><input disabled className="w-full bg-white p-2 rounded-lg text-sm font-bold border border-gray-200" value={editData.unit||''} /></div>
                             </div>
                        </div>

                        {/* Status Lajang */}
                        <div className="flex items-center gap-3 py-2 bg-gray-50 p-3 rounded-xl">
                            <input 
                                type="checkbox" 
                                checked={editData.isSingle || false} 
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    if (isChecked && editData.family && editData.family.length > 0) {
                                        setShowSingleConfirm(true);
                                    } else {
                                        setEditData({ ...editData, isSingle: isChecked });
                                    }
                                }} 
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" 
                            />
                            <span className="text-sm font-bold text-gray-700">Saya Belum Menikah (Lajang)</span>
                        </div>

                        {/* Family Section */}
                        {(!editData.isSingle) && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-2">Anggota Keluarga</label>
                                
                                <div className="space-y-2 mb-3">
                                    {getFamilyList().map((m, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-lg shadow-sm">
                                            <div><span className="font-bold text-sm text-gray-800">{m.name}</span> <span className="text-xs text-gray-400 mx-1">•</span> <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{m.relation}</span></div>
                                            <button onClick={()=>removeFamilyMember(i)} className="text-red-400 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex gap-2">
                                    <input placeholder="Nama..." className="flex-1 p-2 rounded-lg text-sm border border-gray-200" value={tempFamily.name} onChange={e=>setTempFamily({...tempFamily, name:e.target.value})} />
                                    <select className="p-2 rounded-lg text-sm border border-gray-200 bg-white" value={tempFamily.relation} onChange={e=>setTempFamily({...tempFamily, relation:e.target.value})}>
                                        <option>Istri</option><option>Suami</option><option>Anak</option><option>Ortu</option>
                                    </select>
                                    <button onClick={addFamilyMember} className="bg-slate-800 text-white p-2 rounded-lg"><Plus className="w-4 h-4"/></button>
                                </div>
                            </div>
                        )}

                        <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs mt-2 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all">
                            {isSaving ? 'Menyimpan...' : <><Save className="w-4 h-4"/> Simpan & Sinkronkan</>}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><User className="w-5 h-5 text-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase">Nama Lengkap</p><p className="text-sm font-bold text-gray-800">{profileData.name}</p></div></div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><Briefcase className="w-5 h-5 text-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase">Pekerjaan</p><p className="text-sm font-bold text-gray-800">{profileData.job === '_CUSTOM_' ? customJob : profileData.job}</p></div></div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><Phone className="w-5 h-5 text-emerald-600"/><div><p className="text-[10px] text-gray-400 uppercase">Kontak</p><p className="text-sm font-bold text-gray-800">{profileData.phone || '-'}</p></div></div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><Home className="w-5 h-5 text-gray-400"/><div><p className="text-[10px] text-gray-400 uppercase">Alamat</p><p className="text-sm font-bold text-gray-800">{profileData.unit} <span className="text-emerald-600">({profileData.status})</span></p></div></div>
                        
                        {/* Family View */}
                        <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                             <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-emerald-600"/><span className="text-xs font-bold text-gray-500 uppercase">Kartu Keluarga</span></div>
                             {profileData.isSingle ? (
                                <p className="text-sm font-medium text-slate-500 italic ml-6">Status: Lajang (Belum Menikah)</p>
                             ) : (
                                <ul className="ml-6 space-y-1">
                                    {getFamilyList().length === 0 ? <li className="text-sm text-gray-400 italic">Belum ada anggota keluarga</li> : 
                                      getFamilyList().map((m, i) => (
                                        <li key={i} className="text-sm font-medium text-gray-700 marker:text-emerald-500 list-disc">{m.name} <span className="text-gray-400 text-xs">({m.relation})</span></li>
                                    ))}
                                </ul>
                             )}
                        </div>

                        
                        {/* Security Info (Read Only) */}
                        <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 mt-2">
                             <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-yellow-600"/>
                                    <span className="text-xs font-bold text-yellow-700 uppercase">Keamanan Akun</span>
                                </div>
                             </div>
                             
                             <div className="bg-white p-2.5 rounded-lg border border-yellow-100 mb-2">
                                <p className="text-[10px] text-gray-400 uppercase">Email Terdaftar</p>
                                <p className="text-sm font-bold text-gray-800 break-all">{profileData.email || user.email || '-'}</p>
                             </div>
                             
                             <p className="text-[10px] text-yellow-600 mb-2 italic">
                                * Link reset akan dikirim ke email. Cek folder <b>SPAM</b> jika tidak ada di Inbox.
                             </p>

                             <button 
                                onClick={handleResetPassword}
                                className="w-full py-2 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-200 transition-colors"
                             >
                                Ubah Password via Email
                             </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Modal for Single Confirmation */}
            {showSingleConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-scale-in">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Shield className="w-6 h-6 text-orange-500"/>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Konfirmasi Status</h3>
                        <p className="text-center text-gray-500 text-sm mb-6">
                            Mengubah status menjadi <b>Lajang</b> akan <span className="text-red-500 font-bold">menghapus semua data</span> Anggota Keluarga yang sudah ada. Apakah Anda yakin?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowSingleConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={() => {
                                    setEditData({ ...editData, isSingle: true, family: [] });
                                    setShowSingleConfirm(false);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modal for Delete Member Confirmation */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-scale-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 className="w-6 h-6 text-red-500"/>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Hapus Anggota Keluarga?</h3>
                        <p className="text-center text-gray-500 text-sm mb-6">
                            Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteConfirm({ show: false, index: null })}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={confirmDeleteFamilyMember}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modal for Logout Confirmation */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-scale-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <LogOut className="w-6 h-6 text-red-500"/>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Konfirmasi Keluar</h3>
                        <p className="text-center text-gray-500 text-sm mb-6">
                            Apakah Anda yakin ingin keluar dari aplikasi?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={onLogout}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modal for Delete Photo Confirmation */}
            {showDeletePhotoConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-scale-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Camera className="w-6 h-6 text-red-500"/>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Hapus Foto Profil?</h3>
                        <p className="text-center text-gray-500 text-sm mb-6">
                            Foto profil Anda akan dihapus dan diganti dengan <b>inisial nama</b>. Perubahan disimpan setelah Anda klik Simpan.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeletePhotoConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={confirmRemovePhoto}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Custom Modal for Reset Password Confirmation */}
            {showResetConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-scale-in">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Shield className="w-6 h-6 text-yellow-600"/>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Reset Password?</h3>
                        <p className="text-center text-gray-500 text-sm mb-6">
                            Link untuk membuat password baru akan dikirim ke email: <br/>
                            <span className="font-bold text-gray-800">{profileData.email || user.email}</span>
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowResetConfirmModal(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={confirmResetPassword}
                                className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white font-bold text-sm hover:bg-yellow-600 shadow-lg shadow-yellow-200 transition-colors"
                            >
                                Kirim Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
            

        </div>
    );
};
