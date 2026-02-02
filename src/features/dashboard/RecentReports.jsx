// Recent Reports Component
import React, { useState, useEffect } from 'react';
import { FileText, X, ChevronLeft, ChevronRight, Eye, Image as ImageIcon } from 'lucide-react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, APP_ID } from '../../config';
import { Modal } from '../../components';

// Helper function to get status display info
const getStatusInfo = (status) => {
  switch (status) {
    case 'OPEN':
      return { label: 'Menunggu', bg: 'bg-orange-50', text: 'text-orange-700', iconBg: 'bg-orange-100', iconText: 'text-orange-600' };
    case 'IN_PROGRESS':
      return { label: 'Diproses', bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', iconText: 'text-blue-600' };
    case 'DONE':
      return { label: 'Selesai', bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', iconText: 'text-green-600' };
    case 'REJECTED':
      return { label: 'Ditolak', bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100', iconText: 'text-red-600' };
    default:
      return { label: status || 'Unknown', bg: 'bg-gray-50', text: 'text-gray-700', iconBg: 'bg-gray-100', iconText: 'text-gray-600' };
  }
};

// Image Gallery Modal
const ImageGalleryModal = ({ images, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!images || images.length === 0) return null;
  
  return (
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white">
        <X className="w-6 h-6" />
      </button>
      
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/20 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
      
      <img 
        src={images[currentIndex]} 
        alt={`Bukti ${currentIndex + 1}`} 
        className="max-w-full max-h-[80vh] object-contain rounded-xl"
        onClick={e => e.stopPropagation()}
      />
      
      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1); }}
            className="absolute left-4 p-2 bg-white/20 rounded-full text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0); }}
            className="absolute right-4 p-2 bg-white/20 rounded-full text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
};

export const RecentReports = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionImages, setResolutionImages] = useState([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'reports'), (s) => {
      const userReports = s.docs
        .map(d => ({id:d.id, ...d.data()}))
        .filter(r => r.userId === user.uid)
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      setReports(userReports);
    }, (error) => console.error("Reports fetch error:", error));
    return () => unsub();
  }, [user]);

  // Fetch resolution images when report with resolution is selected
  useEffect(() => {
    if (!selectedReport || !selectedReport.hasResolutionImages) {
      setResolutionImages([]);
      return;
    }

    const fetchResolutionImages = async () => {
      setLoadingImages(true);
      try {
        const imgDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'resolution_images', selectedReport.id));
        if (imgDoc.exists()) {
          setResolutionImages(imgDoc.data().images || []);
        }
      } catch (error) {
        console.error("Error fetching resolution images:", error);
      }
      setLoadingImages(false);
    };

    fetchResolutionImages();
  }, [selectedReport]);

  return (
    <>
    <div className="mb-6 px-1">
      <h3 className="font-bold text-gray-900 text-sm mb-3">Status Pengaduan Anda</h3>
      <div className="space-y-3">
        {reports.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada pengaduan.</p> : reports.map(r => {
          const statusInfo = getStatusInfo(r.status);
          return (
          <div key={r.id} onClick={() => setSelectedReport(r)} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 active:bg-gray-50 transition-all active:scale-[0.99] cursor-pointer">
            <div className={`p-3 rounded-xl ${statusInfo.iconBg} ${statusInfo.iconText}`}><FileText className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0"><h4 className="text-xs font-bold text-gray-900 truncate">{r.category}</h4><p className="text-[10px] text-gray-500 truncate mt-0.5">{r.description}</p></div>
            <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg tracking-wide ${statusInfo.bg} ${statusInfo.text}`}>{statusInfo.label}</span>
          </div>
          );
        })}
      </div>
    </div>
    {selectedReport && (() => {
        const statusInfo = getStatusInfo(selectedReport.status);
        return (
        <Modal title="Detail Laporan" onClose={() => { setSelectedReport(null); setResolutionImages([]); }}>
            <div className="space-y-4">
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Kategori</label><p className="font-bold text-gray-900">{selectedReport.category}</p></div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold">Status</label>
                  <p className={`font-bold ${statusInfo.text}`}>{statusInfo.label}</p>
                </div>
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Keterangan Anda</label><div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-700 mt-1">{selectedReport.description}</div></div>
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Tanggal Lapor</label><p className="text-xs text-gray-600">{new Date(selectedReport.createdAt).toLocaleString()}</p></div>
                
                {/* Resolution Info - Only show if report is DONE */}
                {selectedReport.status === 'DONE' && selectedReport.resolutionNote && (
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-bold text-green-700">PENYELESAIAN</span>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-xl">
                      <div className="mb-2">
                        <label className="text-[10px] text-green-600 uppercase font-bold">Keterangan dari RT/RW</label>
                        <p className="text-sm text-gray-800 mt-1">{selectedReport.resolutionNote}</p>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-green-600 mt-2 pt-2 border-t border-green-100">
                        <span>Diselesaikan oleh: <strong>{selectedReport.resolvedBy}</strong></span>
                        <span>{selectedReport.resolvedAt ? new Date(selectedReport.resolvedAt).toLocaleString() : '-'}</span>
                      </div>
                    </div>
                    
                    {/* Resolution Images Button */}
                    {selectedReport.hasResolutionImages && (
                      <button 
                        onClick={() => setShowImageGallery(true)}
                        disabled={loadingImages || resolutionImages.length === 0}
                        className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors w-full justify-center"
                      >
                        {loadingImages ? (
                          <span>Memuat...</span>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Lihat Bukti Foto ({selectedReport.resolutionImageCount || resolutionImages.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
            </div>
        </Modal>
        );
    })()}
    
    {/* Image Gallery Modal */}
    {showImageGallery && resolutionImages.length > 0 && (
      <ImageGalleryModal images={resolutionImages} onClose={() => setShowImageGallery(false)} />
    )}
    </>
  );
};

