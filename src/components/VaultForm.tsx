import React, { useState, useEffect, FormEvent } from "react";
import { Plus, Info, Calendar } from "lucide-react";
import { GoldTypeCode, GoldPriceMap, GoldTransaction } from "../types";

interface VaultFormProps {
  prices: GoldPriceMap;
  onAddTransaction: (transaction: Omit<GoldTransaction, "id">) => void;
}

export default function VaultForm({ prices, onAddTransaction }: VaultFormProps) {
  const [type, setType] = useState<GoldTypeCode>("doji");
  const [unit, setUnit] = useState<"chi" | "luong">("chi");
  const [quantity, setQuantity] = useState<string>("");
  const [pricePerUnit, setPricePerUnit] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState<string>("");

  // Auto-fill suggested purchase price based on selected type and unit
  useEffect(() => {
    const activePrice = prices[type];
    if (activePrice) {
      if (unit === "luong") {
        // base sell price is already in Million VND per lượng (e.g., 89.0)
        setPricePerUnit(activePrice.sell.toFixed(2));
      } else {
        // 1 chỉ = 1/10 lượng
        setPricePerUnit((activePrice.sell / 10).toFixed(2));
      }
    }
  }, [type, unit, prices]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(pricePerUnit);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      alert("Hầy, Sen vui lòng nhập số lượng vàng lớn hơn 0 nha meow!");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Hầy, Sen vui lòng nhập giá mua lớn hơn 0 nha meow!");
      return;
    }

    // Normalized values
    const normalizedQtyInChi = unit === "luong" ? qtyNum * 10 : qtyNum;
    const normalizedPricePerChi = unit === "luong" ? priceNum / 10 : priceNum;

    onAddTransaction({
      type,
      unit,
      quantity: qtyNum,
      quantityInChi: normalizedQtyInChi,
      purchasePricePerUnit: priceNum,
      purchasePricePerChi: normalizedPricePerChi,
      date,
      note: note.trim() || undefined
    });

    // Reset input fields
    setQuantity("");
    setNote("");
  };

  return (
    <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-5 shadow-sm w-full max-w-md lg:max-w-full mx-auto my-4">
      <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5 mb-3.5">
        <span className="text-base">💰</span>
        <span>Cất Thêm Vàng Vào Két Sét</span>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Quantity & Unit Row */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-7">
            <label className="block text-[11px] font-bold text-amber-900/70 uppercase tracking-wider mb-1.5">
              Số lượng mua
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="col-span-5">
            <label className="block text-[11px] font-bold text-amber-900/70 uppercase tracking-wider mb-1.5">
              Đơn vị tính
            </label>
            <div className="grid grid-cols-2 bg-white border border-amber-200 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setUnit("chi")}
                className={`py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                  unit === "chi"
                    ? "bg-amber-100 text-amber-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Chỉ
              </button>
              <button
                type="button"
                onClick={() => setUnit("luong")}
                className={`py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                  unit === "luong"
                    ? "bg-amber-100 text-amber-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Lượng
              </button>
            </div>
          </div>
        </div>

        {/* Purchase price input */}
        <div>
          <label className="block text-[11px] font-bold text-amber-900/70 uppercase tracking-wider mb-1.5 flex justify-between items-center">
            <span>Giá mua vào lúc đó (triệu VNĐ)</span>
            <span className="text-[10px] text-amber-700/60 normal-case font-normal">
              phổ biến: /{unit === "chi" ? "chỉ" : "lượng"}
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="0.0"
              required
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 text-left font-mono font-bold"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              Tr.đ/{unit}
            </span>
          </div>
        </div>

        {/* Optional fields row: Date & Note */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-amber-900/70 uppercase tracking-wider mb-1.5">
              Ngày gom vàng
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-xl pl-8 pr-3 py-2 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-amber-900/70 uppercase tracking-wider mb-1.5">
              Lời nhắn/Dịp mua
            </label>
            <input
              type="text"
              placeholder="đút két phòng thân..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-3 bg-amber-400 hover:bg-amber-500 font-bold text-amber-950 text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Xác Nhận Đút Két Vàng 💰</span>
        </button>
      </form>
    </div>
  );
}
