// Billing Widget Component
import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { collection, doc, onSnapshot, query, where, limit, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, APP_ID } from '../../config';
import { PaymentModal } from './PaymentModal';

export const BillingWidget = ({ resident, showToast }) => {
  const [activeBill, setActiveBill] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
      if(!resident) return;
      // Query billings from public data linked to this resident
      const q = query(
          collection(db, 'artifacts', APP_ID, 'public', 'data', 'billings'), 
          where('residentId', '==', resident.id),
          where('status', '==', 'UNPAID')
      );
      
      const unsub = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
              setActiveBill(null);
              // Check for history/paid bills if needed, or just leave empty
              const qPaid = query(
                  collection(db, 'artifacts', APP_ID, 'public', 'data', 'billings'), 
                  where('residentId', '==', resident.id),
                  where('status', '==', 'PAID'), 
                  limit(1)
              );
              getDocs(qPaid).then(snap => {
                  if(!snap.empty) setActiveBill({status: 'PAID'});
              });
          } else {
              const bills = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
              // Just take the first unpaid bill
              // In real app, might want to sum them up or show list
              const bill = bills[0];
              
              // Formatting for widget display if properties differ from Admin generation
              // Admin generates: period, nominal, residentName, unit, status
              // Widget expects: title, amount
              setActiveBill({
                  ...bill,
                  title: `IPL - ${bill.period}`,
                  amount: bill.nominal
              });
          }
      }, (err) => console.error("Billing fetch error:", err));
      return () => unsub();
  }, [resident]);

  const handlePaymentSuccess = async () => {
      setShowPayment(false);
      showToast("Pembayaran berhasil dikirim! Menunggu konfirmasi Admin.", "success");
      if (activeBill && activeBill.id) {
          // In real implementation, this might trigger a 'payment request' instead of directly updating to PAID
          // But for this prototype, if we want to simulate instant payment:
          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'billings', activeBill.id), { status: 'PAID', paidAt: new Date().toISOString() });
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
