// Profile Screen Component
import React, { useState, useEffect } from 'react';
import { User, Briefcase, Home, LogOut, Save, BadgeCheck, Shield, QrCode } from 'lucide-react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, APP_ID, LOGO_URL, USER_PHOTO_URL } from '../../config';

export const ProfileScreen = ({ user, onLogout, showToast }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});

    useEffect(() => {
        if(!user) return;
        const unsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), s => {
            if(s.exists()) setProfileData(s.data());
            else {
                const defaultProfile = { name: "Andi Agus Salim", job: "Dosen Telkom University", cluster: "Tahap 1", unit: "Adi Gladiol 18", status: "Warga Tetap" };
                setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), defaultProfile);
                setProfileData(defaultProfile);
            }
        }, (err) => console.error(err));
        return () => unsub();
    }, [user]);

    const handleSaveProfile = async () => {
        await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), profileData);
        setIsEditing(false);
        showToast("Profil berhasil diperbarui!", "success");
    };

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
