// Report Screen Component with Image Upload
import React, { useState, useEffect } from 'react';
import { FileText, Plus, ChevronRight, X, Sparkles, Loader2, FileCheck, Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { collection, onSnapshot, addDoc, setDoc, doc } from 'firebase/firestore';
import { db, APP_ID } from '../../config';
import { callGeminiAPI, compressImage } from '../../utils';
import { RecentReports } from '../dashboard';

export const ReportScreen = ({ user, profile, showToast }) => {
    const [tab, setTab] = useState('report'); 
    const [desc, setDesc] = useState('');
    const [type, setType] = useState('keramaian');
    const [date, setDate] = useState('');
    const [isBlockingRoad, setIsBlockingRoad] = useState(false);
    const [permits, setPermits] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Image upload states (Multiple images - max 5)
    const [images, setImages] = useState([]); // Array of { preview, base64 }
    const [isCompressing, setIsCompressing] = useState(false);
    const MAX_IMAGES = 5;

    useEffect(() => {
        if(!user) return;
        const unsub = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'permits'), (s) => {
            const myPermits = s.docs
                .map(d => ({id:d.id, ...d.data()}))
                .filter(p => p.userId === user.uid)
                .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            setPermits(myPermits);
        }, (err) => console.error("Permits fetch error:", err));
        return () => unsub();
    }, [user]);

    // Handle Image Selection (Multiple)
    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (images.length >= MAX_IMAGES) {
            showToast(`Maksimal ${MAX_IMAGES} gambar`, 'error');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showToast('Mohon pilih file gambar (JPG, PNG)', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showToast('Ukuran file maksimal 10MB', 'error');
            return;
        }
        
        setIsCompressing(true);
        try {
            const base64 = await compressImage(file);
            setImages(prev => [...prev, { preview: base64, base64 }]);
        } catch (error) {
            showToast('Gagal memproses gambar', 'error');
        }
        setIsCompressing(false);
        // Reset input
        e.target.value = '';
    };
    
    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };
    
    const clearAllImages = () => {
        setImages([]);
    };

    const handleReportSubmit = async () => { 
        if(!desc) {
            showToast('Mohon isi deskripsi laporan', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            // Create report ID first
            const reportRef = doc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'reports'));
            const reportId = reportRef.id;
            
            // If there are images, save them to users collection
            if (images.length > 0) {
                const imageData = images.map(img => img.base64);
                await setDoc(
                    doc(db, 'artifacts', APP_ID, 'users', user.uid, 'report_images', reportId),
                    { 
                        images: imageData, // Array of base64 strings
                        imageCount: images.length,
                        createdAt: new Date().toISOString()
                    }
                );
            }
            
            // Save report to public (without imageBase64, only hasImage flag)
            await setDoc(reportRef, { 
                category: 'Umum', 
                description: desc, 
                status: 'OPEN', 
                createdAt: new Date().toISOString(),
                userId: user.uid,
                userName: profile?.name || 'Warga',
                userUnit: profile?.unit || '-',
                userCluster: profile?.cluster || '-',
                hasImage: images.length > 0,  // Flag to indicate image exists
                imageCount: images.length     // Number of images
            });
            
            setDesc(''); 
            setImages([]);
            setShowForm(false); 
            showToast("Laporan berhasil dikirim!", "success");
        } catch(e) {
            console.error(e);
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
            await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'permits'), { 
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
                            <button onClick={()=>{setShowForm(false); removeImage();}} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-5 h-5"/></button>
                        </div>
                        {tab === 'report' ? (
                            <div className="space-y-4">
                                <textarea 
                                    className="w-full p-4 bg-gray-50 rounded-2xl text-base border-0 focus:ring-2 focus:ring-emerald-500 h-32 resize-none outline-none placeholder-gray-400 text-gray-800" 
                                    placeholder="Jelaskan masalah..." 
                                    value={desc} 
                                    onChange={e=>setDesc(e.target.value)}
                                />
                                
                                {/* Image Upload Section - Multiple Images */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Foto Pendukung (Maks {MAX_IMAGES})</label>
                                        {images.length > 0 && (
                                            <span className="text-xs text-emerald-600 font-bold">{images.length}/{MAX_IMAGES}</span>
                                        )}
                                    </div>
                                    
                                    {/* Image Previews Grid */}
                                    {images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {images.map((img, index) => (
                                                <div key={index} className="relative aspect-square">
                                                    <img 
                                                        src={img.preview} 
                                                        alt={`Preview ${index + 1}`} 
                                                        className="w-full h-full object-cover rounded-xl border-2 border-emerald-500"
                                                    />
                                                    <button 
                                                        onClick={() => removeImage(index)} 
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600"
                                                    >
                                                        <X className="w-3 h-3"/>
                                                    </button>
                                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Upload Button - Show if less than max */}
                                    {images.length < MAX_IMAGES && (
                                        <label className="block w-full cursor-pointer">
                                            <div className="w-full h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 hover:border-emerald-400 transition-colors">
                                                {isCompressing ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600"/>
                                                        <span className="text-xs text-emerald-600">Memproses...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-5 h-5 text-gray-400"/>
                                                        <span className="text-xs text-gray-500">
                                                            {images.length === 0 ? 'Tap untuk upload foto' : 'Tambah foto lagi'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={isCompressing}/>
                                        </label>
                                    )}
                                </div>
                                
                                {desc.length > 5 && (
                                    <button onClick={handleSmartDraft} disabled={isAnalyzing} className="w-full text-xs font-bold text-purple-600 flex items-center justify-center gap-1 bg-purple-50 px-3 py-3 rounded-xl hover:bg-purple-100 transition-colors">
                                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} 
                                        {isAnalyzing ? "Memperbaiki..." : "Perbaiki Tulisan dengan AI"}
                                    </button>
                                )}
                                <button onClick={handleReportSubmit} disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex justify-center">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : "KIRIM LAPORAN"}
                                </button>
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
