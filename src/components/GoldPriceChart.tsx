import { useState } from "react";
import { GoldPriceMap, GoldTypeCode } from "../types";
import { Sparkles, Activity, Eye, Edit2, Check } from "lucide-react";

interface GoldPriceChartProps {
  prices: GoldPriceMap;
  onModifyPrice: (type: GoldTypeCode, buy: number, sell: number) => void;
}

export default function GoldPriceChart({ prices, onModifyPrice }: GoldPriceChartProps) {
  const [activeBrand, setActiveBrand] = useState<GoldTypeCode>("doji");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editBuy, setEditBuy] = useState<string>("");
  const [editSell, setEditSell] = useState<string>("");

  const activeGold = prices[activeBrand];
  const historyData = activeGold.history;

  // Manual SVG Line chart computations
  const width = 340;
  const height = 140;
  const padding = 20;

  const minVal = Math.min(...historyData) * 0.995; // Add top/bottom padding to axes
  const maxVal = Math.max(...historyData) * 1.005;

  const getX = (index: number) => {
    return padding + (index * (width - padding * 2)) / (historyData.length - 1);
  };

  const getY = (value: number) => {
    return height - padding - ((value - minVal) * (height - padding * 2)) / (maxVal - minVal);
  };

  // Build the SVG path string
  let pathD = "";
  if (historyData.length > 0) {
    pathD = `M ${getX(0)} ${getY(historyData[0])}`;
    for (let i = 1; i < historyData.length; i++) {
      pathD += ` L ${getX(i)} ${getY(historyData[i])}`;
    }
  }

  // Get days labels for X axis (last 7 days, e.g. T-6 to Hôm nay)
  const daysLabels = ["05/06", "06/06", "07/06", "08/06", "09/06", "10/06", "Hôm nay"];

  const handleStartEdit = () => {
    setEditBuy(activeGold.buy.toString());
    setEditSell(activeGold.sell.toString());
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const buyNum = parseFloat(editBuy);
    const sellNum = parseFloat(editSell);

    if (isNaN(buyNum) || buyNum <= 0 || isNaN(sellNum) || sellNum <= 0) {
      alert("Hầy, Sen vui lòng nhập số giá tiền hợp lệ lớn hơn 0 nha meow!");
      return;
    }
    if (buyNum >= sellNum) {
      alert("Meow? Giá MUA của tiệm vàng phải nhỏ hơn giá BÁN chứ, không tiệm sập sớm nha Sen béo! 🐱💸");
      return;
    }

    onModifyPrice(activeBrand, buyNum, sellNum);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm max-w-md mx-auto my-4">
      {/* Brand Tabs selector */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Activity size={13} className="text-amber-500" />
          <span>Biểu Đồ & Bảng Giá Thị Trường</span>
        </h3>
        
        {/* Toggle between DOJI, PNJ nhẫn tròn trơn */}
        <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200/40">
          {(Object.keys(prices) as GoldTypeCode[]).filter(key => key !== "sjc").map((key) => (
            <button
              key={key}
              onClick={() => {
                setActiveBrand(key);
                setIsEditing(false);
              }}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                activeBrand === key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {prices[key].code}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time customizer editor for prices */}
      <div className="bg-amber-50/25 border border-amber-100/50 rounded-2xl p-3.5 mb-4 flex flex-col gap-2.5 relative">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {activeGold.name}
            </span>
            <span className="text-[9px] text-slate-400 block mt-1 font-mono">Đơn vị: Triệu VNĐ / Lượng</span>
          </div>

          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="p-1 px-2 text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit2 size={10} />
              <span>Sửa giá</span>
            </button>
          ) : (
            <button
              onClick={handleSaveEdit}
              className="p-1 px-2.5 text-[10px] font-bold bg-amber-400 text-amber-950 rounded-lg hover:bg-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check size={11} strokeWidth={3} />
              <span>Lưu lại</span>
            </button>
          )}
        </div>

        {/* Dynamic price values Display/Editor */}
        <div className="grid grid-cols-2 gap-3 mt-1.5">
          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-100/30 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">Giá MUA vào:</span>
            {isEditing ? (
              <input
                type="number"
                step="any"
                value={editBuy}
                onChange={(e) => setEditBuy(e.target.value)}
                className="w-full text-center font-mono font-bold text-slate-800 text-sm border border-amber-300 rounded-md py-0.5 bg-amber-50 focus:outline-none"
              />
            ) : (
              <span className="font-mono font-bold text-[15px] text-slate-800">
                {activeGold.buy.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">Tr/Lượng</span>
              </span>
            )}
          </div>

          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-100/30 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">Giá BÁN ra:</span>
            {isEditing ? (
              <input
                type="number"
                step="any"
                value={editSell}
                onChange={(e) => setEditSell(e.target.value)}
                className="w-full text-center font-mono font-bold text-slate-800 text-sm border border-amber-300 rounded-md py-0.5 bg-amber-50 focus:outline-none"
              />
            ) : (
              <span className="font-mono font-bold text-[15px] text-amber-600">
                {activeGold.sell.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">Tr/Lượng</span>
              </span>
            )}
          </div>
        </div>

        {/* Change Indicator badge */}
        {!isEditing && (
          <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-150/10 pt-2 px-1">
            <span>Biến động hôm nay:</span>
            <span className={`font-semibold flex items-center gap-0.5 ${
              activeGold.yesterdayChange >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}>
              {activeGold.yesterdayChange >= 0 ? "📈 Tăng +" : "📉 Giảm -"}
              {Math.abs(activeGold.yesterdayChange).toFixed(2)} Tr/Lượng
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas Line Chart */}
      <div className="relative mt-3 rounded-2xl bg-amber-50/10 p-2 border border-slate-100/50 flex flex-col items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Grid lines behind axes */}
          <line x1={padding} y1={getY(minVal)} x2={width - padding} y2={getY(minVal)} stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={padding} y1={getY((minVal + maxVal) / 2)} x2={width - padding} y2={getY((minVal + maxVal) / 2)} stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={padding} y1={getY(maxVal)} x2={width - padding} y2={getY(maxVal)} stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3" />

          {/* Area under the price curve */}
          {historyData.length > 0 && (
            <path
              d={`${pathD} L ${getX(historyData.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`}
              fill="url(#goldGradient)"
              opacity="0.12"
            />
          )}

          {/* Golden price flow Line */}
          <path
            d={pathD}
            fill="none"
            stroke={activeBrand === "sjc" ? "#f59e0b" : activeBrand === "doji" ? "#f97316" : "#eab308"}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient filter config */}
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Tooltip-like point marks */}
          {historyData.map((val, idx) => (
            <g key={idx} className="group/dot cursor-pointer">
              <circle
                cx={getX(idx)}
                cy={getY(val)}
                r={idx === historyData.length - 1 ? 4.5 : 3.5}
                fill={activeBrand === "sjc" ? "#d97706" : activeBrand === "doji" ? "#ea580c" : "#ca8a04"}
                stroke="#ffffff"
                strokeWidth={1.5}
                className="transition-transform group-hover/dot:scale-150"
              />
              {/* Text popup value on hover */}
              <text
                x={getX(idx)}
                y={getY(val) - 8}
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="#475569"
                className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none bg-white font-mono"
              >
                {val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Ax-X Labels */}
          {daysLabels.map((lbl, idx) => (
            <text
              key={idx}
              x={getX(idx)}
              y={height - 3}
              textAnchor="middle"
              fontSize="7.5"
              fill="#94a3b8"
              fontWeight="bold"
              className="font-sans"
            >
              {lbl}
            </text>
          ))}

          {/* Ax-Y high/low labels */}
          <text x={padding - 5} y={getY(maxVal) + 3} fontSize="7" fill="#cbd5e1" fontWeight="bold" textAnchor="end" className="font-mono">
            {maxVal.toFixed(1)}
          </text>
          <text x={padding - 5} y={getY(minVal) - 2} fontSize="7" fill="#cbd5e1" fontWeight="bold" textAnchor="end" className="font-mono">
            {minVal.toFixed(1)}
          </text>
        </svg>

        <span className="text-[9px] text-slate-400 mt-2 block font-medium flex items-center gap-0.5">
          <Sparkles size={10} className="text-amber-500 animate-pulse" />
          <span>Rê chuột vào các chấm tròn để xem mốc giá lịch sử meow!</span>
        </span>
      </div>
    </div>
  );
}
