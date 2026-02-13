import React, { useState, useEffect } from "react";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { collection, doc, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import { db, APP_ID } from "../../config";
import { PaymentModal } from "./PaymentModal";
import { Modal } from "../../components";
import { PaymentHistory } from "./PaymentHistory";

/* Helper styling map */
const COLOR = {
  red: {
    dot: "bg-red-500",
    text: "text-red-600",
    border: "border-red-100",
    badge: "bg-red-600",
    soft: "bg-red-50",
  },
  yellow: {
    dot: "bg-yellow-500",
    text: "text-yellow-500",
    border: "border-yellow-200",
    soft: "bg-yellow-50",
  },
  emerald: {
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    border: "border-emerald-100",
    soft: "bg-emerald-50",
  },
};

const STATUS_MAP = {
  PAID: {
    label: "Lunas",
    color: "text-emerald-600",
  },
  PENDING_VERIFICATION: {
    label: "Menunggu Verifikasi",
    color: "text-yellow-500",
  },
  REJECTED: {
    label: "Ditolak",
    color: "text-red-600",
  },
  UNPAID: {
    label: "Belum Bayar",
    color: "text-red-600",
  },
};

/* Reusable Card */
const Card = ({ color, title, bill, resident, icon, onClick, action }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer hover:scale-[1.01] mb-6 transition bg-white p-5 rounded-[24px] shadow-lg border ${COLOR[color].border} flex justify-between items-center`}
  >
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`w-2 h-2 rounded-full animate-pulse ${COLOR[color].dot}`}
        />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          {title} (RT {resident?.rt ?? "-"})
        </p>
      </div>
      <p className="font-bold text-sm text-gray-900">{bill.title}</p>
      <p
        className={`font-black text-xl mt-1 tracking-tight ${COLOR[color].text}`}
      >
        Rp {bill.amount.toLocaleString()}
      </p>
    </div>
    <div className="flex items-center gap-3">
      {action}
      {icon && (
        <div className={`p-3 rounded-full ${COLOR[color].soft}`}>{icon}</div>
      )}
    </div>
  </div>
);

export const BillList = ({ resident, showToast }) => {
  const ITEMS_PER_PAGE = 3;
  const [activeBills, setActiveBills] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  /* FETCH BILLINGS */
  useEffect(() => {
    if (!resident?.id) return;

    const q = query(
      collection(db, "artifacts", APP_ID, "public", "data", "billings"),
      where("residentId", "==", resident.id),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allBills = snapshot.docs.map((d) => {
        const data = d.data();
        const status = data.status?.trim().toUpperCase();

        return {
          id: d.id,
          ...data,
          status,
          title: `IPL-${data.period}`,
          amount: data.nominal,
        };
      });

      const active = allBills
        .filter((b) => b.status !== "PAID")
        .sort((a, b) => b.period.localeCompare(a.period));
      setActiveBills(active);

      const paid = allBills
        .filter((b) => b.status === "PAID")
        .sort((a, b) => b.period.localeCompare(a.period));
      setPaidBills(paid);
    });

    return unsub;
  }, [resident]);

  /* PAYMENT SUCCESS */
  const handlePaymentSuccess = async (paymentProofBase64) => {
    if (!selectedBill) return;

    await updateDoc(
      doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "billings",
        selectedBill.id,
      ),
      {
        status: "PENDING_VERIFICATION",
        paymentProof: paymentProofBase64,
        paymentMethod: "transfer",
        submittedAt: new Date().toISOString(),
      },
    );

    showToast(
      "Pembayaran berhasil dikirim! Menunggu konfirmasi Admin.",
      "success",
    );
    setSelectedBill(null);
  };

  const totalPages = Math.ceil(activeBills.length / ITEMS_PER_PAGE);
  const paginatedBills = activeBills.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <div>
      {/* CARDS */}
      {paginatedBills.map((bill) => {
        const color =
          bill.status === "REJECTED" || bill.status === "UNPAID"
            ? "red"
            : "yellow";
        const title =
          bill.status === "REJECTED"
            ? "Pembayaran Ditolak"
            : bill.status === "UNPAID"
              ? "Tagihan Aktif"
              : "Menunggu Verifikasi";

        return (
          <Card
            key={bill.id}
            color={color}
            title={title}
            bill={bill}
            resident={resident}
            icon={
              bill.status === "PENDING_VERIFICATION" ? (
                <Clock className="w-6 h-6 text-yellow-500" />
              ) : null
            }
            action={
              bill.status !== "PENDING_VERIFICATION" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBill(bill);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  {bill.status === "REJECTED" ? "BAYAR ULANG" : "BAYAR"}
                </button>
              )
            }
            onClick={() => setSelectedDetail(bill)}
          />
        );
      })}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm h-8 justify-center mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[10px] font-bold text-slate-500 px-1 min-w-[3rem] text-center">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {selectedBill && (
        <PaymentModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* DETAIL MODAL */}
      {selectedDetail && (
        <Modal title="Detail Tagihan" onClose={() => setSelectedDetail(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase text-gray-400 font-bold">
                Periode
              </label>
              <p className="font-bold">{selectedDetail.period}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-400 font-bold">
                Status
              </label>
              <p
                className={`font-bold ${STATUS_MAP[selectedDetail.status]?.color}`}
              >
                {STATUS_MAP[selectedDetail.status]?.label}
              </p>
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-400 font-bold">
                Nominal
              </label>
              <p className="font-bold">
                Rp {selectedDetail.amount.toLocaleString()}
              </p>
            </div>
            {selectedDetail.paymentMethod && (
              <div>
                <label className="text-[10px] uppercase text-gray-400 font-bold">
                  Metode Pembayaran
                </label>
                <p className="font-bold capitalize">
                  {selectedDetail.paymentMethod}
                </p>
              </div>
            )}
            {selectedDetail.submittedAt && (
              <div>
                <label className="text-[10px] uppercase text-gray-400 font-bold">
                  Tanggal Submit
                </label>
                <p className="font-bold">
                  {new Date(selectedDetail.submittedAt).toLocaleString("id-ID")}
                </p>
              </div>
            )}
            {selectedDetail.paymentProof && (
              <div>
                <label className="text-[10px] uppercase text-gray-400 font-bold">
                  Bukti Pembayaran
                </label>
                <img
                  src={selectedDetail.paymentProof}
                  alt="payment proof"
                  className="rounded-xl mt-2 border max-h-64 object-cover"
                />
              </div>
            )}
            {selectedDetail.status === "REJECTED" &&
              selectedDetail.rejectedReason && (
                <div className="bg-red-50 p-3 rounded-xl">
                  <p className="text-xs font-bold text-red-600">
                    Alasan Penolakan
                  </p>
                  <p className="text-sm">{selectedDetail.rejectedReason}</p>
                </div>
              )}
          </div>
        </Modal>
      )}

      {/* PAYMENT HISTORY */}
      {paidBills.length > 0 && (
        <div className="mt-6">
          <PaymentHistory paidBills={paidBills} resident={resident} />
        </div>
      )}
    </div>
  );
};
