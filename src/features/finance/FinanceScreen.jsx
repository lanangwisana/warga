// Finance Screen
import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { BillList } from "./BillList";
import { TransparencyService } from "./TransparencyService";

export const FinanceScreen = ({ resident, user, showToast }) => {
  const [tab, setTab] = useState("billing");
  const [paidBills, setPaidBills] = useState([]);
  return (
    <div className="p-6 pt-6 animate-fade-in select-none">
      <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2 tracking-tight">
        <Wallet className="text-emerald-600 fill-emerald-100" /> Keuangan &
        Iuran
      </h2>
      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
        <button
          onClick={() => setTab("billing")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab === "billing" ? "bg-white shadow-sm text-emerald-700" : "text-gray-400 hover:text-gray-600"}`}
        >
          Tagihan Saya
        </button>
        <button
          onClick={() => setTab("transparency")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 ${tab === "transparency" ? "bg-white shadow-sm text-emerald-700" : "text-gray-400 hover:text-gray-600"}`}
        >
          Transparansi Kas
        </button>
      </div>
      {tab === "billing" ? (
        <>
          <BillList resident={resident} showToast={showToast} />
        </>
      ) : (
        <TransparencyService resident={resident} />
      )}
    </div>
  );
};
