import { GoldPriceMap, GoldNews } from "../types";

export interface CrawledProduct {
  title: string;
  priceRaw: string;
  priceMin: number; // Million VND
  url: string;
  image: string;
}

const BASE_URL = "https://baotinmanhhai.vn";
const PAGE_URL = `${BASE_URL}/vi/vang-tich-luy`;

/** Fetch HTML with a couple of CORS-proxy fallbacks for browser usage */
async function fetchHtml(targetUrl: string): Promise<string> {
  const cacheBusted = `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}nocache=${Date.now()}`;

  try {
    const res = await fetch(cacheBusted, { signal: AbortSignal.timeout(6000) });
    if (res.ok) return await res.text();
  } catch (e) {
    console.warn("[BTMH] direct fetch failed:", e);
  }

  const proxies = [
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  for (const buildUrl of proxies) {
    try {
      const res = await fetch(buildUrl(cacheBusted), { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 1000) return text;
      }
    } catch (e) {
      console.warn("[BTMH] proxy fetch failed:", e);
    }
  }

  return "";
}

/**
 * Extracts and resolves the React Router "turbo-stream" payload embedded as:
 *   window.__reactRouterContext.streamController.enqueue("[...]")
 *
 * The payload is a JSON array `arr`. References are 1-based indices: a
 * value `N` (number) inside an object/array means "use arr[N-1]". For
 * object keys, "_N" means the real key name is arr[N-1]. -5 = undefined.
 */
function decodeTurboStream(html: string): any | null {
  const matches = [
    ...html.matchAll(
      /streamController\.enqueue\("((?:[^"\\]|\\.)*)"\)/g
    ),
  ];
  if (matches.length === 0) return null;

  // Concatenate all enqueue() chunks, unescape JS string -> JSON text
  const raw = matches.map((m) => m[1]).join("");
  const jsonText = raw
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "");

  let arr: any[];
  try {
    arr = JSON.parse(jsonText);
  } catch (e) {
    console.warn("[BTMH] failed to parse turbo-stream JSON:", e);
    return null;
  }

  const cache = new Map<number, any>();

  function resolve(idx: number): any {
    if (idx === -5) return undefined;
    if (cache.has(idx)) return cache.get(idx);
    const raw = arr[idx - 1];
    cache.set(idx, undefined); // guard against cycles
    const value = resolveValue(raw);
    cache.set(idx, value);
    return value;
  }

  function resolveValue(v: any): any {
    if (Array.isArray(v)) {
      return v.map((x) => (typeof x === "number" ? resolve(x) : x));
    }
    if (v !== null && typeof v === "object") {
      const out: Record<string, any> = {};
      for (const [k, val] of Object.entries(v)) {
        const key = k.startsWith("_") ? resolve(Number(k.slice(1))) : k;
        const value = typeof val === "number" ? resolve(val) : val;
        if (typeof key === "string") out[key] = value;
      }
      return out;
    }
    return v;
  }

  // arr[0] is the root object, e.g. { "_1": 2, ... } -> { loaderData: {...}, ... }
  return resolve(1);
}

interface ResolvedProductItem {
  id?: number;
  sku?: string;
  name?: string;
  price?: number;
  special_price?: number | null;
  url_key?: string;
  category_url_key?: string;
  image?: string;
  [key: string]: any;
}

function priceVNDToMillion(price: number): number {
  return price / 1_000_000;
}

function buildProductUrl(item: ResolvedProductItem): string {
  if (!item.url_key) return PAGE_URL;
  const cat = item.category_url_key ?? "san-pham";
  return `${BASE_URL}/vi/san-pham/${cat}/${item.url_key}`;
}

function buildImageUrl(item: ResolvedProductItem): string {
  if (!item.image) return `${BASE_URL}/uploads/logo/logo-btmh.png`;
  return `${BASE_URL}/media/catalog/product${item.image}`;
}

function formatVND(amount: number): string {
  return Math.round(amount).toLocaleString("vi-VN") + " VNĐ";
}

export async function fetchLiveGoldData(): Promise<{
  prices: GoldPriceMap;
  crawledProducts: CrawledProduct[];
  news: GoldNews[];
}> {
  const defaultPrices: GoldPriceMap = {
    sjc: {
      name: "SJC Bảo Tín Mạnh Hải",
      buy: 83.0,
      sell: 85.0,
      yesterdayChange: 0.15,
      code: "SJC-BTMH",
      history: [82.1, 82.3, 82.8, 83.0, 83.1, 82.9, 83.0],
    },
    doji: {
      name: "Nhẫn trơn Kim Gia Bảo 24K",
      buy: 74.6,
      sell: 75.8,
      yesterdayChange: 0.25,
      code: "KGB-BTMH",
      history: [73.8, 74.0, 74.2, 74.5, 74.6, 74.4, 74.6],
    },
    pnj: {
      name: "Nhẫn tròn 999.9 BTMH",
      buy: 74.3,
      sell: 75.5,
      yesterdayChange: 0.2,
      code: "BT24K-BTMH",
      history: [73.5, 73.7, 73.9, 74.1, 74.3, 74.1, 74.3],
    },
  };

  const hotNews: GoldNews[] = [
    {
      id: "1",
      title:
        "Giá vàng nhẫn Bảo Tín Mạnh Hải tiếp tục tạo sóng tích lũy, người dân Hà Nội nhộn nhịp mua sắm đầu năm",
      time: "2 giờ trước",
      source: "Trực tuyến Tài Chính BTMH",
      sentiment: "positive",
    },
    {
      id: "2",
      title:
        "Đồng vàng Kim Gia Bảo 'Hoa Sen' và Nhẫn tròn ép vỉ ghi nhận kỷ lục giao dịch mới làm két của Sen béo chật cứng",
      time: "5 giờ trước",
      source: "Gia Bảo Tin Tức",
      sentiment: "positive",
    },
    {
      id: "3",
      title:
        "Mèo Thần Tài khuyên: 'Tích vàng Bảo Tín phòng thân là quốc sách, chớ có lướt sóng kẻo mất pate ngon!'",
      time: "Vừa xong",
      source: "Mèo Vàng Tiên Tri",
      sentiment: "neutral",
    },
  ];

  let calculatedPrices = { ...defaultPrices };
  let scrapedList: CrawledProduct[] = [];

  try {
    const html = await fetchHtml(PAGE_URL);
    if (!html) throw new Error("empty html");

    const root = decodeTurboStream(html);
    const loaderData = root?.loaderData;
    const cmsBlocks: any[] = loaderData?.["cms-page-locale"]?.blocks ?? [];

    const allItems: { item: ResolvedProductItem; categoryTitle: string }[] = [];

    for (const block of cmsBlocks) {
      if (block?.block_type !== "product_grid") continue;
      const content = block?.data?.content;
      const layout = block?.data?.layout;
      const items: ResolvedProductItem[] = layout?.items ?? [];
      const categoryTitle: string =
        content?.heading?.replace(/<[^>]*>/g, "").trim() ?? "";

      for (const item of items) {
        if (!item || !item.name) continue;
        allItems.push({ item, categoryTitle });
      }
    }

    // Build crawled product list
    scrapedList = allItems.map(({ item }) => {
      const price = item.special_price ?? item.price ?? 0;
      return {
        title: item.name as string,
        priceRaw: formatVND(price),
        priceMin: priceVNDToMillion(price),
        url: buildProductUrl(item),
        image: buildImageUrl(item),
      };
    });

    // Derive the three headline price quotes (per lượng = 10 chỉ)
    const findByName = (predicate: (name: string) => boolean) =>
      allItems
        .map((x) => x.item)
        .find((it) => predicate((it.name ?? "").toLowerCase()));

    // Kim Gia Bảo nhẫn tròn 1 chỉ -> doji line
    const kgbOneChi = findByName(
      (n) => n.includes("kim gia bảo") && n.includes("1 chỉ") && !n.includes("0.1") && !n.includes("10")
    );
    if (kgbOneChi) {
      const priceOneChi = kgbOneChi.special_price ?? kgbOneChi.price ?? 0;
      const sell = priceVNDToMillion(priceOneChi) * 10; // per lượng
      if (sell > 0) {
        calculatedPrices.doji.buy = parseFloat((sell - 1.2).toFixed(2));
        calculatedPrices.doji.sell = parseFloat(sell.toFixed(2));
      }
    }

    // Tứ Quý (Tùng/Cúc/Trúc/Mai) tròn 1 chỉ -> bt24k line
    const tuQuyOneChi = findByName(
      (n) => /(tùng|cúc|trúc|mai) tròn/.test(n) && n.includes("1 chỉ") && !n.includes("0.1")
    );
    if (tuQuyOneChi) {
      const priceOneChi = tuQuyOneChi.special_price ?? tuQuyOneChi.price ?? 0;
      const sell = priceVNDToMillion(priceOneChi) * 10;
      if (sell > 0) {
        calculatedPrices.pnj.buy = parseFloat((sell - 1.2).toFixed(2));
        calculatedPrices.pnj.sell = parseFloat(sell.toFixed(2));
      }
    }

    // No SJC bar data on this page -> keep default sjc values
  } catch (e) {
    console.warn("[BTMH] scraping error:", e);
  }

  if (scrapedList.length === 0) {
    scrapedList = [
      {
        title: "Nhẫn tròn ép vỉ Kim Gia Bảo 24K - 1 chỉ",
        priceRaw: "14.700.000 VNĐ",
        priceMin: 14.7,
        url: `${BASE_URL}/vi/san-pham/nhan-tron-ep-vi-kim-gia-bao`,
        image: `${BASE_URL}/uploads/logo/logo-btmh.png`,
      },
      {
        title: "Nhẫn tròn ép vỉ Kim Gia Bảo 24K - 2 chỉ",
        priceRaw: "29.400.000 VNĐ",
        priceMin: 29.4,
        url: `${BASE_URL}/vi/san-pham/nhan-tron-ep-vi-kim-gia-bao`,
        image: `${BASE_URL}/uploads/logo/logo-btmh.png`,
      },
      {
        title: "Nhẫn tròn ép vỉ Kim Gia Bảo 24K - 5 chỉ",
        priceRaw: "73.500.000 VNĐ",
        priceMin: 73.5,
        url: `${BASE_URL}/vi/san-pham/nhan-tron-ep-vi-kim-gia-bao`,
        image: `${BASE_URL}/uploads/logo/logo-btmh.png`,
      },
    ];
  }

  return {
    prices: calculatedPrices,
    crawledProducts: scrapedList,
    news: hotNews,
  };
}