import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { collection, doc, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import { db, APP_ID } from "../../config";
import { PaymentModal } from "./PaymentModal";
import { Modal } from '../../components';

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
const Card = ({
  color,
  title,
  bill,
  resident,
  icon,
  onClick,
  extraCount,
  action,
}) => (
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

      {extraCount > 0 && (
        <p className="text-xs text-red-500 font-bold mt-1">
          +{extraCount} tagihan lainnya
        </p>
      )}

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

export const BillingWidget = ({ resident, showToast, setPaidBills }) => {
  const [activeBills, setActiveBills] = useState([]);
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

  if (!activeBills.length) return null;
  const getDashboardBill = (bills) => {
    if (!bills.length) return null;
    const priorityOrder = ["REJECTED", "UNPAID", "PENDING_VERIFICATION"];

    for (let status of priorityOrder) {
      const found = bills
        .filter((b) => b.status === status)
        .sort((a, b) => a.period.localeCompare(b.period));

      if (found.length) return found[0];
    }

    return null;
  };

  const dashboardBill = getDashboardBill(activeBills);
  const extraCount = activeBills.length - 1;

  return (
    <>
      {/* CARD */}
      {dashboardBill && (
        <div className="px-1 mb-6 animate-fade-in">
          {dashboardBill.status === "REJECTED" && (
            <Card
              color="red"
              title="Pembayaran Ditolak"
              bill={dashboardBill}
              extraCount={extraCount}
              resident={resident}
              onClick={() => setSelectedDetail(dashboardBill)}
              action={
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBill(dashboardBill);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  BAYAR ULANG
                </button>
              }
            />
          )}

          {dashboardBill.status === "PENDING_VERIFICATION" && (
            <Card
              color="yellow"
              title="Menunggu Verifikasi"
              bill={dashboardBill}
              extraCount={extraCount}
              resident={resident}
              icon={<Clock className="w-6 h-6 text-yellow-500" />}
              onClick={() => {
                setSelectedDetail(dashboardBill);
              }}
            />
          )}

          {dashboardBill.status === "UNPAID" && (
            <Card
              color="red"
              title="Tagihan Aktif"
              bill={dashboardBill}
              extraCount={extraCount}
              resident={resident}
              onClick={() => {
                setSelectedDetail(dashboardBill);
              }}
              action={
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBill(dashboardBill);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  BAYAR
                </button>
              }
            />
          )}
        </div>
      )}

      {/* MODAL POP UP */}
      {selectedBill && (
        <PaymentModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
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
                className={`font-bold ${
                  STATUS_MAP[selectedDetail.status]?.color
                }`}
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

            {/* REJECT ONLY */}
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
    </>
  );
};
