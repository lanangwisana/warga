// Billing Widget Component
import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { collection, doc, onSnapshot, query, where, limit, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, APP_ID } from '../../config';
import { PaymentModal } from './PaymentModal';

export const BillingWidget = ({ user, showToast }) => {
  const [activeBill, setActiveBill] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
      if(!user) return;
      const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'bills'), where('status', '==', 'UNPAID'));
      const unsub = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
              const qPaid = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'bills'), where('status', '==', 'PAID'), limit(1));
              getDocs(qPaid).then(snap => {
                  if(!snap.empty) setActiveBill({status: 'PAID'});
                  else {
                      const initialBill = { title: "IPL - Desember 2025", amount: 90000, status: 'UNPAID', dueDate: '2025-12-10', breakdown: [{ label: "Iuran Keamanan & Kebersihan (RW)", amount: 65000 }, { label: "Kas Operasional RT 06", amount: 25000 }] };
                      setDoc(doc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'bills')), initialBill);
                  }
              });
          } else {
              const bills = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
              setActiveBill(bills[0]);
          }
      }, (err) => console.error("Billing fetch error:", err));
      return () => unsub();
  }, [user]);

  const handlePaymentSuccess = async () => {
      setShowPayment(false);
      showToast("Pembayaran berhasil dikirim!", "success");
      if (activeBill && activeBill.id) {
          await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'bills', activeBill.id), { status: 'PAID' });
      }
  };

  if (!activeBill) return null;

  if (activeBill.status === 'PAID') {
      return (
          <div className="px-1 mb-6 animate-fade-in">
              <div className="bg-emerald-50 p-5 rounded-[24px] border border-emerald-100 flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-full"><CheckCircle className="w-6 h-6 text-emerald-600"/></div>
                  <div>
                      <p className="font-bold text-emerald-800 text-sm">Tagihan Lunas</p>
                      <p className="text-xs text-emerald-600">Terima kasih sudah membayar tepat waktu.</p>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <>
    <div className="px-1 mb-6">
      <div className="bg-white p-5 rounded-[24px] border border-red-100 shadow-lg shadow-red-100/50 flex justify-between items-center relative overflow-hidden group active:scale-[0.98] transition-transform">
         <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 rounded-full blur-2xl group-active:bg-red-100 transition-colors"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tagihan Aktif (RT 06)</p></div>
            <p className="font-bold text-gray-900 text-sm">{activeBill.title}</p>
            <p className="font-black text-red-600 text-xl mt-1 tracking-tight">Rp {activeBill.amount.toLocaleString()}</p>
         </div>
         <button onClick={() => setShowPayment(true)} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-red-200 active:scale-90 transition-transform relative z-10 hover:bg-red-700">BAYAR</button>
      </div>
    </div>
    {showPayment && <PaymentModal bill={activeBill} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />}
    </>
  );
};
