// Recent Reports Component
import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, APP_ID } from '../../config';
import { Modal } from '../../components';

export const RecentReports = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

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

  return (
    <>
    <div className="mb-6 px-1">
      <h3 className="font-bold text-gray-900 text-sm mb-3">Status Pengaduan Anda</h3>
      <div className="space-y-3">
        {reports.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada pengaduan.</p> : reports.map(r => (
          <div key={r.id} onClick={() => setSelectedReport(r)} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 active:bg-gray-50 transition-all active:scale-[0.99] cursor-pointer">
            <div className={`p-3 rounded-xl ${r.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}><FileText className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0"><h4 className="text-xs font-bold text-gray-900 truncate">{r.category}</h4><p className="text-[10px] text-gray-500 truncate mt-0.5">{r.description}</p></div>
            <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg tracking-wide ${r.status === 'OPEN' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{r.status === 'IN_PROGRESS' ? 'DIPROSES' : r.status}</span>
          </div>
        ))}
      </div>
    </div>
    {selectedReport && (
        <Modal title="Detail Laporan" onClose={() => setSelectedReport(null)}>
            <div className="space-y-4">
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Kategori</label><p className="font-bold text-gray-900">{selectedReport.category}</p></div>
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Status</label><p className="font-bold text-emerald-600">{selectedReport.status}</p></div>
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Keterangan</label><div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-700 mt-1">{selectedReport.description}</div></div>
                <div><label className="text-[10px] text-gray-400 uppercase font-bold">Tanggal</label><p className="text-xs text-gray-600">{new Date(selectedReport.createdAt).toLocaleString()}</p></div>
            </div>
        </Modal>
    )}
    </>
  );
};
