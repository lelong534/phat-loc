import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageCircle, Cpu, Loader2 } from "lucide-react";
import { ChatMessage, GoldPortfolioSummary, getApiUrl } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface GoldChatbotProps {
  portfolio: GoldPortfolioSummary;
}

const SUGGESTED_QUESTIONS = [
  "Có nên mua vàng tiếp lúc này không meow? 🐱",
  "Dự đoán giá vàng thời gian tới thế nào? 🔮",
  "Làm sao để mau sắm lâu đài cát cho Trẫm? 🏰",
  "Tặng Trẫm một đĩa pate cua hoàng đế nha! 🦀"
];

const INITIAL_CAT_MESSAGE: ChatMessage = {
  id: "init",
  sender: "cat",
  text: "Chào Sen béo thương mến! Trẫm đang nằm thong thả gác chân lên hũ vàng nè. Hỏi Trẫm gì về giá vàng hôm nay, hay cách tích tích vàng cho mau giàu đi Trẫm chỉ bí quyết truyền đời cho meow! 🐾✨",
  timestamp: new Date()
};

export default function GoldChatbot({ portfolio }: GoldChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_CAT_MESSAGE]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    // Client-side witty feline generator
    const generateCatReply = (message: string, summary: GoldPortfolioSummary): string => {
      const norm = message.toLowerCase().trim();
      const hasInvestment = summary.totalQuantity > 0;
      const qtyStr = summary.totalQuantity.toFixed(2);
      const profitStr = summary.totalProfit.toFixed(2);
      const profitPctStr = summary.profitPercentage.toFixed(2);
      const isProfit = summary.totalProfit >= 0;

      let portfolioSentence = "";
      if (hasInvestment) {
        if (isProfit) {
          portfolioSentence = `\n\n(Trẫm dòm lén sổ vàng: Sen đang có ${qtyStr} chỉ nhẫn tròn tích lũy, mua gốc ${summary.totalInvested.toFixed(2)} triệu VNĐ và hiện đang lãi vàng thơm bơ +${profitStr} triệu đồng (${profitPctStr}%) đó nha meow~ 🐾✨)`;
        } else {
          portfolioSentence = `\n\n(Trẫm hé lộ sổ vàng: Sen đang gồng lỗ tí nị ${profitStr} triệu đồng cho ${qtyStr} chỉ nhẫn tròn. Nhưng xá gì, gom giữ nhẫn tròn 24K lâu dài lo gì lạm phát meow~ 🐈📈)`;
        }
      } else {
        portfolioSentence = `\n\n(Ôi meow! Két vàng đang trống trơn nha Sen ơi! Mau cất vài chỉ nhẫn trơn Kim Gia Bảo vào tủ để Trẫm có gối mềm kê đầu nằm ngủ đi nào! 🐱💰)`;
      }

      // Check key phrases
      if (norm.includes("pate") || norm.includes("ăn") || norm.includes("thưởng") || norm.includes("béo")) {
        const replies = [
          `Meowww! Nghe nhắc tới pate tôm cua hoàng đế là râu ria Trẫm vểnh lên rạo rực như hũ vàng! 🐱🍴 Sen đang tủ sẵn ${hasInvestment && isProfit ? `lãi ròng +${profitStr} triệu đồng` : "nhiều vàng"} thì trích nhẹ vài chục k lẻ mua pate ngon thượng hạng cho Trẫm tẩm bổ đi nhe. Trẫm hứa sẽ ôm chân Sen nịnh hót suốt ngày meow! 🐾🐟`,
          `Pate tôm, pate cá hồi tươi ngọt lịm? 🍤 Trẫm chỉ quen ăn hàng xịn thui dẫu Trẫm hơi béo ú lười biếng một tí nà. Thưởng pate bồi dưỡng Trẫm đi Sen, Trẫm cầu phúc tinh tú cho ngày mai giá nhẫn tròn Kim Gia Bảo Bảo Tín Mạnh Hải phi mã vù vù meow!`
        ];
        return replies[Math.floor(Math.random() * replies.length)] + portfolioSentence;
      }

      if (norm.includes("mua") || norm.includes("tích lũy") || norm.includes("holding") || norm.includes("gom")) {
        const replies = [
          `Bí quyết rủng rỉnh của Trẫm: gom nhẫn tròn trơn ép vỉ lúc này là quốc sách đó Sen! Tích tiểu thành đại, mỗi tháng trích 5-10% lương mua đều đặn cất tủ. Nhẫn tròn vừa bền tốt chống rỉ sét ráo khí ẩm, lại siêu dễ chia nhỏ thanh khoản meow! 🐾✨`,
          `Gom đi gom đi Sen ơi meow! Cất thật nhiều nhẫn trơn Kim Gia Bảo về két sắt để Trẫm rọ rạy canh canh cho ấm bụng béo. Mua vàng hôm nay, sắm lâu đài cát lộng lẫy cho Trẫm ngủ ngày mai nhe! 🏰💰`
        ];
        return replies[Math.floor(Math.random() * replies.length)] + portfolioSentence;
      }

      if (norm.includes("bán") || norm.includes("chốt lời")) {
        const replies = [
          `Hả, Sen béo định bán vàng nhẫn ư meow? Thôi đừng bán vội á! Trừ phi Sen túng pate tôm hùm nặng quá thì bán nhẹ 1 chỉ mua pate cho Trẫm bồi bổ dăm hôm meow~ 🐱🍣 Còn lại cứ kiên định ôm giữ nhe, nhẫn tròn trơn là lá chắn hộ mệnh vượt lạm phát lâu dài đó!`,
          `Meow! Trẫm nằm bẹp dí đè lên nắp két sắt rồi, Sen hòng mà bán được nhe! Nhẫn vàng ta tích tụ tài khí linh thiêng bao ngày qua, Sen phải giữ cẩn mật. Chờ tài sản nở hoa to đùng hoặc cần việc đại sự hẵng tính meow! 🚀🐾`
        ];
        return replies[Math.floor(Math.random() * replies.length)] + portfolioSentence;
      }

      if (norm.includes("dự báo") || norm.includes("tương lai") || norm.includes("xu hướng") || norm.includes("lên") || norm.includes("xuống") || norm.includes("tăng") || norm.includes("giảm") || norm.includes("biến động")) {
        const replies = [
          `Theo quẻ bói ngũ hành móng vuốt của Trẫm: Nhẫn trơn KGB luôn có xu thế tăng bền vững theo đồ thị hình sườn núi dốc dài hạn. Vàng nhẫn 24K bây giờ là vua giữ của rồi, ba cái tin đồn lướt sóng ngắn hạn kệ nó đi Sen béo meow! 📈🐈`,
          `Vũ trụ mách bảo Trẫm rằng giá vàng nhẫn trong dài hạn sẽ lấp lánh như lông béo bơ vàng của Trẫm vậy meow! Thi thoảng thị trường có nhúc nhích rung lắc vài chỉ pate nhưng cứ HOLD vững tay chèo là thành đại gia mèo hết nhe Sen! 🪙🚀`
        ];
        return replies[Math.floor(Math.random() * replies.length)] + portfolioSentence;
      }

      if (norm.includes("lâu đài") || norm.includes("nhà") || norm.includes("cát")) {
        return `🏰 Ôi lâu đài cát hoàng gia mơ ước của Trẫm! Trẫm thèm khát có một tòa lâu đài bằng cát mịn bự chảng có nệm nhung béo mượt thêu chỉ vàng óng ánh và bát pate cua hoàng đế lụt lội. Sen tích đủ lên mốc 10 chỉ vàng đi rồi sắm sửa bồi đắp lâu đài cát thưởng cho Trẫm nha meow! 🐾🐱` + portfolioSentence;
      }

      if (norm.includes("giàu") || norm.includes("tiền") || norm.includes("tỷ phú")) {
        return `Phương pháp làm giàu bí truyền từ loài mèo quý tộc cổ đại: cắt giảm bớt trà sữa bùa chú lại, dồn tiền mua nhẫn tròn ép vi 24K gửi Trẫm giữ két nhe meow! 🐱💰 Người khôn giữ nhẫn trơn luôn rủng rỉnh lúc kinh tế bão bùng lạm phát. Chăm gom đi Sen sẽ mau làm đại gia cung phụng Trẫm meow!` + portfolioSentence;
      }

      if (norm.includes("chào") || norm.includes("hello") || norm.includes("hi") || norm.includes("mèo") || norm.includes("ta") || norm.includes("trẫm")) {
        return `Meow! Trẫm chào Sen thương mến nha~ Trẫm đang thư thải duỗi chân béo ú xoa chuông vàng kêu linh kinh kìa. Có câu hỏi đầu tư vàng nhẫn hay thắc mắc vĩ mô gì cần Trẫm gõ quẻ tinh tú soi đường dẫn lối meow? 🐾🐱✨` + portfolioSentence;
      }

      const randomFallbacks = [
        `Meow~ Trẫm nghe lời Sen nói rồi nhe, rất có triết lý chiều sâu đó! Cơ mà Sen béo đã gom đủ lượng vàng tích lũy mong ước tuần này chưa? Cố gắng gom đều đặn hàng tuần, hàng tháng nhe Sen! 🐱✨`,
        `Trẫm vừa kiểm tra bói toán tinh tú bằng móng béo: khuyên Sen nên vững tay giữ chặt nhẫn nhơn 24K vượt bão dông, tuyệt đối không lướt sóng nóng vội nha meow! 🐈📉`,
        `Ưm... Trẫm hơi lười bấm quẻ sâu vĩ mô quá, nhưng nôm na là nhẫn trơn Kim Gia Bảo đang là chân á giữ của đời Sen béo meow! Xoa cằm béo của Trẫm một cái lấy hên đi cậu nhe! 🐾🪙`,
        `Sen béo có hay tích vàng nhẫn tròn ép vỉ không? Trẫm cực chuộng nhẫn trơn vì chia nhỏ 2 chỉ, 5 chỉ siêu tiện, khi cần tiền mua pate mua hạt là lách một phát ra tiệm thanh khoản vèo vèo meow! 🍤🐱`
      ];
      return randomFallbacks[Math.floor(Math.random() * randomFallbacks.length)] + portfolioSentence;
    };

    // Chat reply process simulation
    setTimeout(() => {
      const catReplyText = generateCatReply(textToSend, portfolio);
      const catMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "cat",
        text: catReplyText,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, catMsg]);
      setIsLoading(false);
    }, 650); // Delightful organic delay feel
  };

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 shadow-sm w-full max-w-md lg:max-w-4xl mx-auto my-4 flex flex-col h-[500px] relative">
      {/* Title block */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 mb-3 shrink-0">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
          <MessageCircle size={13} className="text-amber-500 fill-amber-300" />
          <span>Hỏi Trợ Lý Mèo Thần Tài (AI)</span>
        </h3>
        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
          <Cpu size={9} />
          <span>Gemini 3.5 AI</span>
        </span>
      </div>

      {/* Chat scroll content */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 text-xs">
        {messages.map((msg) => {
          const isCat = msg.sender === "cat";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-1.5 ${isCat ? "justify-start" : "justify-end"}`}
            >
              {isCat && (
                <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs shrink-0 self-start shadow-sm mt-0.5 select-none">
                  🐱
                </span>
              )}
              <div
                className={`max-w-[78%] rounded-2xl p-3 px-3.5 shadow-sm leading-relaxed ${
                  isCat
                    ? "bg-white text-slate-700 border border-slate-100 rounded-tl-sm text-left"
                    : "bg-amber-400 text-amber-950 font-medium rounded-tr-sm text-left"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className={`text-[8px] mt-1 block font-mono ${isCat ? "text-slate-400" : "text-amber-900/60"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-1.5 justify-start">
            <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-[10px] shrink-0 self-start mt-0.5 animate-bounce">
              🐱
            </span>
            <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-tl-sm p-3 flex items-center gap-1.5 shadow-sm">
              <Loader2 size={11} className="animate-spin text-amber-500" />
              <span>Mèo béo đang bấm quẻ gõ móng... meow...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions overlay */}
      {messages.length <= 2 && !isLoading && (
        <div className="absolute left-4 right-4 bottom-14 flex flex-wrap gap-1.5 shrink-0 select-none pb-2 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pt-4">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-[10px] bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-900 border border-slate-200 hover:border-amber-400 font-semibold px-2.5 py-1 rounded-full text-left max-w-full truncate shadow-sm transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="flex gap-1.5 items-center shrink-0 mt-auto pt-1 bg-slate-50"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Hỏi Mèo Vàng về đầu tư, tài lộc..."
          disabled={isLoading}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:opacity-50 text-slate-800 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-950 font-bold rounded-xl active:scale-95 transition-all text-center flex items-center justify-center cursor-pointer shadow-sm shrink-0"
        >
          <Send size={12} className="stroke-[3]" />
        </button>
      </form>
    </div>
  );
}
