// News Carousel Component
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { collection, onSnapshot, addDoc, query } from 'firebase/firestore';
import { db, APP_ID } from '../../config';
import { Modal } from '../../components';

export const NewsCarousel = () => {
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
      const q = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'news'));
      const unsub = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
              const seedNews = [
                { title: "Kerja Bakti Bersih Lingkungan", date: "Minggu, 12 Jan • 08:00 WIB", cat: "Kegiatan", color: "bg-blue-100 text-blue-700", image: "https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=400&q=80", content: "Warga diharapkan membawa alat kebersihan masing-masing. Fokus pembersihan adalah saluran air utama dan taman blok A." },
                { title: "Waspada Demam Berdarah (3M)", date: "Info Penting", cat: "Pengumuman", color: "bg-red-100 text-red-700", image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=400&q=80", content: "Mohon untuk menguras bak mandi minimal seminggu sekali dan menutup tempat penampungan air." },
              ];
              seedNews.forEach(n => addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'news'), n));
          } else {
              setNews(snapshot.docs.map(d => ({id:d.id, ...d.data()})));
          }
      }, (error) => console.error("News fetch error:", error));
      return () => unsub();
  }, []);

  return (
    <>
    <div className="mb-6 select-none">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-gray-900 text-sm">Berita & Kegiatan</h3>
        <button className="text-xs text-emerald-600 font-bold hover:underline active:text-emerald-800 transition-colors">Lihat Semua</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x touch-pan-x">
        {news.map(n => (
          <div key={n.id} onClick={() => setSelectedNews(n)} className="min-w-[280px] bg-white rounded-2xl border border-gray-100 shadow-sm snap-start overflow-hidden flex flex-col active:scale-[0.98] transition-transform duration-200 cursor-pointer">
            <div className="h-36 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
               <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
               <span className={`absolute top-3 left-3 z-20 text-[10px] font-bold px-2.5 py-1 rounded-full ${n.color} bg-white/95 shadow-sm`}>{n.cat}</span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-800 line-clamp-2 mb-2 leading-snug">{n.title}</h4>
              <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5" /> {n.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {selectedNews && (
        <Modal title={selectedNews.cat} onClose={() => setSelectedNews(null)}>
            <img src={selectedNews.image} className="w-full h-48 object-cover rounded-xl mb-4" alt="News"/>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedNews.title}</h2>
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                <Calendar className="w-4 h-4"/> {selectedNews.date}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{selectedNews.content || "Tidak ada detail tambahan."}</p>
        </Modal>
    )}
    </>
  );
};
