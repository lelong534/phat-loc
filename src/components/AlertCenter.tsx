import { useState, useEffect } from "react";
import { Bell, BellOff, Volume2, ShieldAlert, Sparkles, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, Smartphone } from "lucide-react";
import { GoldTypeCode } from "../types";

export interface GoldNotificationItem {
  id: string;
  timestamp: string;
  oldValue: number;
  newValue: number;
  percentChange: number;
  type: "up" | "down";
  title: string;
  description: string;
}

interface AlertCenterProps {
  currentValue: number;
  lastNotifiedValue: number;
  setLastNotifiedValue: (val: number) => void;
  triggerMockFluctuation: (percent: number) => void;
  onClearHistory: () => void;
  notificationHistory: GoldNotificationItem[];
  threshold: number;
  setThreshold: (val: number) => void;
  permissionStatus: string;
  onRequestPermission: () => void;
}

export default function AlertCenter({
  currentValue,
  lastNotifiedValue,
  setLastNotifiedValue,
  triggerMockFluctuation,
  onClearHistory,
  notificationHistory,
  threshold,
  setThreshold,
  permissionStatus,
  onRequestPermission
}: AlertCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm max-w-md mx-auto my-3" id="alert-center-panel">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Bell size={13} className="text-amber-500 animate-swing shrink-0" />
          <span>Hệ Thống Chuông Cảnh Báo Chênh Lệch (&gt; {threshold}%)</span>
        </h4>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          {isOpen ? "Thu gọn" : "Cấu hình & Nhật ký"}
        </button>
      </div>

      <div className="mb-2">
        <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100/40 text-[11px] text-slate-600 space-y-2">
          <div className="flex justify-between items-center font-semibold text-slate-700">
            <span>Trị giá két vàng hiện tại:</span>
            <span className="font-mono text-amber-900 font-bold">{currentValue.toFixed(2)}Trđ</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span>Mốc so sánh cảnh báo gần nhất:</span>
            <span className="font-mono">{lastNotifiedValue > 0 ? `${lastNotifiedValue.toFixed(2)}Trđ` : "Chưa lưu mốc"}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setLastNotifiedValue(currentValue);
                localStorage.setItem("cute_gold_last_notified_value", currentValue.toString());
              }}
              className="flex-1 py-1 px-2 bg-white hover:bg-amber-100/50 border border-amber-200 text-amber-800 rounded-lg text-[9px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
              title="Đặt mốc so sánh hiện tại để phát hiện chênh lệch bắt đầu từ thời điểm này"
            >
              <RefreshCw size={9} />
              Cập nhật mốc so sánh
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-3 border-t border-slate-50">
          {/* Web system permission setting */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cài đặt trình duyệt</span>
            <div className="flex justify-between items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                {permissionStatus === "granted" ? (
                  <Bell size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <BellOff size={14} className="text-slate-400 shrink-0" />
                )}
                <div>
                  <div className="text-[10px] font-bold text-slate-700">Thông báo đẩy Trình duyệt</div>
                  <div className="text-[9px] text-slate-400 leading-none">
                    {permissionStatus === "granted" 
                      ? "Đã cấp quyền thông báo hệ thống" 
                      : permissionStatus === "denied"
                        ? "Đã bị chặn (vui lòng cho phép trên thanh địa chỉ)"
                        : "Chưa kích hoạt đẩy hệ thống"}
                  </div>
                </div>
              </div>

              {permissionStatus !== "granted" && (
                <button
                  type="button"
                  onClick={onRequestPermission}
                  className="p-1 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-bold active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Smartphone size={10} />
                  <span>Cấp quyền</span>
                </button>
              )}
            </div>
          </div>

          {/* Alert trigger Threshold range selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Ngưỡng thông báo biến động</span>
              <span className="text-amber-700 text-xs font-mono lowercase">±{threshold}%</span>
            </div>
            
            <div className="flex gap-1.5">
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setThreshold(t)}
                  className={`flex-1 py-1 rounded-lg text-center font-mono font-bold text-[10px] transition-all cursor-pointer ${
                    threshold === t 
                      ? "bg-amber-500 text-white shadow-xs" 
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  {t}%
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 italic">
              * Hệ thống sẽ báo chuông chime và gửi thông báo nếu giá trị tổng tài sản tăng/giảm vượt mốc {threshold}% so với mốc lưu.
            </p>
          </div>

          {/* SIMULATION & CONTROLS SECTION */}
          <div className="space-y-1.5 bg-[#FFFDF0] p-3 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />
                Kiểm thử biến động (Simulate)
              </span>
              <span className="text-[8px] bg-amber-100 text-amber-800 px-1 rounded-md font-bold uppercase leading-none">Test</span>
            </div>
            <p className="text-[9px] text-slate-500">
              Nhấp để giả lập sự kiện giá vàng nhảy vọt hoặc sụt giảm để ngay lập tức trải nghiệm hệ thống cảnh báo:
            </p>
            <div className="flex gap-2 pt-1 font-mono">
              <button
                type="button"
                onClick={() => triggerMockFluctuation(1.5)}
                className="flex-1 py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/50 rounded-xl text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowUpRight size={12} />
                <span>Vàng Tăng +1.5%</span>
              </button>
              <button
                type="button"
                onClick={() => triggerMockFluctuation(-1.5)}
                className="flex-1 py-2 px-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/50 rounded-xl text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowDownRight size={12} />
                <span>Vàng Giảm -1.5%</span>
              </button>
            </div>
          </div>

          {/* HISTORICAL ALERTS JOURNAL log */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Nhật ký thông báo ({notificationHistory.length})</span>
              {notificationHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-[9px] text-rose-500 flex items-center gap-0.5 hover:underline cursor-pointer"
                >
                  <Trash2 size={10} />
                  Xóa lịch sử
                </button>
              )}
            </div>

            {notificationHistory.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-slate-400 bg-slate-50 rounded-2xl border border-slate-100/50">
                Chưa có thông báo biến động nào được ghi nhận.
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {notificationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white border border-slate-100 rounded-xl text-[10px] shadow-2xs flex gap-2 relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                      item.type === "up" ? "bg-emerald-500" : "bg-rose-500"
                    }`} />
                    
                    <div className="flex-1 pl-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-slate-800">{item.title}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-slate-500 leading-normal">{item.description}</p>
                      <div className="mt-1 flex gap-2 text-[8px] font-mono font-bold text-slate-400">
                        <span>Giá trị cũ: {item.oldValue.toFixed(2)}Tr</span>
                        <span>⟶</span>
                        <span className={item.type === "up" ? "text-emerald-600" : "text-rose-600"}>
                          Mới: {item.newValue.toFixed(2)}Tr ({item.percentChange > 0 ? "+" : ""}{item.percentChange.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
