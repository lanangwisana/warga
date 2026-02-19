// Report Screen Component with Image Upload & Dynamic Permit Form
import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  ChevronRight,
  X,
  Loader2,
  FileCheck,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Car,
  Users,
  Hammer,
  PartyPopper,
  Home,
  Clock,
  Calendar,
  MapPin,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { db, APP_ID } from "../../config";
import { compressImage } from "../../utils";
import { RecentReports } from "../dashboard";

export const ReportScreen = ({ user, profile, showToast }) => {
  const [tab, setTab] = useState("report");
  const [showForm, setShowForm] = useState(false);

  // --- REPORT STATES ---
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState([]); // Array of { preview, base64 }
  const [isCompressing, setIsCompressing] = useState(false);

  // --- PERMIT STATES ---
  const [permitType, setPermitType] = useState("Izin Tamu");
  const [permitDate, setPermitDate] = useState("");
  const [permitDesc, setPermitDesc] = useState("");

  // Dynamic Fields State
  const [formData, setFormData] = useState({});

  // Common States
  const [permits, setPermits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_IMAGES = 5;

  // Load Permits History
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "artifacts", APP_ID, "public", "data", "permits"),
      (s) => {
        const myPermits = s.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.userId === user.uid)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPermits(myPermits);
      },
      (err) => console.error("Permits fetch error:", err),
    );
    return () => unsub();
  }, [user]);

  // Handle Image Selection (Multiple)
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= MAX_IMAGES) {
      showToast(`Maksimal ${MAX_IMAGES} gambar`, "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Mohon pilih file gambar (JPG, PNG)", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Ukuran file maksimal 10MB", "error");
      return;
    }

    setIsCompressing(true);
    try {
      const base64 = await compressImage(file);
      setImages((prev) => [...prev, { preview: base64, base64 }]);
    } catch (error) {
      showToast("Gagal memproses gambar", "error");
    }
    setIsCompressing(false);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SUBMIT LOGIC FOR REPORTS ---
  const handleReportSubmit = async () => {
    if (!desc) {
      showToast("Mohon isi deskripsi laporan", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const reportRef = doc(
        collection(db, "artifacts", APP_ID, "public", "data", "reports"),
      );
      const reportId = reportRef.id;

      if (images.length > 0) {
        const imageData = images.map((img) => img.base64);
        await setDoc(
          doc(
            db,
            "artifacts",
            APP_ID,
            "users",
            user.uid,
            "report_images",
            reportId,
          ),
          {
            images: imageData,
            imageCount: images.length,
            createdAt: new Date().toISOString(),
          },
        );
      }

      await setDoc(reportRef, {
        category: "Umum",
        description: desc,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        userId: user.uid,
        userName: profile?.name || "Warga",
        userUnit: profile?.unit || "-",
        userCluster: profile?.cluster || "-",
        hasImage: images.length > 0,
        imageCount: images.length,
      });

      setDesc("");
      setImages([]);
      setShowForm(false);
      showToast("Laporan berhasil dikirim!", "success");
    } catch (e) {
      console.error(e);
      showToast("Gagal mengirim laporan", "error");
    }
    setIsSubmitting(false);
  };



  // --- DYNAMIC PERMIT FORM LOGIC ---
  const PERMIT_TYPES = [
    {
      id: "Izin Tamu",
      label: "Izin Tamu Menginap",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      id: "Izin Parkir",
      label: "Izin Parkir Tambahan",
      icon: Car,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      id: "Izin Renovasi",
      label: "Izin Renovasi Rumah",
      icon: Hammer,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      id: "Izin Acara",
      label: "Izin Acara / Keramaian",
      icon: PartyPopper,
      color: "text-pink-600",
      bg: "bg-pink-100",
    },
    {
      id: "Penggunaan Fasum",
      label: "Penggunaan Fasilitas Umum",
      icon: Home,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  const handlePermitSubmit = async (e) => {
    e.preventDefault();

    if (!permitDate) {
      showToast("Mohon pilih tanggal", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Construct Description based on Dynamic Fields
      let finalDesc = permitDesc;
      if (permitType === "Izin Tamu") {
        finalDesc = `Tamu: ${formData.guestName || "-"} (${formData.guestCount || 1} orang). Lama: ${formData.stayDuration || 1} hari. Ket: ${permitDesc}`;
      } else if (permitType === "Izin Parkir") {
        finalDesc = `Kendaraan: ${formData.vehicleType || "-"} (${formData.plateNumber || "-"}). Lokasi: ${formData.parkingLocation || "-"}. Ket: ${permitDesc}`;
      } else if (permitType === "Izin Renovasi") {
        finalDesc = `Renovasi: ${formData.workType || "Umum"}. Kontraktor: ${formData.contractorName || "-"}. Estimasi: ${formData.workDuration || 1} hari. Ket: ${permitDesc}`;
      } else if (permitType === "Izin Acara") {
        finalDesc = `Acara: ${formData.activityName || "-"}. Undangan: ${formData.guestCount || 0} org. Tutup Jalan: ${formData.useRoad ? "YA" : "TIDAK"}. Tenda: ${formData.useTend ? "YA" : "TIDAK"}. Ket: ${permitDesc}`;
      } else if (permitType === "Penggunaan Fasum") {
        finalDesc = `Fasilitas: ${formData.facilityName || "-"}. Waktu: ${formData.usageTime || "-"}. Ket: ${permitDesc}`;
      }

      await addDoc(
        collection(db, "artifacts", APP_ID, "public", "data", "permits"),
        {
          type: permitType,
          date: permitDate,
          description: finalDesc,
          // Save raw data too for future editing/viewing
          rawFormData: formData,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          userId: user.uid,
          userName: profile?.name || "Warga",
          userUnit: profile?.unit || "-",
          userCluster: profile?.cluster || "-",
        },
      );

      setPermitDesc("");
      setPermitDate("");
      setFormData({});
      setShowForm(false);
      showToast("Pengajuan izin berhasil dikirim!", "success");
    } catch (error) {
      console.error(error);
      showToast("Gagal mengirim pengajuan", "error");
    }
    setIsSubmitting(false);
  };

  const renderDynamicFields = () => {
    switch (permitType) {
      case "Izin Tamu":
        return (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Nama Tamu Utama
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                placeholder="Nama Lengkap"
                onChange={(e) =>
                  setFormData({ ...formData, guestName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Jml Orang
              </label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                placeholder="1"
                onChange={(e) =>
                  setFormData({ ...formData, guestCount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Lama (Hari)
              </label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                placeholder="1"
                onChange={(e) =>
                  setFormData({ ...formData, stayDuration: e.target.value })
                }
              />
            </div>
          </div>
        );
      case "Izin Parkir":
        return (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Jenis Kendaraan
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                onChange={(e) =>
                  setFormData({ ...formData, vehicleType: e.target.value })
                }
              >
                <option>Mobil</option>
                <option>Motor</option>
                <option>Truk/Box</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Plat Nomor
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm uppercase"
                placeholder="B 1234 XYZ"
                onChange={(e) =>
                  setFormData({ ...formData, plateNumber: e.target.value })
                }
              />
            </div>
          </div>
        );
      case "Izin Renovasi":
        return (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Jenis Pekerjaan
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                placeholder="Misal: Perbaikan Atap, Cat Ulang"
                onChange={(e) =>
                  setFormData({ ...formData, workType: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Kontraktor (Opsional)
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                placeholder="Nama"
                onChange={(e) =>
                  setFormData({ ...formData, contractorName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Estimasi (Hari)
              </label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                placeholder="7"
                onChange={(e) =>
                  setFormData({ ...formData, workDuration: e.target.value })
                }
              />
            </div>
          </div>
        );
      case "Izin Acara":
        return (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Nama Acara
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                placeholder="Misal: Syukuran, Ulang Tahun"
                onChange={(e) =>
                  setFormData({ ...formData, activityName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Jml Undangan
                </label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                  placeholder="50"
                  onChange={(e) =>
                    setFormData({ ...formData, guestCount: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                    onChange={(e) =>
                      setFormData({ ...formData, useRoad: e.target.checked })
                    }
                  />
                  Tutup Jalan?
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                    onChange={(e) =>
                      setFormData({ ...formData, useTend: e.target.checked })
                    }
                  />
                  Pakai Tenda?
                </label>
              </div>
            </div>
          </div>
        );
      case "Penggunaan Fasum":
        return (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Fasilitas
              </label>
              <select
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                onChange={(e) =>
                  setFormData({ ...formData, facilityName: e.target.value })
                }
              >
                <option>Balai Warga</option>
                <option>Lapangan Badminton</option>
                <option>Pos Kamling</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Waktu Penggunaan
              </label>
              <input
                type="text"
                className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                placeholder="Misal: 08:00 - 12:00"
                onChange={(e) =>
                  setFormData({ ...formData, usageTime: e.target.value })
                }
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-5 pt-6 animate-fade-in select-none">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 tracking-tight">
        <FileText className="text-emerald-600" /> Pusat Laporan
      </h2>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
        <button
          onClick={() => setTab("report")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab === "report" ? "bg-white shadow-sm text-emerald-700" : "text-gray-400"}`}
        >
          Pengaduan
        </button>
        <button
          onClick={() => setTab("permit")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab === "permit" ? "bg-white shadow-sm text-emerald-700" : "text-gray-400"}`}
        >
          Surat & Izin
        </button>
      </div>

      {!showForm && (
        <button
          onClick={() => {
            setShowForm(true);
            setFormData({});
          }}
          className="w-full bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between group active:scale-[0.98] transition-all mb-6"
        >
          <span className="flex items-center gap-2 font-bold text-sm">
            <Plus className="w-5 h-5" />
            {tab === "report" ? "Buat Pengaduan Baru" : "Ajukan Surat Izin"}
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">
                {tab === "report" ? "Formulir Pengaduan" : "Formulir Perizinan"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  removeImage();
                }}
                className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {tab === "report" ? (
              <div className="space-y-4">
                <textarea
                  className="w-full p-4 bg-gray-50 rounded-2xl text-base border-0 focus:ring-2 focus:ring-emerald-500 h-32 resize-none outline-none placeholder-gray-400 text-gray-800"
                  placeholder="Jelaskan masalah..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />

                {/* Image Upload (Report Only) */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Foto Pendukung (Maks {MAX_IMAGES})
                    </label>
                    {images.length > 0 && (
                      <span className="text-xs text-emerald-600 font-bold">
                        {images.length}/{MAX_IMAGES}
                      </span>
                    )}
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {images.map((img, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={img.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-xl border-2 border-emerald-500"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length < MAX_IMAGES && (
                    <label className="block w-full cursor-pointer">
                      <div className="w-full h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 hover:border-emerald-400 transition-colors">
                        {isCompressing ? (
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                        ) : (
                          <Upload className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500">
                          {isCompressing
                            ? "Memproses..."
                            : images.length === 0
                              ? "Tap untuk upload foto"
                              : "Tambah foto lagi"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={isCompressing}
                      />
                    </label>
                  )}
                </div>


                <button
                  onClick={handleReportSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "KIRIM LAPORAN"
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePermitSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">
                    Jenis Izin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMIT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = permitType === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => {
                            setPermitType(type.id);
                            setFormData({});
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 text-center ${isSelected ? `border-emerald-500 bg-emerald-50` : "border-gray-100 bg-gray-50 hover:bg-gray-100"}`}
                        >
                          <div
                            className={`p-1.5 rounded-full ${type.bg} ${type.color}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[10px] font-bold ${isSelected ? "text-emerald-700" : "text-gray-500"}`}
                          >
                            {type.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Fields based on Type */}
                {renderDynamicFields()}

                {/* Common Fields */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={permitDate}
                    onChange={(e) => setPermitDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Keterangan Tambahan
                  </label>
                  <textarea
                    value={permitDesc}
                    onChange={(e) => setPermitDesc(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-emerald-500 h-24 resize-none outline-none placeholder-gray-400"
                    placeholder="Jelaskan kebutuhan izin Anda secara detail..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-all flex justify-center mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "KIRIM PENGAJUAN"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {tab === "report" ? (
        <RecentReports user={user} />
      ) : (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 text-sm px-1 mb-2">
            Riwayat Pengajuan
          </h3>
          {permits.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
              Belum ada data.
            </div>
          ) : (
            permits.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"
              >
                <div
                  className={`p-3 rounded-xl flex-shrink-0 ${
                    p.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-600"
                      : p.status === "REJECTED"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-gray-900 uppercase truncate pr-2">
                      {p.type}
                    </h4>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {p.date}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {p.description?.split(/(?<=\.\s)|(?<=\.$)/).map((segment, i) => {
                      const colonIndex = segment.indexOf(':');
                      if (colonIndex > 0 && colonIndex < 20) {
                        const label = segment.substring(0, colonIndex);
                        const rest = segment.substring(colonIndex);
                        return <span key={i}><strong className="font-semibold text-gray-700">{label}</strong>{rest}</span>;
                      }
                      return <span key={i}>{segment}</span>;
                    })}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                  {(() => {
                        const getDetailedStatus = (type, status) => {
                           if (status === 'APPROVED') return { text: 'DISETUJUI', color: 'bg-emerald-50 text-emerald-600' };
                           if (status === 'REJECTED') return { text: 'DITOLAK', color: 'bg-red-50 text-red-600' };
                           if (status === 'WAITING_RW_APPROVAL') return { text: 'MENUNGGU VALIDASI RW', color: 'bg-purple-50 text-purple-600' };
                           
                           // Logic for PENDING status
                           if (status === 'PENDING') {
                               // RW Only types
                               if (['Penggunaan Fasum'].includes(type)) {
                                   return { text: 'MENUNGGU ACC RW', color: 'bg-orange-50 text-orange-600' };
                               }
                               // RT Only & Hybrid types (First step is always RT)
                               return { text: 'MENUNGGU ACC RT', color: 'bg-orange-50 text-orange-600' };
                           }
                           
                           return { text: status, color: 'bg-gray-50 text-gray-600' };
                        };

                        const statusInfo = getDetailedStatus(p.type, p.status);

                        return (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${statusInfo.color}`}>
                                {statusInfo.text}
                            </span>
                        );
                    })()}
                    {p.rejectReason && (
                      <span className="text-[9px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        Info: {p.rejectReason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
