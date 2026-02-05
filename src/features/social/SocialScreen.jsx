// Social Screen Component
import React, { useState, useEffect } from 'react';
import { Users, MapPin, Sparkles, ChevronRight, Loader2, ThumbsUp, MessageCircle, Send, Clock } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db, APP_ID } from '../../config';
import { callGeminiAPI } from '../../utils';

export const SocialScreen = ({ user, resident, showToast }) => {
  const [tab, setTab] = useState('events');
  const [showEventGen, setShowEventGen] = useState(false);
  const [eventTheme, setEventTheme] = useState('');
  const [eventIdea, setEventIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  // Helper: Get Month and Day from ISO String or format '15 Des'
  const getEventDateParts = (dateStr) => {
    if (!dateStr) return { day: '01', month: 'BULAN' };
    
    // Check if it's already in '15 Des' format (old seed data)
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      const parts = dateStr.split(' ');
      return { day: parts[0], month: parts[1] };
    }

    // Handle ISO String with local timezone
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: '??', month: '??' };
      
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
      const month = months[d.getMonth()];
      
      return { day, month };
    } catch (e) {
      return { day: '??', month: '??' };
    }
  };

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'events'), (s) => {
        let allEvents = s.docs.map(d => ({id:d.id, ...d.data()}));
        
        // FILTER: Warga hanya bisa melihat event RW (Global) atau RT-nya sendiri
        if (resident?.rt) {
            const myRt = `RT${resident.rt.toString().padStart(2, '0')}`;
            allEvents = allEvents.filter(ev => 
                ev.createdBy === 'RW' || ev.createdBy === myRt
            );
        }
        
        setEvents(allEvents);
    }, (err) => console.error("Events fetch error:", err));
    return () => unsub();
  }, [resident]);

  useEffect(() => {
      const unsub = onSnapshot(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'posts'), orderBy('createdAt', 'desc')), (s) => {
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
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'posts'), {
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
                        {(() => {
                            const { day, month } = getEventDateParts(ev.date);
                            return (
                                <div className="bg-emerald-50 p-3.5 rounded-2xl text-center min-w-[65px]">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">{month}</p>
                                    <p className="text-2xl font-black text-emerald-800 leading-none">{day}</p>
                                </div>
                            );
                        })()}
                        <div className="flex-1 overflow-hidden">
                            <span className="text-[9px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{ev.category}</span>
                            <h4 className="font-bold text-gray-900 mt-1.5 line-clamp-1">{ev.title}</h4>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {ev.location}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3"/> {ev.time ? ev.time : 'Waktu Menyesuaikan'}
                                </span>
                            </div>
                        </div>
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
