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

    try {
      const response = await fetch(getApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          goldPortfolio: portfolio
        })
      });

      const data = await response.json();
      
      const catMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "cat",
        text: data.reply || "Meoww... Trẫm bị nghẹn pate cá thu gồi, Sen nói lại xem meow! 🐟🐾",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, catMsg]);
    } catch (err) {
      console.error("Chat Error:", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "cat",
        text: "Meowww... Sóng vũ trụ truyền tinh tú tới gậy thần tài đang chập chờn meow~ Cưng nựng Trẫm một cái bằng cách click bụng béo phía trên rồi thử lại sau nhen! 🐱✨",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
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
