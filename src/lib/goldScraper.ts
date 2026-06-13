import { GoldPriceMap, GoldNews } from "../types";

export interface CrawledProduct {
  title: string;
  priceRaw: string;
  priceMin: number; // Million VND
  url: string;
  image: string;
}

export async function fetchLiveGoldData(): Promise<{
  prices: GoldPriceMap;
  crawledProducts: CrawledProduct[];
  news: GoldNews[];
}> {
  const response = await fetch("/api/gold-prices");
  if (!response.ok) {
    throw new Error(`Failed to fetch live gold prices: ${response.statusText}`);
  }
  return await response.json();
}
