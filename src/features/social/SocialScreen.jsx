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
  const [activeThread, setActiveThread] = useState(null); // The post document object being commented on
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

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

  // Helper: Format Time Ago or Time
  const formatForumTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
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
        
        setEvents(allEvents.sort((a,b) => new Date(a.date) - new Date(b.date)));
    }, (err) => console.error("Events fetch error:", err));
    return () => unsub();
  }, [resident]);

  // Posts Listener
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'posts'), orderBy('createdAt', 'desc')), (s) => {
        setPosts(s.docs.map(d => ({id:d.id, ...d.data()})));
    }, (err) => console.error("Posts fetch error:", err));
    return () => unsub();
  }, []);

  // Comments Listener
  useEffect(() => {
    if (!activeThread) return;
    const unsub = onSnapshot(query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'posts', activeThread.id, 'comments'), orderBy('createdAt', 'asc')), (s) => {
        setComments(s.docs.map(d => ({id:d.id, ...d.data()})));
    }, (err) => console.error("Comments fetch error:", err));
    return () => unsub();
  }, [activeThread]);
  
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
      if(!newPost.trim() || isPosting) return;
      setIsPosting(true);
      try {
        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'posts'), {
            content: newPost,
            author: resident?.name || user?.email?.split('@')[0] || 'Warga',
            authorId: user?.uid,
            authorRole: resident?.role || 'WARGA',
            rt: resident?.rt || '',
            createdAt: new Date().toISOString(),
            likes: 0,
            commentCount: 0,
            avatarColor: ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500'][Math.floor(Math.random() * 4)]
        });
        setNewPost('');
        showToast("Status berhasil diposting!", "success");
      } catch (e) {
        showToast("Gagal memposting.", "error");
      }
      setIsPosting(false);
  };

  const handleCommentSubmit = async (e) => {
      e.preventDefault();
      if(!newComment.trim() || !activeThread || isPosting) return;
      setIsPosting(true);
      try {
          await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'posts', activeThread.id, 'comments'), {
              content: newComment,
              author: resident?.name || user?.email?.split('@')[0] || 'Warga',
              authorId: user?.uid,
              authorRole: resident?.role || 'WARGA',
              rt: resident?.rt || '',
              createdAt: new Date().toISOString()
          });
          setNewComment('');
          // Update comment count on post (simplified client-side for now, but usually cloud function)
          // updateDoc(doc(db, ...), { commentCount: increment(1) });
      } catch (e) {
          showToast("Gagal mengirim komentar.", "error");
      }
      setIsPosting(false);
  };

  return (
    <div className="p-5 pt-6 animate-fade-in select-none min-h-screen">
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
                {events.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-gray-400 text-sm italic">Belum ada agenda kegiatan terdekat.</p>
                    </div>
                ) : events.map(ev => (
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
                                    <Clock className="w-3 h-3"/> {ev.time ? ev.time : 'Menyesuaikan'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
       )}
       
       {tab === 'forum' && (
           <div className="space-y-4 pb-10">
               {!activeThread ? (
                   <>
                    <form onSubmit={handlePostSubmit} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 mb-6">
                        <textarea 
                            value={newPost} 
                            onChange={e=>setNewPost(e.target.value)} 
                            placeholder="Ada kabar apa hari ini, Pak/Bu?" 
                            className="w-full p-4 bg-gray-50 rounded-2xl text-sm outline-none resize-none h-28 mb-3 focus:ring-2 focus:ring-blue-500 transition-all border-none"
                        />
                        <div className="flex justify-between items-center px-1">
                            <p className="text-[10px] text-gray-400 font-medium italic">Postingan Anda akan dilihat oleh seluruh warga.</p>
                            <button 
                                type="submit" 
                                disabled={!newPost.trim() || isPosting}
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                            >
                                {isPosting ? <Loader2 className="w-3 h-3 animate-spin"/> : <><Send className="w-3 h-3"/> Posting</>}
                            </button>
                        </div>
                    </form>
                    
                    <div className="space-y-4">
                        {posts.length === 0 ? (
                            <div className="text-center py-20">
                                <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
                                <p className="text-xs text-gray-400 italic">Belum ada obrolan warga.</p>
                            </div>
                        ) : posts.map(post => (
                            <div key={post.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl ${post.avatarColor || 'bg-blue-500'} flex items-center justify-center text-white font-black text-sm shadow-inner`}>
                                            {post.author.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-black text-gray-900">{post.author}</p>
                                                {post.authorRole === 'RW' && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">RW</span>}
                                                {post.authorRole === 'RT' && <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">RT{post.rt || ''}</span>}
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-medium">{formatForumTime(post.createdAt)}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                        <ChevronRight className="w-4 h-4"/>
                                    </button>
                                </div>
                                
                                <p className="text-[13px] text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                                
                                <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-emerald-500 transition-colors">
                                        <ThumbsUp className="w-4 h-4"/> Suka
                                    </button>
                                    <button 
                                        onClick={() => setActiveThread(post)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4"/> Balas
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                   </>
               ) : (
                   // THREAD VIEW (Chat-like)
                   <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
                        {/* Header */}
                        <div className="p-5 border-b flex items-center gap-4 bg-white sticky top-0">
                            <button onClick={() => setActiveThread(null)} className="p-2 bg-gray-50 rounded-full">
                                <ChevronRight className="w-6 h-6 rotate-180 text-gray-500"/>
                            </button>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">Diskusi Warga</h3>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Membalas @{activeThread.author}</p>
                            </div>
                        </div>

                        {/* Thread Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50">
                            {/* Original Post */}
                            <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm border-l-4 border-l-blue-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-xl ${activeThread.avatarColor || 'bg-blue-500'} flex items-center justify-center text-white font-bold text-xs`}>
                                        {activeThread.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-gray-900">{activeThread.author}</p>
                                            {activeThread.authorRole === 'RW' && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">RW</span>}
                                            {activeThread.authorRole === 'RT' && <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">RT{activeThread.rt || ''}</span>}
                                        </div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{formatForumTime(activeThread.createdAt)}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{activeThread.content}</p>
                            </div>

                            {/* Divider with label */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-[1px] bg-gray-200"></div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] whitespace-nowrap">Balasan Warga</span>
                                <div className="flex-1 h-[1px] bg-gray-200"></div>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-4">
                                {comments.length === 0 ? (
                                    <div className="text-center py-10 opacity-40">
                                        <MessageCircle className="w-10 h-10 mx-auto mb-2"/>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Belum ada balasan</p>
                                    </div>
                                ) : comments.map(comment => (
                                    <div 
                                        key={comment.id} 
                                        className={`flex flex-col gap-1 max-w-[85%] ${comment.authorId === user?.uid ? 'ml-auto items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1 px-1">
                                            <span className="text-[10px] font-bold text-gray-400">{comment.author}</span>
                                            {comment.authorRole === 'RW' && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">RW</span>}
                                            {comment.authorRole === 'RT' && <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">RT{comment.rt || ''}</span>}
                                        </div>
                                        <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                            comment.authorId === user?.uid 
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}>
                                            {comment.content}
                                        </div>
                                        <span className="text-[8px] text-gray-300 font-bold px-1">{formatForumTime(comment.createdAt)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-white pb-6">
                            <form onSubmit={handleCommentSubmit} className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-blue-200 transition-all">
                                <input 
                                    value={newComment} 
                                    onChange={e=>setNewComment(e.target.value)} 
                                    placeholder="Tulis balasan Anda..." 
                                    className="flex-1 bg-transparent border-none text-sm p-2 outline-none"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newComment.trim() || isPosting}
                                    className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-blue-200 disabled:opacity-30"
                                >
                                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                                </button>
                            </form>
                        </div>
                   </div>
               )}
           </div>
       )}
    </div>
  );
};

