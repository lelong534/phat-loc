import { useState, useEffect } from "react";
import { GoldTransaction, GoldPriceMap, GoldPortfolioSummary, GoldTypeCode, GoldNews } from "./types";
import GoldCat from "./components/GoldCat";
import VaultForm from "./components/VaultForm";
import GoldVaultList from "./components/GoldVaultList";
import GoldPriceChart from "./components/GoldPriceChart";
import GoldChatbot from "./components/GoldChatbot";
import { Wallet, TrendingUp, TrendingDown, RefreshCcw, BookOpen, MessageSquare, Newspaper, Sparkles, Smartphone } from "lucide-react";

// Robust INITIAL fallback mock price map based on real June 2026 indexes
const DEFAULT_PRICES: GoldPriceMap = {
  sjc: {
    name: "Vàng miếng SJC",
    buy: 86.5,
    sell: 89.0,
    yesterdayChange: 0.85,
    code: "SJC",
    history: [84.2, 84.5, 85.0, 85.2, 85.8, 85.65, 86.5]
  },
  doji: {
    name: "Vàng nhẫn Doji 9999",
    buy: 77.2,
    sell: 78.6,
    yesterdayChange: 0.45,
    code: "DOJI",
    history: [75.5, 75.8, 76.0, 76.4, 76.8, 76.75, 77.2]
  },
  pnj: {
    name: "Nhẫn trơn PNJ 24K",
    buy: 76.8,
    sell: 78.2,
    yesterdayChange: -0.22,
    code: "PNJ",
    history: [75.8, 76.0, 76.2, 76.5, 77.0, 77.02, 76.8]
  }
};

const DEFAULT_NEWS: GoldNews[] = [
  {
    id: "1",
    title: "Giá vàng nhẫn trong nước tiếp tục tạo sóng, người dân xếp hàng chờ mua nhẫn trơn",
    time: "2 giờ trước",
    source: "Trực tuyến Tài Chính",
    sentiment: "positive"
  },
  {
    id: "2",
    title: "Cục Dự trữ Liên bang Mỹ (Fed) úp mở lộ trình cắt giảm lãi suất, đẩy giá vàng thế giới bay cao",
    time: "5 giờ trước",
    source: "Kinh tế Toàn Cầu",
    sentiment: "positive"
  },
  {
    id: "3",
    title: "Mèo Thần Tài khuyên: 'Tích vàng phòng thân là quốc sách, chớ có lướt sóng kẻo mất pate!'",
    time: "Vừa xong",
    source: "Mèo Vàng Tiên Tri",
    sentiment: "neutral"
  }
];

export default function App() {
  const [prices, setPrices] = useState<GoldPriceMap>(DEFAULT_PRICES);
  const [news, setNews] = useState<GoldNews[]>(DEFAULT_NEWS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"vault" | "market" | "ai">("vault");

  // Load Transactions from LocalStorage representing user's digital gold box
  const [transactions, setTransactions] = useState<GoldTransaction[]>(() => {
    const saved = localStorage.getItem("cute_gold_portfolio");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved portfolio:", e);
      }
    }
    return [];
  });

  // Calculate dynamic Portfolio stats based on today's prices
  const [portfolioSummary, setPortfolioSummary] = useState<GoldPortfolioSummary>({
    totalTransactions: 0,
    totalQuantity: 0,
    totalQuantityInLuong: 0,
    totalInvested: 0,
    currentValue: 0,
    totalProfit: 0,
    profitPercentage: 0
  });

  // Assets net change TODAY (triệu VNĐ)
  const [assetsChangeToday, setAssetsChangeToday] = useState<number>(0);

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem("cute_gold_portfolio", JSON.stringify(transactions));
  }, [transactions]);

  // Fetch true today prices from custom API route
  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/gold-prices");
      if (response.ok) {
        const data = await response.json();
        if (data.prices) setPrices(data.prices);
        if (data.news) setNews(data.news);
      }
    } catch (err) {
      console.warn("Failed to fetch fresh gold prices, using robust offline default map: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // Compute live portfolios and daily variations
  useEffect(() => {
    let totalTransactions = transactions.length;
    let totalQuantity = 0; // in chỉ
    let totalInvested = 0; // in triệu đ
    let currentValue = 0;  // in triệu đ
    let liveDailyChange = 0; // in triệu đ today's total change based on gold market swings

    transactions.forEach((tx) => {
      const activePrice = prices[tx.type];
      const normalizedPricePerChi = activePrice.sell / 10;
      const normalizedYesterdayPricePerChi = (activePrice.sell - activePrice.yesterdayChange) / 10;

      totalQuantity += tx.quantityInChi;
      totalInvested += tx.quantity * tx.purchasePricePerUnit;
      currentValue += tx.quantityInChi * normalizedPricePerChi;

      // Net performance shift today compared to yesterday
      // (current_sell_price - yesterday_sell_price) * my_qty
      const qtyInChi = tx.quantityInChi;
      const changePerChi = activePrice.yesterdayChange / 10;
      liveDailyChange += qtyInChi * changePerChi;
    });

    const totalQuantityInLuong = totalQuantity / 10;
    const totalProfit = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    setPortfolioSummary({
      totalTransactions,
      totalQuantity,
      totalQuantityInLuong,
      totalInvested,
      currentValue,
      totalProfit,
      profitPercentage
    });

    setAssetsChangeToday(liveDailyChange);
  }, [transactions, prices]);

  const handleAddTransaction = (newTx: Omit<GoldTransaction, "id">) => {
    const transaction: GoldTransaction = {
      ...newTx,
      id: Date.now().toString()
    };
    setTransactions((prev) => [transaction, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // Support manual price tuning on market charts
  const handleModifyPrice = (type: GoldTypeCode, buy: number, sell: number) => {
    setPrices((prev) => {
      const target = prev[type];
      return {
        ...prev,
        [type]: {
          ...target,
          buy,
          sell,
          // Shift history slightly to sync with the edited todays price
          history: [...target.history.slice(0, -1), sell]
        }
      };
    });
  };

  const isProfit = portfolioSummary.totalProfit >= 0;

  return (
    <div className="min-h-screen bg-[#FFFBEB] md:py-6 font-sans transition-colors">
      
      {/* Sleek full-pane centered application surface */}
      <div className="w-full max-w-2xl mx-auto bg-white min-h-screen shadow-md md:rounded-3xl md:my-6 md:border border-amber-200/40 overflow-hidden flex flex-col" id="app-container">
        
        {/* Dynamic header / Title - Sleek Interface Style */}
        <header className="bg-gradient-to-b from-[#FFFDF0] to-[#FFFBEB] p-5 pt-5 pb-4 shadow-xs border-b border-[#FDE68A] shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🐱</span>
              <div>
                <h1 className="text-base font-black tracking-tight text-[#854D0E] uppercase leading-none">Vàng Của Tôi</h1>
                <span className="text-[9px] font-bold text-[#A16207]/75">MÈO BÉO CANH GIỮ HŨ VÀNG</span>
              </div>
            </div>

            <button
              onClick={fetchPrices}
              disabled={isLoading}
              className="p-1 px-2.5 rounded-xl bg-white hover:bg-amber-50 border border-[#FDE68A] text-[#854D0E] hover:scale-105 active:scale-95 transition-all text-[9px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCcw size={9} className={isLoading ? "animate-spin" : ""} />
              <span>Cập nhật</span>
            </button>
          </div>

          {/* Portfolio Net Worth Box Widget - Sleek Interface style */}
          <div className="bg-[#FEF3C7] text-[#92400E] rounded-2.5xl p-3 px-4 shadow-sm flex items-center justify-between relative overflow-hidden border border-[#FDE68A]">
            {/* Sparkles decoration background */}
            <div className="absolute right-2 top-2 text-[#F59E0B] opacity-15 pointer-events-none">
              <Sparkles size={35} className="animate-pulse" />
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider block font-bold text-[#A16207]">
                Tổng két vàng tích lũy
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-mono tracking-tight text-[#854D0E]">
                  {portfolioSummary.currentValue.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-[#A16207]">triệu đ</span>
              </div>
              <span className="text-[9px] text-[#A16207]/80 block mt-0.5 font-semibold">
                Sở hữu: <strong className="text-[#854D0E] font-mono text-[10px] font-bold">{portfolioSummary.totalQuantity.toFixed(1)} chỉ</strong>
              </span>
            </div>

            <div className="text-right z-10 shrink-0">
              <span className="text-[8px] uppercase tracking-wider block text-[#A16207]/80 mb-0.5 font-bold">Lũy kế lời lỗ</span>
              <div className={`p-1 px-2.5 rounded-lg font-bold flex items-center gap-1 text-[10px] ${
                portfolioSummary.totalTransactions === 0
                  ? "bg-stone-200/50 text-stone-500"
                  : isProfit 
                    ? "bg-emerald-100 text-emerald-800" 
                    : "bg-rose-100 text-rose-800"
              }`}>
                {portfolioSummary.totalTransactions === 0 ? (
                  <span>0đ</span>
                ) : (
                  <>
                    <span className="font-mono font-black">
                      {isProfit ? "+" : "-"}
                      {Math.abs(portfolioSummary.totalProfit).toFixed(1)}Tr ({isProfit ? "+" : "-"}
                      {portfolioSummary.profitPercentage.toFixed(0)}%)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable View Containment Area */}
        <main className="flex-1 bg-white" id="main-scroll-body">
          
          {/* Animated Golden Cat Representative above */}
          <section className="bg-gradient-to-b from-[#FFFDF0] to-transparent pt-3 pb-2 select-none border-b border-[#FFFBEB]">
            <GoldCat 
              portfolio={portfolioSummary} 
              todayChange={assetsChangeToday} 
              onPoke={() => {}} 
            />
          </section>

          {/* Dynamic render components inside Tabs */}
          <section className="px-3 py-1">
            {activeTab === "vault" && (
              <>
                <VaultForm prices={prices} onAddTransaction={handleAddTransaction} />
                <GoldVaultList 
                  transactions={transactions} 
                  prices={prices} 
                  onDeleteTransaction={handleDeleteTransaction} 
                />
              </>
            )}

            {activeTab === "market" && (
              <>
                <GoldPriceChart prices={prices} onModifyPrice={handleModifyPrice} />
                
                {/* News sector widget */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm max-w-md mx-auto my-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-3">
                    <Newspaper size={13} className="text-amber-500 shrink-0" />
                    <span>Tin Nóng Sổ Vàng</span>
                  </h4>
                  <div className="space-y-3">
                    {news.map((item) => (
                      <div key={item.id} className="text-xs pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-medium">
                          <span>{item.source} • {item.time}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                            item.sentiment === "positive" 
                              ? "bg-emerald-50 text-emerald-600" 
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {item.sentiment === "positive" ? "Tín hiệu Tốt" : "Nhận định"}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-700 leading-normal hover:text-amber-600 cursor-pointer transition-colors">
                          {item.title}
                        </h5>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "ai" && (
              <GoldChatbot portfolio={portfolioSummary} />
            )}
          </section>
        </main>

        {/* Modern Web App Navigation Dock - Sticky Bottom */}
        <nav className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-205/60 p-3 px-6 flex justify-around items-center z-40 shadow-md mt-auto">
          
          <button
            onClick={() => setActiveTab("vault")}
            className={`flex flex-col items-center gap-1 py-1.5 px-5 rounded-2xl transition-all cursor-pointer ${
              activeTab === "vault"
                ? "bg-amber-400 text-[#854D0E] font-bold shadow-xs scale-105"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Wallet size={18} className={activeTab === "vault" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] font-bold tracking-tight">Két vàng</span>
          </button>

          <button
            onClick={() => setActiveTab("market")}
            className={`flex flex-col items-center gap-1 py-1.5 px-5 rounded-2xl transition-all cursor-pointer ${
              activeTab === "market"
                ? "bg-amber-400 text-[#854D0E] font-bold shadow-xs scale-105"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <TrendingUp size={18} className={activeTab === "market" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] font-bold tracking-tight">Thị trường</span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`flex flex-col items-center gap-1 py-1.5 px-5 rounded-2xl transition-all cursor-pointer relative ${
              activeTab === "ai"
                ? "bg-amber-400 text-[#854D0E] font-bold shadow-xs scale-105"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {/* Tiny live AI notification pulse dot */}
            {activeTab !== "ai" && (
              <span className="absolute top-1 right-7 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            )}
            <MessageSquare size={18} className={activeTab === "ai" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] font-bold tracking-tight">Hỏi Mèo Béo</span>
          </button>

        </nav>
      </div>
    </div>
  );
}
