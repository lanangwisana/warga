// Payment Modal Component
import React, { useState } from 'react';
import { ChevronRight, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../components';

export const PaymentModal = ({ bill, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); 
    const [method, setMethod] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const methods = [
        { id: 'bca', name: 'Transfer BCA', icon: '🏦', acc: '123-456-7890 a.n Bendahara RW' },
        { id: 'qris', name: 'QRIS Scan', icon: '📱', acc: 'Scan Code' },
    ];

    const handleUpload = () => {
        setIsUploading(true);
        setTimeout(() => { setIsUploading(false); setStep(3); }, 2000);
    };

    return (
        <Modal title="Pembayaran Iuran" onClose={onClose}>
            {step === 1 && (
                <div className="animate-fade-in">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-6">
                        <p className="text-xs text-emerald-600 mb-1">Rincian Tagihan</p>
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{bill.title}</h4>
                        <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2 mb-3">
                            {bill.breakdown ? bill.breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-gray-600 border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                                    <span>{item.label}</span>
                                    <span className="font-bold">Rp {item.amount.toLocaleString()}</span>
                                </div>
                            )) : <div className="text-xs text-gray-500 italic">Tidak ada rincian.</div>}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                            <span className="font-bold text-emerald-800 text-sm">Total Bayar</span>
                            <span className="font-black text-emerald-700 text-xl">Rp {bill.amount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase">Pilih Metode</p>
                        {methods.map(m => (
                            <button key={m.id} onClick={() => { setMethod(m); setStep(2); }} className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all active:scale-[0.98] group">
                                <span className="text-2xl">{m.icon}</span>
                                <div className="text-left"><p className="font-bold text-gray-800 text-sm group-hover:text-emerald-700">{m.name}</p></div>
                                <ChevronRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-emerald-500"/>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="animate-fade-in text-center">
                    <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-dashed border-gray-300">
                        <p className="text-xs text-gray-500 mb-1">Silakan transfer ke:</p>
                        <p className="font-bold text-emerald-600 text-lg">{method.name}</p>
                        <p className="font-mono text-gray-800 text-base mt-1 select-all">{method.acc}</p>
                        <p className="text-xs text-gray-500 mt-2">Nominal: <span className="font-bold text-gray-900">Rp {bill.amount.toLocaleString()}</span></p>
                    </div>
                    <label className="block w-full cursor-pointer">
                        <div className="w-full h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                            {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-600"/> : <Upload className="w-6 h-6 text-gray-400"/>}
                            <span className="text-xs font-bold text-gray-500">{isUploading ? 'Mengunggah...' : 'Upload Bukti Transfer'}</span>
                        </div>
                        <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading}/>
                    </label>
                </div>
            )}
            {step === 3 && (
                <div className="animate-fade-in text-center py-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><CheckCircle className="w-10 h-10 text-green-600"/></div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">Pembayaran Berhasil!</h3>
                    <p className="text-sm text-gray-500 mb-6">Bukti transfer Anda telah dikirim dan sedang diverifikasi oleh admin.</p>
                    <button onClick={onSuccess} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform">Selesai</button>
                </div>
            )}
        </Modal>
    );
};
