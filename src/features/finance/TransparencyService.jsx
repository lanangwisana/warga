// Transparency Service Component
import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight, SlidersHorizontal} from "lucide-react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db, APP_ID } from "../../config";

export const TransparencyService = ({ resident }) => {
  const [scope, setScope] = useState("RW");
  const [data, setData] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

  const [filters, setFilters] = useState({
    type: [],
    category: [],
    startDate: "",
    endDate: "",
  });

  const HISTORY_PER_PAGE = 4;
  const [historyPage, setHistoryPage] = useState(1);

  /* FETCH TRANSACTIONS */
  useEffect(() => {
    if (!resident?.rt) return;
    console.log("RT RESIDENT:", resident.rt);
    const baseRef = collection(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "transactions",
    );

    let q;

    if (scope === "RW") {
      q = query(baseRef, orderBy("date", "desc"));
    } else {
      q = query(
        baseRef,
        where("rt", "==", resident.rt),
        orderBy("date", "desc"),
      );
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const trx = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      console.log("🔥 TRANSACTIONS:", trx);

      setData(trx);
    });

    return unsub;
  }, [resident, scope]);

  /* TRANSACTION SUMMARY */
  const summary = data.reduce(
    (acc, trx) => {
      if (trx.type === "Pemasukan") {
        acc.income += trx.amount;
      } else {
        acc.expense += trx.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 },
  );

  const saldo = summary.income - summary.expense;

  const categoryOptions = [...new Set(data.map((d) => d.category))];
  const filteredData = data.filter((t) => {
    if (filters.type.length && !filters.type.includes(t.type)) return false;
    if (filters.category.length && !filters.category.includes(t.category))
      return false;
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    return true;
  });

  useEffect(() => {
    setHistoryPage(1);
  }, [filters, scope]);

  const paginatedHistory = filteredData.slice(
    (historyPage - 1) * HISTORY_PER_PAGE,
    historyPage * HISTORY_PER_PAGE,
  );

  const totalPages = Math.ceil(filteredData.length / HISTORY_PER_PAGE);

  const getCategoryColor = (cat) => {
    const map = {
      IPL: "bg-indigo-100 text-indigo-600",
      Perbaikan: "bg-orange-100 text-orange-600",
      Sumbangan: "bg-emerald-100 text-emerald-600",
      Operasional: "bg-yellow-100 text-yellow-700",
      Lainnya: "bg-blue-100 text-slate-600",
    };

    return map[cat] || "bg-slate-100 text-slate-600";
  };

  /* LOADING STATE */
  if (!resident) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        Loading resident...
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1">
      {/* SWITCH RT/RW */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {["RT", "RW"].map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              scope === s
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-400"
            }`}
          >
            Kas {s}
          </button>
        ))}
      </div>

      {/* SALDO */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-[28px] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs text-emerald-100 uppercase mb-1">
            Sisa Saldo Kas {scope}
          </p>

          <h3 className="text-3xl font-black text-yellow-300">
            Rp {saldo.toLocaleString()}
          </h3>

          <div className="mt-6 flex gap-6">
            <div>
              <p className="text-[10px] flex items-center gap-1 opacity-80">
                <TrendingUp className="w-3 h-3 text-yellow-300" />
                Pemasukan
              </p>
              <p className="font-bold text-sm">
                Rp {summary.income.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-[10px] flex items-center gap-1 opacity-80">
                <TrendingDown className="w-3 h-3 text-red-300" />
                Pengeluaran
              </p>
              <p className="font-bold text-sm">
                Rp {summary.expense.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORY */}
      <div className="space-y-3 mt-2">
        {/* HEADER + PAGINATION */}
        <div className="flex items-center justify-between gap-2 px-1">
          <h4 className="text-sm font-bold text-slate-600">
            Riwayat Transaksi {scope}
          </h4>

          <div className="flex items-center gap-2">
            {data.length > HISTORY_PER_PAGE && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm h-8">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-[10px] font-bold text-slate-500 px-1 min-w-[3rem] text-center">
                  {historyPage} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    setHistoryPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={historyPage === totalPages}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowFilter(true)}
              className="h-8 flex items-center gap-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 rounded-xl hover:bg-slate-50 active:scale-95 transition"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            {showFilter && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
                <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-4 space-y-4">
                  {/* HEADER */}
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-600">
                      Filter Transaksi
                    </h4>
                    <button
                      onClick={() => setShowFilter(false)}
                      className="text-slate-400"
                    >
                      ✕
                    </button>
                  </div>

                  {/* TYPE */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      Tipe
                    </p>
                    <div className="flex gap-2">
                      {["Pemasukan", "Pengeluaran"].map((t) => (
                        <label
                          key={t}
                          className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer border ${
                            filters.type.includes(t)
                              ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                              : "bg-slate-100 border-slate-300 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={filters.type.includes(t)}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                type: e.target.checked
                                  ? [...prev.type, t]
                                  : prev.type.filter((x) => x !== t),
                              }))
                            }
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* CATEGORY */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      Kategori
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {categoryOptions.map((cat) => (
                        <label
                          key={cat}
                          className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer border ${
                            filters.category.includes(cat)
                              ? "bg-blue-100 border-blue-400 text-blue-700"
                              : "bg-slate-100 border-slate-300 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={filters.category.includes(cat)}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                category: e.target.checked
                                  ? [...prev.category, cat]
                                  : prev.category.filter((x) => x !== cat),
                              }))
                            }
                          />
                          {cat}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* DATE */}
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="border rounded-lg px-3 py-2 text-xs w-full"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, startDate: e.target.value }))
                      }
                    />
                    <input
                      type="date"
                      className="border rounded-lg px-3 py-2 text-xs w-full"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, endDate: e.target.value }))
                      }
                    />
                  </div>

                  {/* ACTION */}
                  <button
                    onClick={() => setShowFilter(false)}
                    className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* EMPTY */}
        {data.length === 0 && (
          <div className="bg-white p-6 rounded-2xl border text-center text-gray-400 text-sm">
            Belum ada transaksi.
          </div>
        )}

        {/* CARDS */}
        {paginatedHistory.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 transition-all flex justify-between items-center"
          >
            <div className="flex-1">
              {/* LABEL */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${getCategoryColor(
                    item.category,
                  )}`}
                >
                  {item.category}
                </span>

                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-200 font-bold text-slate-600">
                  RT {item.rt}
                </span>
              </div>

              {/* DESC */}
              <p className="font-bold text-slate-800 mb-1">
                {item.description}
              </p>

              {/* DATE */}
              <p className="text-xs text-slate-500">{item.date}</p>
            </div>

            {/* AMOUNT */}
            <span
              className={`text-xs font-bold px-3 py-1 rounded-lg ${
                item.type === "Pemasukan"
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-red-500 bg-red-50"
              }`}
            >
              {item.type === "Pemasukan" ? "+" : "-"}
              Rp {item.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
