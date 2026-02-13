// Payment History Component
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Modal } from "../../components";

const PAID_PER_PAGE = 3;
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

export const PaymentHistory = ({ paidBills = [], resident }) => {
  const [page, setPage] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const totalPages = Math.ceil(paidBills.length / PAID_PER_PAGE);

  const paginated = paidBills.slice(
    (page - 1) * PAID_PER_PAGE,
    page * PAID_PER_PAGE,
  );

  if (!paidBills.length) return null;

  return (
    <div className="mt-10 px-1">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-slate-600">Riwayat Pembayaran</h3>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {paginated.map((bill) => (
          <div
            key={bill.id}
            onClick={() => setSelectedDetail(bill)}
            className="cursor-pointer hover:scale-[1.01] mb-6 transition bg-white p-5 rounded-[24px] shadow-lg border border-emerald-100 flex justify-between items-center"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  LUNAS (RT {resident?.rt})
                </p>
              </div>

              <p className="font-bold text-sm text-gray-900">
                IPL-{bill.period}
              </p>

              <p className="font-black text-xl mt-1 tracking-tight text-emerald-600">
                Rp {bill.amount.toLocaleString()}
              </p>
            </div>

            <div className="p-3 rounded-full bg-emerald-50">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        ))}
      </div>

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
          </div>
        </Modal>
      )}
    </div>
  );
};
