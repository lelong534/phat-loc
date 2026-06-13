export type GoldTypeCode = "sjc" | "doji" | "pnj";

export interface GoldPrice {
  name: string;
  buy: number;        // Million VND per lượng
  sell: number;       // Million VND per lượng
  yesterdayChange: number; // Million VND change
  code: string;
  history: number[];  // Last 7 days history prices
}

export interface GoldPriceMap {
  sjc: GoldPrice;
  doji: GoldPrice;
  pnj: GoldPrice;
}

export interface GoldTransaction {
  id: string;
  type: GoldTypeCode;
  unit: "chi" | "luong"; // Purchased in "chỉ" (1/10 lượng) or "lượng" (10 chỉ)
  quantity: number;     // Quantity in the selected unit
  quantityInChi: number;// Normalized quantity in "chỉ" (1 lượng = 10 chỉ)
  purchasePricePerUnit: number; // Price in Million VND paid per unit (chỉ or lượng)
  purchasePricePerChi: number;  // Price in Million VND normalized per chỉ
  date: string;
  note?: string;
}

export interface GoldPortfolioSummary {
  totalTransactions: number;
  totalQuantity: number; // in "chỉ"
  totalQuantityInLuong: number; // in "lượng"
  totalInvested: number; // in Million VND
  currentValue: number;  // in Million VND according to today's SELL price of that type
  totalProfit: number;   // in Million VND (currentValue - totalInvested)
  profitPercentage: number; // ((currentValue - totalInvested) / totalInvested) * 100
}

export interface GoldNews {
  id: string;
  title: string;
  time: string;
  source: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "cat";
  text: string;
  timestamp: Date;
}

export function getApiUrl(path: string): string {
  // If we are on Vercel or other external host, point to our Cloud Run backend deployment
  const isCustomHost = typeof window !== "undefined" && 
                       window.location.hostname !== "localhost" && 
                       !window.location.hostname.endsWith(".run.app") && 
                       !window.location.hostname.match(/^127\./) &&
                       window.location.hostname !== "::1";
  
  if (isCustomHost) {
    return `https://ais-pre-nsrpe2fj3dygpx3kufcrfs-229900755055.asia-southeast1.run.app${path}`;
  }
  return path;
}
