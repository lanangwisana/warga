// News Carousel Component
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db, APP_ID, DEFAULT_EVENT_IMAGE } from '../../config';
import { Modal } from '../../components';

export const NewsCarousel = ({ resident, onNavigate }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Helper formatting date
  const formatEventDisplayDate = (dateStr, time) => {
    if (!dateStr) return "Waktu belum ditentukan";
    try {
      const d = new Date(dateStr);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      const dayName = days[d.getDay()];
      const dateNum = d.getDate();
      const monthName = months[d.getMonth()];
      
      let display = `${dayName}, ${dateNum} ${monthName}`;
      if (time) display += ` • ${time}`;
      else if (time === null) display += ` • Waktu Menyesuaikan`;
      
      return display;
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    if (!db) return;
    
    const qEvents = query(collection(db, 'artifacts', APP_ID, 'public', 'data', 'events'), orderBy('date', 'asc'));
    
    const unsub = onSnapshot(qEvents, (snapshot) => {
        let allEvents = snapshot.docs.map(d => ({id:d.id, ...d.data()}));
        
        // Filter by RT (RW is global, or match resident's RT)
        if (resident?.rt) {
            const myRt = `RT${resident.rt.toString().padStart(2, '0')}`;
            allEvents = allEvents.filter(ev => 
                ev.createdBy === 'RW' || ev.createdBy === myRt
            );
        }

        // Limit to upcoming events (or just top 5)
        setItems(allEvents.slice(0, 5));
    }, (error) => console.error("Events fetch error:", error));

    return () => unsub();
  }, [resident]);

  const getCategoryTheme = (cat) => {
    const themes = {
      'Umum': 'bg-emerald-100 text-emerald-700',
      'Rapat': 'bg-blue-100 text-blue-700',
      'Keagamaan': 'bg-purple-100 text-purple-700',
      'Olahraga': 'bg-orange-100 text-orange-700',
      'Kerja Bakti': 'bg-amber-100 text-amber-700',
      'Hiburan': 'bg-pink-100 text-pink-700'
    };
    return themes[cat] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
    <div className="mb-6 select-none">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-gray-900 text-sm">Kegiatan Mendatang</h3>
        <button onClick={() => onNavigate && onNavigate('social')} className="text-xs text-emerald-600 font-bold hover:underline active:text-emerald-800 transition-colors">Lihat Semua</button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x touch-pan-x">
        {items.length > 0 ? items.map(ev => (
          <div key={ev.id} onClick={() => setSelectedItem(ev)} className="min-w-[280px] bg-white rounded-2xl border border-gray-100 shadow-sm snap-start overflow-hidden flex flex-col active:scale-[0.98] transition-transform duration-200 cursor-pointer">
            <div className="h-36 relative overflow-hidden bg-gray-100">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
               {ev.image ? (
                 <img 
                    src={ev.image.includes('defualt-image-events.png') ? DEFAULT_EVENT_IMAGE : ev.image} 
                    alt={ev.title} 
                    className="w-full h-full object-cover" 
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                   <Calendar className="w-12 h-12" />
                 </div>
               )}
               <span className={`absolute top-3 left-3 z-20 text-[10px] font-bold px-2.5 py-1 rounded-full ${getCategoryTheme(ev.category)} shadow-sm`}>
                 {ev.category}
               </span>
               <div className="absolute bottom-3 left-3 z-20 text-white">
                  <p className="text-[10px] font-medium opacity-90 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {ev.location}
                  </p>
               </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-800 line-clamp-1 mb-2 leading-snug">{ev.title}</h4>
              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> 
                {formatEventDisplayDate(ev.date, ev.time)}
              </div>
            </div>
          </div>
        )) : (
          <div className="w-full py-10 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
             <Calendar className="w-8 h-8 mb-2 opacity-20" />
             <p className="text-xs font-medium">Belum ada kegiatan mendatang</p>
          </div>
        )}
      </div>
    </div>

    {selectedItem && (
        <Modal title={selectedItem.category} onClose={() => setSelectedItem(null)}>
            {selectedItem.image ? (
              <img 
                src={selectedItem.image.includes('defualt-image-events.png') ? DEFAULT_EVENT_IMAGE : selectedItem.image} 
                className="w-full h-48 object-cover rounded-xl mb-4" 
                alt="Event"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-300">
                <Calendar className="w-16 h-16" />
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedItem.title}</h2>
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="w-4 h-4 text-emerald-500"/> {formatEventDisplayDate(selectedItem.date, selectedItem.time)}
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <MapPin className="w-4 h-4 text-emerald-500"/> {selectedItem.location}
                </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kreator</p>
              <p className="text-xs text-gray-700 font-medium">{selectedItem.createdByName || 'Pengelola Lingkungan'}</p>
            </div>
        </Modal>
    )}
    </>
  );
};
