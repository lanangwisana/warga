// Payment Modal Component
import React, { useState } from 'react';
import { ChevronRight, Upload, CheckCircle, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../../components';
import { compressImage } from '../../utils';

export const PaymentModal = ({ bill, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  const methods = [
    {
      id: "bca",
      name: "Transfer BCA",
      icon: "🏦",
      acc: "123-456-7890 a.n Bendahara RW",
    },
    { id: "qris", name: "QRIS Scan", icon: "📱", acc: "Scan Code" },
  ];

  const breakdownItems = [
    { label: "Biaya IPL RW", amount: bill.breakdown.rwFee || 0 },
    { label: "Biaya IPL RT", amount: bill.breakdown.rtFee || 0 },
    { label: 'Biaya Aplikasi', amount: bill.breakdown.appFee || 0 }
  ];

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Mohon pilih file gambar (JPG, PNG)");
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      return;
    }

    setIsUploading(true);
    try {
      // Compress and convert to Base64
      const base64 = await compressImage(file);
      setImageBase64(base64);
      setImagePreview(base64);
      setIsUploading(false);
    } catch (error) {
      console.error("Image compression error:", error);
      alert("Gagal memproses gambar");
      setIsUploading(false);
    }
  };

  const handleConfirmPayment = () => {
    if (!imageBase64) {
      alert("Mohon upload bukti transfer terlebih dahulu");
      return;
    }
    // Pass the image data back to parent for saving
    onSuccess(imageBase64);
    setStep(3);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  return (
    <Modal title="Pembayaran Iuran" onClose={onClose}>
      {step === 1 && (
        <div className="animate-fade-in">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-6">
            <p className="text-xs text-emerald-600 mb-1">Rincian Tagihan</p>
            <h4 className="font-bold text-gray-900 text-lg mb-2">
              {bill.title}
            </h4>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2 mb-3">
              {bill.breakdown ? (
                breakdownItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-xs text-gray-600 border-b border-gray-50 last:border-0 pb-1 last:pb-0"
                  >
                    <span>{item.label}</span>
                    <span className="font-bold">
                      Rp {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 italic">
                  Tidak ada rincian.
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
              <span className="font-bold text-emerald-800 text-sm">
                Total Bayar
              </span>
              <span className="font-black text-emerald-700 text-xl">
                Rp {bill.amount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase">
              Pilih Metode
            </p>
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMethod(m);
                  setStep(2);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all active:scale-[0.98] group"
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm group-hover:text-emerald-700">
                    {m.name}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="animate-fade-in">
          <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-dashed border-gray-300 text-center">
            <p className="text-xs text-gray-500 mb-1">Silakan transfer ke:</p>
            <p className="font-bold text-emerald-600 text-lg">{method.name}</p>
            <p className="font-mono text-gray-800 text-base mt-1 select-all">
              {method.acc}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Nominal:{" "}
              <span className="font-bold text-gray-900">
                Rp {bill.amount.toLocaleString()}
              </span>
            </p>
          </div>

          {/* Image Preview */}
          {imagePreview ? (
            <div className="relative mb-4">
              <img
                src={imagePreview}
                alt="Bukti Transfer"
                className="w-full h-48 object-cover rounded-2xl border-2 border-emerald-500"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-emerald-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Gambar Siap
              </div>
            </div>
          ) : (
            <label className="block w-full cursor-pointer mb-4">
              <div className="w-full h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 hover:border-emerald-400 transition-colors">
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-600">
                      Memproses gambar...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500">
                      Upload Bukti Transfer
                    </span>
                    <span className="text-[10px] text-gray-400">
                      JPG, PNG (max 10MB)
                    </span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
          )}

          <button
            onClick={handleConfirmPayment}
            disabled={!imageBase64}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
              imageBase64
                ? "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            KONFIRMASI PEMBAYARAN
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="animate-fade-in text-center py-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="font-bold text-xl text-gray-900 mb-2">
            Pembayaran Berhasil!
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Bukti transfer Anda telah dikirim dan sedang diverifikasi oleh
            admin.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
          >
            Selesai
          </button>
        </div>
      )}
    </Modal>
  );
};
