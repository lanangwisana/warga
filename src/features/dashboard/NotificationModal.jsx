import React, { useState, useEffect } from 'react';
import { X, Megaphone, Bell, Calendar, Clock } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, APP_ID } from '../../config';

export const NotificationModal = ({ resident, onClose }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'news'), orderBy('createdAt', 'desc')), (s) => {
            let allNews = s.docs.map(d => ({id:d.id, ...d.data()}));
            
            // FILTER: Warga only sees RW (Global) or their own RT
            if (resident?.rt) {
                const myRt = `RT${resident.rt.toString().padStart(2, '0')}`;
                allNews = allNews.filter(n => 
                    n.createdBy === 'RW' || n.createdBy === myRt
                );
            }
            
            setNews(allNews);
            setLoading(false);
        }, (err) => {
            console.error("News fetch error:", err);
            setLoading(false);
        });
        return () => unsub();
    }, [resident]);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#F8FAFC] w-full max-w-lg h-[80vh] sm:h-[600px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 font-sans">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Berita & Pengumuman</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pesan dari RT & RW</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar font-sans">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-20">
                            <Megaphone className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-sm text-gray-400 italic font-medium">Belum ada pengumuman saat ini.</p>
                        </div>
                    ) : (
                        news.map((n, index) => {
                            const lastReadTime = resident?.lastReadNewsTime || '0';
                            const isUnread = n.createdAt > lastReadTime;
                            const isLatest = index === 0;

                            return (
                                <div 
                                    key={n.id} 
                                    className={`p-5 rounded-[24px] border relative overflow-hidden group transition-all duration-300 ${
                                        isLatest 
                                            ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-100 ring-1 ring-emerald-500/20' 
                                            : 'bg-white border-gray-100 shadow-sm hover:border-emerald-200'
                                    } ${isUnread ? 'ring-2 ring-emerald-500/10 active:ring-emerald-500/30' : ''}`}
                                >
                                    {/* Unread Glow */}
                                    {isUnread && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}

                                    {/* Category Tag & Labels */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-sm ${n.color || 'bg-blue-100 text-blue-700'}`}>
                                                {n.cat || 'Pengumuman'}
                                            </span>
                                            {isUnread && (
                                                <span className="flex items-center gap-0.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                                    BARU
                                                </span>
                                            )}
                                            {isLatest && !isUnread && (
                                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                                    TERKINI
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                            <Clock className="w-3 h-3 text-emerald-500" />
                                            <span>{n.time || '--:--'}</span>
                                        </div>
                                    </div>

                                    <h3 className={`text-base font-black text-gray-900 mb-2 leading-tight transition-colors ${isLatest ? 'text-emerald-900' : 'group-hover:text-emerald-600'}`}>{n.title}</h3>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-4 whitespace-pre-wrap">{n.content}</p>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-400">{n.date}</span>
                                        </div>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${n.createdBy === 'RW' ? 'bg-indigo-600 text-white' : 'bg-orange-500 text-white'}`}>
                                            {n.createdBy === 'RW' ? 'RW' : n.createdBy}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                
                {/* Footer Tip */}
                <div className="p-4 bg-emerald-50 text-center">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Informasi Terbaru di Kawasan Bumi Adipura</p>
                </div>
            </div>
        </div>
    );
};
