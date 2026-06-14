import { useState } from "react";
import { Trash2, TrendingUp, TrendingDown, Check, X } from "lucide-react";
import { GoldTransaction, GoldPriceMap } from "../types";

interface GoldVaultListProps {
  transactions: GoldTransaction[];
  prices: GoldPriceMap;
  onDeleteTransaction: (id: string) => void;
  isFirstLoad?: boolean;
}

export default function GoldVaultList({
  transactions,
  prices,
  onDeleteTransaction,
  isFirstLoad
}: GoldVaultListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl w-full max-w-md lg:max-w-full mx-auto my-3">
        <span className="text-3xl filter grayscale opacity-45">📭</span>
        <p className="text-xs text-slate-400 mt-2 font-medium">Két vàng đang trống trơn rồi sen ơi!</p>
        <p className="text-[10px] text-slate-400/80 mt-1">Hãy cất vài chỉ vàng để mèo béo canh giữ nhé meow~</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md lg:max-w-full mx-auto my-3 px-1">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Sổ Giao Dịch Chi Tiết ({transactions.length})
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">1 Lượng = 10 Chỉ</span>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => {
          const goldInfo = prices[tx.type];
          if (!goldInfo) return null;

          // Target current sell price of that gold brand
          // Sell price is in Million/lượng, divided by 10 to get price/chỉ
          const currentPricePerChi = goldInfo.sell / 10;
          const currentPricePerUnit = tx.unit === "luong" ? goldInfo.sell : currentPricePerChi;

          // Real investment status
          const totalCost = tx.quantity * tx.purchasePricePerUnit; // in Million VND
          const currentValue = tx.quantityInChi * currentPricePerChi; // in Million VND
          const profit = currentValue - totalCost;
          const profitPercent = (profit / totalCost) * 100;
          const isProfit = profit >= 0;

          return (
            <div
              key={tx.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 relative overflow-hidden"
              id={`vault-transaction-${tx.id}`}
            >
              {/* Gold card type stripe */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400" />

              <div className="flex justify-between items-start">
                <div className="pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      💍 Nhẫn trơn Kim Gia Bảo 24K
                    </span>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-mono font-bold">
                      {tx.quantity} {tx.unit === "chi" ? "chỉ" : "lượng"}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                    <span>Gom ngày: {tx.date}</span>
                    {tx.note && <span className="text-slate-300">|</span>}
                    {tx.note && <span className="text-amber-700/80 italic font-sans font-medium">"{tx.note}"</span>}
                  </p>
                </div>

                {confirmDeleteId === tx.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-1 rounded-lg">
                      Xác nhận?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteTransaction(tx.id);
                        setConfirmDeleteId(null);
                      }}
                      className="p-1.5 text-white bg-rose-500 rounded-lg hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                      title="Chắc chắn xóa"
                    >
                      <Check size={12} className="stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="p-1.5 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                      title="Hủy"
                    >
                      <X size={12} className="stroke-[3]" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(tx.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Thanh lý khỏi két"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Stats breakdown GRID */}
              <div className="pl-1 grid grid-cols-2 gap-y-2 gap-x-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <div>
                  <span className="opacity-75">Giá mua gốc:</span>
                  <span className="block font-mono font-bold text-slate-700 mt-0.5">
                    {tx.purchasePricePerUnit.toFixed(2)} Tr.đ/{tx.unit}
                  </span>
                </div>

                <div>
                  <span className="opacity-75">Giá bán hôm nay:</span>
                  <span className="block font-mono font-bold text-slate-700 mt-0.5">
                    {isFirstLoad ? "..." : `${currentPricePerUnit.toFixed(2)} Tr.đ/${tx.unit}`}
                  </span>
                </div>

                <div>
                  <span className="opacity-75">Vốn bỏ ra:</span>
                  <span className="block font-mono font-bold text-slate-700 mt-0.5">
                    {totalCost.toFixed(2)} triệu đ
                  </span>
                </div>

                <div>
                  <span className="opacity-75">Giá trị hiện tại:</span>
                  <span className="block font-mono font-bold text-slate-800 mt-0.5">
                    {isFirstLoad ? "..." : `${currentValue.toFixed(2)} triệu đ`}
                  </span>
                </div>
              </div>

              {/* Profit Indicator Bar */}
              <div className={`mt-1 py-1.5 px-2.5 rounded-xl flex items-center justify-between text-xs font-semibold ${
                isFirstLoad 
                  ? "bg-amber-50 text-amber-700 border border-amber-100/30"
                  : isProfit 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100/30" 
                    : "bg-rose-50 text-rose-700 border border-rose-100/30"
              }`}>
                <span className="flex items-center gap-1">
                  {isFirstLoad ? <span className="animate-spin text-[10px]">⚙️</span> : isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{isFirstLoad ? "Đang tính toán..." : isProfit ? "Lợi nhuận tạm tính:" : "Tạm lỗ:"}</span>
                </span>
                <span className="font-mono font-bold text-right">
                  {isFirstLoad ? "..." : (
                    <>
                      {isProfit ? "+" : ""}
                      {profit.toFixed(2)} triệu đ ({isProfit ? "+" : ""}
                      {profitPercent.toFixed(1)}%)
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
