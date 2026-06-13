import { useState, useEffect } from "react";
import { GoldTransaction, GoldPriceMap, GoldPortfolioSummary, GoldTypeCode, GoldNews, getApiUrl } from "./types";
import { fetchLiveGoldData } from "./lib/goldScraper";
import GoldCat from "./components/GoldCat";
import VaultForm from "./components/VaultForm";
import GoldVaultList from "./components/GoldVaultList";
import GoldPriceChart from "./components/GoldPriceChart";
import GoldChatbot from "./components/GoldChatbot";
import { GoldNotificationItem } from "./components/AlertCenter";
import { Wallet, TrendingUp, TrendingDown, RefreshCcw, BookOpen, MessageSquare, Newspaper, Sparkles, Smartphone, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InAppToast {
  id: string;
  title: string;
  description: string;
  type: "up" | "down";
}

function playCoinSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    // Upward minor-major golden chime
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
    
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.warn("Web Audio chime blocked or unsupported:", e);
  }
}

// Robust INITIAL fallback mock price map based on real June 2026 indexes
const DEFAULT_PRICES: GoldPriceMap = {
  sjc: {
    name: "SJC Toàn Quốc",
    buy: 83.0,
    sell: 85.0,
    yesterdayChange: 0.15,
    code: "SJC-VNE",
    history: [82.1, 82.3, 82.8, 83.0, 83.1, 82.9, 83.0]
  },
  doji: {
    name: "Nhẫn tròn Kim Gia Bảo 24K",
    buy: 75.5,
    sell: 76.7,
    yesterdayChange: 0.25,
    code: "KGB-VNE",
    history: [74.5, 74.8, 75.1, 75.3, 75.5, 75.3, 75.5]
  },
  pnj: {
    name: "Nhẫn trơn 24K PNJ",
    buy: 75.2,
    sell: 76.4,
    yesterdayChange: 0.2,
    code: "PNJ-VNE",
    history: [74.2, 74.5, 74.8, 75.0, 75.2, 75.0, 75.2]
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
  const [crawledProducts, setCrawledProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTestCrawling, setIsTestCrawling] = useState<boolean>(false);
  const [showManager, setShowManager] = useState<boolean>(false);
  const [selectedNews, setSelectedNews] = useState<GoldNews | null>(null);
  const [newsParagraphs, setNewsParagraphs] = useState<string[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);

  // Auto-fetch full article text upon popup selection
  useEffect(() => {
    if (!selectedNews) {
      setNewsParagraphs([]);
      return;
    }

    if (selectedNews.link) {
      setIsNewsLoading(true);
      setNewsParagraphs([]); // Clear previous text
      fetch(`/api/article-content?url=${encodeURIComponent(selectedNews.link)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Chưa thể lấy nội dung chi tiết bài viết");
          return res.json();
        })
        .then((data) => {
          if (data && Array.isArray(data.paragraphs) && data.paragraphs.length > 0) {
            setNewsParagraphs(data.paragraphs);
          } else {
            setNewsParagraphs([selectedNews.description || "Không tìm thấy nội dung bài viết."]);
          }
        })
        .catch((err) => {
          console.error("Lỗi tải bài viết:", err);
          setNewsParagraphs([
            selectedNews.description || "Không tìm thấy nội dung bài viết.",
            "⚠️ Mèo Béo không thể kết nối tới máy chủ VnExpress hoặc bài đã bị ẩn, bạn vui lòng xem trực tiếp bằng nút liên kết nguồn bên dưới nhé meow!"
          ]);
        })
        .finally(() => {
          setIsNewsLoading(false);
        });
    } else {
      setNewsParagraphs([selectedNews.description || "Không có chi tiết bài viết."]);
    }
  }, [selectedNews]);

  // Load Transactions from LocalStorage representing user's digital gold box
  const [transactions, setTransactions] = useState<GoldTransaction[]>(() => {
    const saved = localStorage.getItem("cute_gold_portfolio");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Only track Nhẫn trơn Kim Gia Bảo 24K (doji)
          return parsed.filter((tx) => tx.type === "doji" || tx.type === "pnj" || tx.type === "sjc").map(tx => ({...tx, type: "doji"}));
        }
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

  // Notification alert system state hooks
  const [lastNotifiedValue, setLastNotifiedValue] = useState<number>(() => {
    const saved = localStorage.getItem("cute_gold_last_notified_value");
    return saved ? parseFloat(saved) : 0;
  });
  
  const [threshold, setThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("cute_gold_alert_threshold");
    return saved ? parseFloat(saved) : 1.0; // 1% threshold as default
  });

  const [notificationHistory, setNotificationHistory] = useState<GoldNotificationItem[]>(() => {
    const saved = localStorage.getItem("cute_gold_notification_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Error reading alert history log:", e);
      }
    }
    return [];
  });

  const [permissionStatus, setPermissionStatus] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const [toasts, setToasts] = useState<InAppToast[]>([]);

  // Sync threshold to localstorage
  useEffect(() => {
    localStorage.setItem("cute_gold_alert_threshold", threshold.toString());
  }, [threshold]);

  // Toast automatic removal timer
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // Request browser Notification permissions
  const handleRequestPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        setPermissionStatus(permission);
        if (permission === "granted") {
          // Play a friendly greeting sound to verify
          playCoinSound();
          const testToast: InAppToast = {
            id: "permission-test",
            title: "🔔 Kích hoạt thông báo thành công!",
            description: "Hệ thống sẽ gửi thông báo đẩy trực tiếp qua màn hình khi có biến động giá trị vàng meow!",
            type: "up"
          };
          setToasts((prev) => [...prev, testToast]);
        }
      });
    } else {
      alert("Trình duyệt này không hỗ trợ Web Notifications.");
    }
  };

  const handleClearHistory = () => {
    setNotificationHistory([]);
    localStorage.removeItem("cute_gold_notification_history");
  };

  // Trigger simulated market price fluctuation
  const triggerMockFluctuation = (percent: number) => {
    if (portfolioSummary.currentValue === 0) {
      // In-app alert showing need for transactions
      const emptyToast: InAppToast = {
        id: "warn-empty",
        title: "⚠️ Két vàng chưa có tích lũy!",
        description: "Sen ơi, két vàng đang trống! Hãy cất một vài nhẫn tròn trơn vào két trước thì mới sinh trị giá để test biến động được nhé meow~",
        type: "down"
      };
      setToasts((prev) => [...prev, emptyToast]);
      playCoinSound();
      return;
    }

    setPrices((prev) => {
      const target = prev.doji;
      const multiplier = 1 + percent / 100;
      const newSell = parseFloat((target.sell * multiplier).toFixed(2));
      const newBuy = parseFloat((target.buy * multiplier).toFixed(2));
      
      return {
        ...prev,
        doji: {
          ...target,
          buy: newBuy,
          sell: newSell,
          yesterdayChange: parseFloat((target.yesterdayChange + (newSell - target.sell)).toFixed(2)),
          history: [...target.history.slice(0, -1), newSell]
        }
      };
    });
  };

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem("cute_gold_portfolio", JSON.stringify(transactions));
  }, [transactions]);

  // Fetch true today prices completely client-side via free CORS proxy
  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveGoldData();
      if (data.prices) setPrices(data.prices);
      if (data.news) setNews(data.news);
      if (data.crawledProducts) setCrawledProducts(data.crawledProducts);
      
      // Dynamic success alert on active refresh
      const successToast: InAppToast = {
        id: `prices-sync-ok-${Date.now()}`,
        title: "✨ Đã cập nhật giá mới nhất!",
        description: "Thông tin hũ vàng được đồng bộ thành công với VnExpress!",
        type: "up"
      };
      setToasts((prev) => [...prev, successToast]);
      playCoinSound();
    } catch (err: any) {
      console.warn("Failed to fetch fresh gold prices: ", err);
      
      const errorToast: InAppToast = {
        id: `prices-sync-error-${Date.now()}`,
        title: "⚠️ Không thể đồng bộ trực tiếp!",
        description: "Không thể lấy thông tin giá vàng mới nhất qua trình duyệt. Hệ thống đang sử dụng giá mặc định.",
        type: "down"
      };
      setToasts((prev) => [...prev, errorToast]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run the manual force-test crawl directly on the client side
  const handleTestCrawl = async () => {
    setIsTestCrawling(true);
    try {
      const data = await fetchLiveGoldData();
      if (data.prices) setPrices(data.prices);
      if (data.crawledProducts) setCrawledProducts(data.crawledProducts);
      
      const totalCrawled = data.crawledProducts?.length || 0;
      const ringCount = data.crawledProducts?.filter(p => 
        p.title.toLowerCase().includes("nhẫn") || 
        p.title.toLowerCase().includes("trơn") || 
        p.title.toLowerCase().includes("kim gia bảo")
      ).length || 0;
      
      const successToast: InAppToast = {
        id: `test-crawl-ok-${Date.now()}`,
        title: "🎉 Quét Live Thành Công!",
        description: `Đã quét thành công từ VnExpress! Cập nhật tin tức và giá nhẫn trơn Kim Gia Bảo 24K - 1 chỉ!`,
        type: "up"
      };
      setToasts((prev) => [...prev, successToast]);
      playCoinSound();
    } catch (err: any) {
      console.warn("Client crawl failed:", err);
      const errorToast: InAppToast = {
        id: `test-crawl-error-${Date.now()}`,
        title: "⚠️ Lỗi quét trực tiếp!",
        description: "Không thể kết nối máy chủ VnExpress, đang hiển thị dữ liệu lưu cấu hình.",
        type: "down"
      };
      setToasts((prev) => [...prev, errorToast]);
    } finally {
      setIsTestCrawling(false);
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

  // Monitor gold portfolio changes to trigger alert meow meow!
  useEffect(() => {
    if (portfolioSummary.currentValue === 0) return;

    if (lastNotifiedValue === 0) {
      setLastNotifiedValue(portfolioSummary.currentValue);
      localStorage.setItem("cute_gold_last_notified_value", portfolioSummary.currentValue.toString());
      return;
    }

    const difference = portfolioSummary.currentValue - lastNotifiedValue;
    const pctChange = (difference / lastNotifiedValue) * 100;
    const absChange = Math.abs(pctChange);

    if (absChange >= threshold) {
      const id = Date.now().toString();
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const dateStr = new Date().toLocaleDateString("vi-VN");
      const direction = pctChange > 0 ? "up" : "down";

      const title = direction === "up" 
        ? "📈 Tài sản vàng tăng vọt!" 
        : "📉 Tài sản vàng sụt giảm!";
      const description = `Tổng trị giá két nhẫn vàng của Sen đã biến động ${pctChange > 0 ? "+" : ""}${pctChange.toFixed(2)}% (so với mốc ${lastNotifiedValue.toFixed(2)}Trđ).`;

      // 1. Synth slot machine gold chime sound!
      playCoinSound();

      // 2. HTML5 System Push Notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: `${description} Đạt ${portfolioSummary.currentValue.toFixed(2)}Trđ meow!`,
            tag: "gold-vault-change",
            icon: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f431.png"
          });
        } catch (err) {
          console.warn("System Notification trigger failed:", err);
        }
      }

      // 3. Save to journal list
      const newItem: GoldNotificationItem = {
        id,
        timestamp: `${dateStr} ${timeStr}`,
        oldValue: lastNotifiedValue,
        newValue: portfolioSummary.currentValue,
        percentChange: pctChange,
        type: direction,
        title,
        description: `Trị giá két nhảy vọt từ ${lastNotifiedValue.toFixed(2)} triệu đ lên ${portfolioSummary.currentValue.toFixed(2)} triệu đ. Mèo ú meow meow!`
      };
      setNotificationHistory((prev) => {
        const updated = [newItem, ...prev];
        localStorage.setItem("cute_gold_notification_history", JSON.stringify(updated.slice(0, 30)));
        return updated;
      });

      // 4. Update comparison baseline so we can detect future shifts from this new baseline point!
      setLastNotifiedValue(portfolioSummary.currentValue);
      localStorage.setItem("cute_gold_last_notified_value", portfolioSummary.currentValue.toString());
    }
  }, [portfolioSummary.currentValue, lastNotifiedValue, threshold]);

  // Hook tab/window exit beforeunload / unload handlers to dispatch immediate native system push notification when closing browser
  useEffect(() => {
    const handleBrowserCloseNotification = () => {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        if (portfolioSummary.currentValue > 0) {
          try {
            new Notification("🐱 Mèo Béo đã khóa hũ vàng an toàn!", {
              body: `Tạm biệt Sen! Tổng trị giá hũ vàng nhẫn 24K hiện tại là ${portfolioSummary.currentValue.toFixed(2)} triệu đ. Mèo béo ôm hũ ngủ giữ của cẩn mật nhé meow~`,
              tag: "gold-vault-quit-lock",
              icon: "https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f431.png"
            });
          } catch (e) {
            console.warn("Could not fire close notification:", e);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBrowserCloseNotification);
    window.addEventListener("unload", handleBrowserCloseNotification);
    return () => {
      window.removeEventListener("beforeunload", handleBrowserCloseNotification);
      window.removeEventListener("unload", handleBrowserCloseNotification);
    };
  }, [portfolioSummary.currentValue]);

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
    <div className="min-h-screen w-full bg-[#FAF9F5] font-sans text-stone-800 antialiased flex flex-col">
      {/* Top clean minimal navigation */}
      <header className="border-b border-amber-100/50 bg-white/70 backdrop-blur-md sticky top-0 z-30 px-4 py-3 shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🐱</span>
            <div>
              <h1 className="text-xs font-black uppercase tracking-widest text-[#854D0E]">Kim Gia Bảo 24K</h1>
              <p className="text-[9px] uppercase tracking-wider text-[#A16207]/70 font-bold">Két vàng của bạn</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchPrices}
              disabled={isLoading}
              className="p-1 px-2 rounded-lg bg-stone-50 hover:bg-amber-50/50 border border-stone-200/50 text-stone-600 transition-all flex items-center justify-center cursor-pointer"
              title="Cập nhật giá"
            >
              <RefreshCcw size={11} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Focus Dashboard Layout */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col gap-5">
        
        {/* HERO CARD: Today's Fluctuation & Total Assets */}
        <section className="bg-white border border-amber-100/80 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
          
          <div className="text-center pt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-0.5">
              BIẾN ĐỘNG HÔM NAY
            </span>
            
            {/* The absolute main highlight of the screen */}
            <div className={`text-3xl font-black font-mono tracking-tight my-1.5 flex items-center justify-center gap-1 ${
              assetsChangeToday > 0 
                ? "text-emerald-600 animate-pulse" 
                : assetsChangeToday < 0 
                  ? "text-rose-600" 
                  : "text-stone-500"
            }`}>
              <span>{assetsChangeToday > 0 ? "▲" : assetsChangeToday < 0 ? "▼" : "●"}</span>
              <span>
                {assetsChangeToday !== 0 ? (
                  `${assetsChangeToday > 0 ? "+" : "-"}${Math.abs(Math.round(assetsChangeToday * 1000000)).toLocaleString("vi-VN")} đ`
                ) : (
                  "0 đ"
                )}
              </span>
            </div>

            <span className={`text-[10px] font-extrabold px-3 py-0.5 rounded-full ${
              assetsChangeToday > 0 
                ? "bg-emerald-50 text-emerald-700" 
                : assetsChangeToday < 0 
                  ? "bg-rose-50 text-rose-700" 
                  : "bg-stone-50 text-stone-600"
            }`}>
              {assetsChangeToday > 0 ? "Hôm nay két sinh lời! 🐟✨" : assetsChangeToday < 0 ? "Tiếp tục tích lũy nhen! 💪" : "Hôm nay thị trường đứng yên 🐾"}
            </span>
          </div>

          <div className="border-t border-stone-100/65 my-1" />

          {/* Asset summary details */}
          <div className="grid grid-cols-2 gap-3 pb-1">
            <div className="bg-[#FAF9F5]/80 rounded-2xl p-3 border border-stone-100/50">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">Hũ Vàng 24K</span>
              <div className="flex items-baseline gap-0.5 text-stone-800">
                <span className="text-lg font-black font-mono tracking-tight">
                  {portfolioSummary.currentValue.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold">Trđ</span>
              </div>
              <span className="text-[9px] font-bold text-amber-800/80 mt-0.5 block">
                Sở hữu: <strong className="font-mono text-amber-900">{portfolioSummary.totalQuantity.toFixed(1)} chỉ</strong>
              </span>
            </div>

            <div className="bg-[#FAF9F5]/80 rounded-2xl p-3 border border-stone-100/50">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">Tổng lãi/lỗ lũy kế</span>
              {portfolioSummary.totalTransactions === 0 ? (
                <div className="text-stone-400 font-bold text-xs pt-1">Chưa có giao dịch</div>
              ) : (
                <>
                  <div className={`flex items-baseline gap-0.5 text-lg font-black font-mono tracking-tight ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>
                    <span>{isProfit ? "+" : "-"}</span>
                    <span>{Math.abs(portfolioSummary.totalProfit).toFixed(2)}</span>
                    <span className="text-[10px] font-bold">Trđ</span>
                  </div>
                  <span className={`text-[9px] font-black tracking-tight ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>
                    {isProfit ? "▲" : "▼"} {portfolioSummary.profitPercentage.toFixed(1)}% lũy kế
                  </span>
                </>
              )}
            </div>
          </div>

        </section>

        {/* COMPACT CAT MASCOT */}
        <section className="bg-white/50 border border-stone-200/40 rounded-3xl p-2 shadow-2xs">
          <GoldCat 
            portfolio={portfolioSummary} 
            todayChange={assetsChangeToday} 
            onPoke={() => {}} 
          />
        </section>

        {/* VNEXPRESS GOLD NEWS SECTION */}
        {news && news.length > 0 && (
          <section className="bg-white border border-amber-100/80 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#854D0E] flex items-center gap-1.5">
                <Newspaper size={13} className="text-amber-600" />
                <span>Tin nhanh Vàng (VnExpress)</span>
              </h3>
              <span className="text-[9px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Trực tuyến
              </span>
            </div>

            <div className="flex flex-col gap-3 divide-y divide-stone-100/50">
              {news.slice(0, 5).map((item, idx) => (
                <button 
                  key={item.id || idx} 
                  onClick={() => setSelectedNews(item)}
                  type="button"
                  className="pt-3 first:pt-0 group flex gap-3 items-start hover:opacity-90 transition-opacity cursor-pointer text-left w-full focus:outline-hidden"
                >
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt="news thumb" 
                      referrerPolicy="no-referrer"
                      className="w-16 h-12 object-cover rounded-lg bg-stone-100 border border-stone-200/50 flex-shrink-0" 
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-stone-800 leading-snug group-hover:text-amber-800 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[9px] text-stone-400 mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                      <span>📰 {item.source || "VnExpress"}</span>
                      <span>•</span>
                      <span>{item.time || "Gần đây"}</span>
                      {item.sentiment && (
                        <>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wide ${
                            item.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                            item.sentiment === 'negative' ? 'bg-rose-50 text-rose-700' :
                            'bg-stone-50 text-stone-500'
                          }`}>
                            {item.sentiment === 'positive' ? '📈 Tốt' : item.sentiment === 'negative' ? '📉 Giảm' : '⚖️ Ổn định'}
                          </span>
                        </>
                      )}
                    </p>
                    {item.description && (
                      <p className="text-[9px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* TRANSACTIONS DRAWER & SETTING */}
        <section className="mt-1">
          <button
            onClick={() => setShowManager(!showManager)}
            className="w-full bg-[#FEF3C7]/45 hover:bg-[#FEF3C7]/75 border border-[#FDE68A]/60 rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer text-xs font-bold text-[#854D0E]"
          >
            <div className="flex items-center gap-2">
              <span>⚙️</span>
              <span>Cài đặt Giao dịch & Sổ vàng</span>
              <span className="text-[9px] bg-amber-200/50 text-[#854D0E] font-medium px-2 py-0.5 rounded-md">
                {transactions.length} GD
              </span>
            </div>
            <span className="text-[10px] text-[#A16207]/70 font-black">
              {showManager ? "Đóng ▲" : "Chi tiết ▼"}
            </span>
          </button>

          {showManager && (
            <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="border border-stone-200/50 rounded-3xl p-4 bg-white/80 shadow-2xs">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">📝 Nhập giao dịch mới</h3>
                <VaultForm prices={prices} onAddTransaction={handleAddTransaction} />
              </div>
              
              <div className="border border-stone-200/50 rounded-3xl p-4 bg-white shadow-2xs">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">📜 Sổ giao dịch đang lưu trữ</h3>
                <GoldVaultList 
                  transactions={transactions} 
                  prices={prices} 
                  onDeleteTransaction={handleDeleteTransaction} 
                />
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Toast notifications rendering cleanly */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className="p-3 bg-stone-900 text-stone-100 rounded-xl shadow-lg border border-stone-800 text-xs pointer-events-auto animate-in slide-in-from-bottom-2 duration-300"
          >
            <div className="font-bold flex items-center gap-1">
              <span>{t.type === "up" ? "✨" : "⚠️"}</span>
              <span>{t.title}</span>
            </div>
            <p className="text-stone-300 text-[10px] mt-1 leading-normal">{t.description}</p>
          </div>
        ))}
      </div>

      {/* Interactive News Detail Popup Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 max-h-[85vh] text-left"
            >
              {/* Close Button overlay */}
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="absolute top-3 right-3 z-20 bg-stone-900/60 hover:bg-stone-900/80 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              {/* News Thumbnail Image */}
              {selectedNews.image && (
                <div className="w-full h-40 overflow-hidden bg-stone-100 relative">
                  <img
                    src={selectedNews.image}
                    alt={selectedNews.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-white text-[10px] font-black uppercase tracking-wider bg-red-600/80 px-2 py-0.5 rounded">
                    VnExpress
                  </span>
                </div>
              )}

              {/* Information body with scroll */}
              <div className="p-5 flex-1 overflow-y-auto space-y-3">
                <div className="flex flex-wrap gap-2 items-center text-[10px] text-stone-400 font-bold">
                  <span>📰 {selectedNews.source || "VnExpress"}</span>
                  <span>•</span>
                  <span>{selectedNews.time || "Gần đây"}</span>
                  {selectedNews.sentiment && (
                    <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wide ${
                      selectedNews.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                      selectedNews.sentiment === 'negative' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                      'bg-stone-50 text-stone-600 border border-stone-100'
                    }`}>
                      {selectedNews.sentiment === 'positive' ? '📈 Tốt cho thị trường' : selectedNews.sentiment === 'negative' ? '📉 Giá giảm' : '⚖️ Ổn định'}
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-black text-stone-900 leading-snug tracking-tight">
                  {selectedNews.title}
                </h3>

                {isNewsLoading ? (
                  <div className="space-y-2.5 pt-2 animate-pulse">
                    <div className="h-2 bg-stone-200 rounded-full w-full"></div>
                    <div className="h-2 bg-stone-200 rounded-full w-11/12"></div>
                    <div className="h-2 bg-stone-200 rounded-full w-[85%]"></div>
                    <div className="h-2 bg-stone-200 rounded-full w-full"></div>
                    <div className="h-2 bg-stone-200 rounded-full w-2/3"></div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1 max-h-[250px] overflow-y-auto">
                    {newsParagraphs.map((para, pIdx) => (
                      <p key={pIdx} className="text-[10px] text-stone-600 leading-relaxed font-normal">
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-2.5">
                {selectedNews.link && (
                  <a
                    href={selectedNews.link}
                    target="_blank"
                    rel="no-referrer"
                    referrerPolicy="no-referrer"
                    className="flex-1 bg-white hover:bg-stone-150 border border-stone-200 text-stone-700 text-[11px] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Xem bài báo gốc</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedNews(null)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-[11px] font-bold py-2.5 px-3 rounded-xl text-center transition-colors cursor-pointer"
                >
                  Đóng lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
