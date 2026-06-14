import React, { useState, useEffect, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Heart } from "lucide-react";
import { GoldPortfolioSummary } from "../types";

// Import images directly for Vite resolution
// @ts-ignore
import catHappy from "../assets/images/cat_gold_happy_1781155197922.png";
// @ts-ignore
import catSad from "../assets/images/cat_gold_sad_1781155216875.png";
// @ts-ignore
import catIdle from "../assets/images/cat_gold_idle_1781155232644.png";

interface GoldCatProps {
  portfolio: GoldPortfolioSummary;
  todayChange: number; // Tổng tăng giảm tài sản hôm nay (triệu VNĐ)
  onPoke: () => void;
  isFirstLoad?: boolean;
}

const FUN_QUOTES = [
  "Mua vàng hôm nay, sắm lâu đài cát cho Trẫm ngày mai nha Sen! 🐱🏰",
  "Trẫm đã dùng móng vuốt bói quẻ, thấy giá vàng sắp bay cao lắm đó meow~ 🐾📈",
  "Đừng bán vàng lúc này, giữ đi meow! Bán rồi lấy gì mua cá nục kho cho Trẫm? 🐟💔",
  "Nệm vàng của Trẫm có êm hay không là nhờ vào độ chăm chỉ tích tích vàng của Sen đó! 💰🛌",
  "Mỗi chỉ vàng Sen gom góp là một bước tiến gần hơn tới thiên đường pate tôm! meow~ 🍤🐾",
  "Lướt sóng vàng dễ chìm xuồng lắm, cứ ôm chắc hũ vàng dài hạn như Trẫm ôm thỏi vàng này nè! 🐈💎",
  "Ủa sen? Hôm nay đã nựng Trẫm chưa mà đòi vàng tăng giá à? Nựng lẹ đi meow! 🐾💤"
];

export default function GoldCat({ portfolio, todayChange, onPoke, isFirstLoad }: GoldCatProps) {
  const [quote, setQuote] = useState<string>("");
  const [pokedCount, setPokedCount] = useState<number>(0);
  const [showHeart, setShowHeart] = useState<boolean>(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Determine avatar and default dialog based on profit state
  const hasTransactions = portfolio.totalTransactions > 0;
  const profit = portfolio.totalProfit;

  let currentAvatar = catIdle;
  let defaultQuote = "Xin chào Sen béo! Trẫm là Mèo Vàng Tài Lộc đây meow. Cho Trẫm ăn pate tôm rồi Trẫm canh hũ vàng cho nha! 🐱💰";

  if (isFirstLoad) {
    currentAvatar = catIdle;
    defaultQuote = "Mèo béo đang kiểm kho và cập nhật giá vàng trực tuyến từ VnExpress nhe meow... Sen đợi Trẫm chút xíu nha! 🐱🐾💎";
  } else if (hasTransactions) {
    if (profit > 0) {
      currentAvatar = catHappy;
      defaultQuote = `Sướng nhen Sen ơi! Sổ vàng của cậu đang sinh lời ngọt ngào kìa! Tổng lãi đã tăng **+${profit.toFixed(2)} triệu VNĐ** (+${portfolio.profitPercentage.toFixed(1)}%) gòi nha! Thưởng pate cua hoàng đế cho Trẫm lẹ meow meow! 🐈👑✨`;
    } else if (profit < 0) {
      currentAvatar = catSad;
      defaultQuote = `Huhu... Thị trường hôm nay đỏ một xíu, sổ vàng hụt mất **${Math.abs(profit).toFixed(2)} triệu VNĐ** gòi. Nhưng lo gì chứ, tích sản là dài lâu, ôm Trẫm một cái béo ấm áp lấy hên đi meow~ 🐱💔🐾`;
    } else {
      currentAvatar = catIdle;
      defaultQuote = "Hôm nay giá vàng êm đềm như một bờ hồ phẳng lặng, tài sản hòa vốn nè. Tiếp tục gom góp tích sản bền bỉ nhen Sen! 🐾💪";
    }
  } else {
    currentAvatar = catIdle;
    defaultQuote = "Sen chưa cất thỏi vàng nào vào két meow? Mau kéo xuống dưới thêm giao dịch vàng tích lũy đầu tiên đi, Trẫm canh hũ vàng siêu uy tín luôn nè! 👇✨";
  }

  // Set initial quote or update when portfolio changes
  useEffect(() => {
    setQuote(defaultQuote);
  }, [portfolio.totalProfit, hasTransactions, isFirstLoad]);

  const handlePoke = (e: React.MouseEvent<HTMLDivElement>) => {
    setPokedCount((prev) => prev + 1);
    
    // Gen heart effect at click coordinate
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newHeart = { id: Date.now(), x, y };
    setHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);

    // Pick a random fun quote
    const randomQuote = FUN_QUOTES[Math.floor(Math.random() * FUN_QUOTES.length)];
    setQuote(randomQuote);
    onPoke();
  };

  // Helper change color of speech text
  const formatSpeech = (text: string) => {
    // Basic markdown replacement for **text**
    const parts = text.split("**");
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="text-amber-600 font-bold">{part}</strong> : part
    );
  };

  return (
    <div className="relative flex flex-col items-center w-full max-w-md mx-auto my-3 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        key={quote}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative bg-[#FEF3C7] border-2 border-[#FDE68A] rounded-2xl p-4 shadow-md text-[#92400E] text-sm leading-relaxed mb-4 w-full"
      >
        <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-[#FEF3C7]" />
        <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[9px] border-t-[#FDE68A] -z-10" />
        
        <p className="font-semibold text-[#92400E] flex items-start gap-1">
          <span>🐾</span>
          <span className="flex-1">{formatSpeech(quote)}</span>
        </p>

        {pokedCount > 0 && (
          <div className="absolute top-1 right-2 text-[10px] text-amber-500 font-mono flex items-center gap-0.5">
            <Heart size={8} className="fill-amber-500 animate-pulse" />
            <span>Nựng x{pokedCount}</span>
          </div>
        )}
      </motion.div>

      {/* Cat Avatar Mascot */}
      <div className="relative">
        {/* Subtle shadow glow */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-amber-200/40 rounded-full blur-md -z-10" />

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, y: 4 }}
          onClick={handlePoke}
          className="relative cursor-pointer select-none group"
          id="mascot-cat-body"
        >
          {/* Main animated image element */}
          <motion.img
            src={currentAvatar}
            alt="Mèo Vàng Thần Tài"
            referrerPolicy="no-referrer"
            className="w-44 h-44 md:w-48 md:h-48 object-contain drop-shadow-md rounded-full pointer-events-none"
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Interactive Sparkles over model image on idle */}
          <div className="absolute -top-1 -right-1 text-yellow-400 opacity-60 group-hover:opacity-100 transition-opacity">
            <Sparkles size={18} className="animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="absolute top-1/2 -left-3 text-amber-400 opacity-50 group-hover:opacity-100 transition-opacity">
            <Sparkles size={14} className="animate-bounce" />
          </div>

          {/* Render hearts container inside component */}
          {hearts.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 1, scale: 0.5, y: h.y, x: h.x }}
              animate={{ opacity: 0, scale: 1.8, y: h.y - 60, x: h.x + (Math.random() * 40 - 20) }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute text-rose-500 pointer-events-none z-30"
              style={{ left: 0, top: 0 }}
            >
              <Heart size={20} className="fill-rose-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Change Summary pill */}
      {hasTransactions && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mt-2.5 px-3.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 border ${
            todayChange >= 0 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
              : "bg-rose-50 text-rose-700 border-rose-100"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
          <span>Hôm nay tài sản của bạn: </span>
          <span className="font-bold">
            {todayChange >= 0 ? "Tăng +" : "Giảm -"}
            {Math.abs(todayChange).toFixed(2)} triệu đ
          </span>
        </motion.div>
      )}
    </div>
  );
}
