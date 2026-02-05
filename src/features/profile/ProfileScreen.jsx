// Profile Screen Component
import React, { useState, useEffect } from 'react';
import { User, Briefcase, Home, LogOut, Save, BadgeCheck, Shield, QrCode, Phone, Users, Plus, Trash2 } from 'lucide-react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, APP_ID, LOGO_URL, USER_PHOTO_URL } from '../../config';

export const ProfileScreen = ({ user, onLogout, showToast, setIsNavBlocked }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [showSingleConfirm, setShowSingleConfirm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, index: null });
    const [tempFamily, setTempFamily] = useState({ name: '', relation: 'Anak' });
    const [customJob, setCustomJob] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
                const defaultProfile = { name: "Warga Baru", job: "-", unit: "-", status: "Warga Tetap", family: [] };
                setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), defaultProfile);
                setProfileData(defaultProfile);
            }
        }, (err) => console.error(err));
        return () => unsub();
    }, [user?.uid]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        // Handle custom job logic
        let finalJob = profileData.job;
        if (profileData.job === '_CUSTOM_') {
            finalJob = customJob.trim() || '-';
        }

        // Handle pending family member (Auto-add if user forgot to click +)
        let finalFamily = Array.isArray(profileData.family) ? [...profileData.family] : [];
        if (tempFamily.name && tempFamily.name.trim() !== '') {
            finalFamily.push(tempFamily);
        }

        try {
            // 1. Update Private Profile (Local)
            const payload = {
                ...profileData,
                job: finalJob,
                family: finalFamily,
                updatedAt: new Date().toISOString()
            };
            // Remove cluster data if any
            delete payload.cluster;

            await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), payload);

            // 2. Sync to Public Data (Admin) - IF resident ID exists
            // We use profileData.id which should have been brought over during login/sync
            if (profileData.id) {
                await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', profileData.id), {
                    name: profileData.name,
                    job: finalJob,
                    phone: profileData.phone || '',
                    isSingle: profileData.isSingle || false,
                    family: finalFamily,
                    updatedBy: 'USER_SYNC',
                    lastSyncAt: new Date().toISOString()
                });
                console.log("Synced to public resident data:", profileData.id);
            }

            // Update local state to reflect changes
            setProfileData(prev => ({ ...prev, job: finalJob, family: finalFamily }));
            setTempFamily({ name: '', relation: 'Anak' });
            
            setIsEditing(false);
            showToast("Profil berhasil diperbarui & disinkronkan!", "success");
        } catch (error) {
            console.error(error);
            showToast("Gagal menyimpan profil.", "error");
        }
        setIsSaving(false);
    };

    const addFamilyMember = () => {
        if(!tempFamily.name) return;
        setProfileData(prev => {
            const currentFamily = Array.isArray(prev.family) ? prev.family : [];
            return { ...prev, family: [...currentFamily, tempFamily] };
        });
        setTempFamily({ name: '', relation: 'Anak' });
    };

    const removeFamilyMember = (idx) => {
        setDeleteConfirm({ show: true, index: idx });
    };

    const confirmDeleteFamilyMember = async () => {
        setIsSaving(true);
        try {
            const currentFamily = Array.isArray(profileData.family) ? profileData.family : [];
            const newFamily = currentFamily.filter((_, i) => i !== deleteConfirm.index);
            
            // 1. Update Private Data
            await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), {
                ...profileData,
                family: newFamily,
                updatedAt: new Date().toISOString()
            });

            // 2. Update Public Data
            if (profileData.id) {
                await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'residents', profileData.id), {
                    family: newFamily,
                    updatedBy: 'USER_DELETE_FAMILY',
                    lastSyncAt: new Date().toISOString()
                });
            }

            // 3. Update Local State
            setProfileData(prev => ({ ...prev, family: newFamily }));
            setDeleteConfirm({ show: false, index: null });
            showToast("Anggota keluarga berhasil dihapus.", "success");

        } catch (error) {
            console.error("Delete failed:", error);
            showToast("Gagal menghapus data.", "error");
        }
        setIsSaving(false);
    };

    const getFamilyList = () => {
        return Array.isArray(profileData.family) ? profileData.family : [];
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
                <button onClick={onLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform hover:bg-red-100"><LogOut className="w-3.5 h-3.5"/> Keluar</button>
            </div>
            
            {/* ID Card */}
            <div className="relative w-full aspect-[1.58/1] max-w-[400px] mx-auto bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] rounded-[24px] overflow-hidden shadow-2xl shadow-emerald-900/30 border border-white/10 mb-8 transform transition-transform hover:scale-[1.02] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                <div className="p-6 h-full flex flex-col relative z-10">
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
                            <img src={USER_PHOTO_URL} className="w-full h-full rounded-full object-cover border-[3px] border-[#203A43]" alt="Profile" />
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
                    <button onClick={()=>setIsEditing(!isEditing)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                        {isEditing ? 'Batal' : 'Edit Data'}
                    </button>
                </div>
                {isEditing ? (
                    <div className="w-full space-y-4 mt-2 animate-fade-in">
                        {/* Editable Fields */}
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Nama Lengkap</label><input className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none" value={profileData.name||''} onChange={e=>setProfileData({...profileData, name:e.target.value})}/></div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Pekerjaan</label>
                            <select 
                                className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none"
                                value={jobOptions.includes(profileData.job) ? profileData.job : '_CUSTOM_'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '_CUSTOM_') {
                                        setProfileData({...profileData, job: '_CUSTOM_'});
                                    } else {
                                        setProfileData({...profileData, job: val});
                                    }
                                }}
                            >
                                <option value="">-- Pilih Pekerjaan --</option>
                                {jobOptions.map(opt => (
                                    <option key={opt} value={opt === 'Lainnya' ? '_CUSTOM_' : opt}>{opt}</option>
                                ))}
                            </select>
                            {(profileData.job === '_CUSTOM_' || (!jobOptions.includes(profileData.job) && !['', '-'].includes(profileData.job))) && (
                                <input 
                                    className="w-full bg-gray-50 p-3 rounded-xl text-sm mt-2 border border-emerald-200 outline-none" 
                                    placeholder="Tulis pekerjaan..."
                                    value={profileData.job === '_CUSTOM_' ? customJob : (jobOptions.includes(profileData.job) ? '' : profileData.job)}
                                    onChange={e => {
                                        setCustomJob(e.target.value);
                                        setProfileData({...profileData, job: '_CUSTOM_'});
                                    }}
                                />
                            )}
                        </div>
                        
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">No. WhatsApp</label><input className="w-full bg-gray-50 p-3 rounded-xl text-base font-bold border-b-2 border-emerald-500 outline-none" placeholder="08..." value={profileData.phone||''} onChange={e=>setProfileData({...profileData, phone:e.target.value})}/></div>

                        {/* Read Only Fields (Locked) */}
                        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                             <p className="text-[10px] font-bold text-red-400 uppercase mb-2 flex items-center gap-1"><Shield className="w-3 h-3"/> Data Terkunci (Hubungi RT)</p>
                             <div className="opacity-70">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase block text-left mb-1">Unit / Blok</label><input disabled className="w-full bg-white p-2 rounded-lg text-sm font-bold border border-gray-200" value={profileData.unit||''} /></div>
                             </div>
                        </div>

                        {/* Status Lajang */}
                        <div className="flex items-center gap-3 py-2 bg-gray-50 p-3 rounded-xl">
                            <input 
                                type="checkbox" 
                                checked={profileData.isSingle || false} 
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    if (isChecked && profileData.family && profileData.family.length > 0) {
                                        setShowSingleConfirm(true);
                                    } else {
                                        setProfileData({ ...profileData, isSingle: isChecked });
                                    }
                                }} 
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" 
                            />
                            <span className="text-sm font-bold text-gray-700">Saya Belum Menikah (Lajang)</span>
                        </div>

                        {/* Family Section */}
                        {(!profileData.isSingle) && (
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
                                    setProfileData({ ...profileData, isSingle: true, family: [] });
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
        </div>
    );
};
