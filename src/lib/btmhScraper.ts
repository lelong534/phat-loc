import { GoldPriceMap, GoldNews } from "../types";

export interface CrawledProduct {
  title: string;
  priceRaw: string;
  priceMin: number; // parsed price in Million VND per chỉ or lượng
  url: string;
  image: string;
}


/**
 * Parses any Vietnamese price text to Million per Lượng format
 */
function parseToMillionPerLuong(rawText: string): number | null {
  const text = rawText.replace(/<[^>]*>/g, "").trim();
  const normalized = text.replace(/\s+/g, "");
  if (!normalized) return null;

  const dotCount = (normalized.match(/\./g) || []).length;
  const commaCount = (normalized.match(/,/g) || []).length;

  let cleanStr = normalized;
  if (dotCount >= 2) {
    cleanStr = normalized.replace(/\./g, "");
  } else if (commaCount >= 2) {
    cleanStr = normalized.replace(/,/g, "");
  } else if (dotCount === 1 && commaCount === 0) {
    const parts = normalized.split(".");
    if (parts[1].length >= 3) {
      cleanStr = normalized.replace(/\./g, "");
    }
  } else if (commaCount === 1 && dotCount === 0) {
    const parts = normalized.split(",");
    if (parts[1].length >= 3) {
      cleanStr = normalized.replace(/,/g, "");
    } else {
      cleanStr = normalized.replace(/,/g, ".");
    }
  }

  const numMatch = cleanStr.match(/\d+(?:\.\d+)?/);
  if (!numMatch) return null;
  const num = parseFloat(numMatch[0]);

  if (num >= 60000000 && num <= 150000000) {
    return num / 1000000;
  }
  if (num >= 6000000 && num <= 15000000) {
    return num / 100000;
  }
  if (num >= 60000 && num <= 150000) {
    return num / 1000;
  }
  if (num >= 6000 && num <= 15001) {
    return num / 100;
  }
  if (num >= 60 && num <= 150) {
    return num;
  }
  return null;
}

export async function fetchLiveGoldData(): Promise<{
  prices: GoldPriceMap;
  crawledProducts: CrawledProduct[];
  news: GoldNews[];
}> {
  // Free, reliable CORS-evading origin proxy
  const proxyUrl = "https://api.allorigins.win/get?url=";
  const tichLuyUrl = "https://baotinmanhhai.vn/vi/vang-tich-luy";
  const nhanTronUrl = "https://baotinmanhhai.vn/vi/san-pham/nhan-tron-ep-vi-kim-gia-bao";

  const defaultPrices: GoldPriceMap = {
    sjc: {
      name: "SJC Bảo Tín Mạnh Hải",
      buy: 83.00,
      sell: 85.00,
      yesterdayChange: 0.15,
      code: "SJC-BTMH",
      history: [82.1, 82.3, 82.8, 83.0, 83.1, 82.9, 83.0]
    },
    doji: {
      name: "Nhẫn trơn Kim Gia Bảo 24K",
      buy: 74.60,
      sell: 75.80,
      yesterdayChange: 0.25,
      code: "KGB-BTMH",
      history: [73.8, 74.0, 74.2, 74.5, 74.6, 74.4, 74.6]
    },
    pnj: {
      name: "Nhẫn tròn 999.9 BTMH",
      buy: 74.30,
      sell: 75.50,
      yesterdayChange: 0.20,
      code: "BT24K-BTMH",
      history: [73.5, 73.7, 73.9, 74.1, 74.3, 74.1, 74.3]
    }
  };

  const hotNews: GoldNews[] = [
    {
      id: "1",
      title: "Giá vàng nhẫn Bảo Tín Mạnh Hải tiếp tục tạo sóng tích lũy, người dân Hà Nội nhộn nhịp mua sắm đầu năm",
      time: "2 giờ trước",
      source: "Trực tuyến Tài Chính BTMH",
      sentiment: "positive"
    },
    {
      id: "2",
      title: "Đồng vàng Kim Gia Bảo 'Hoa Sen' và Nhẫn tròn ép vỉ ghi nhận kỷ lục giao dịch mới làm két của Sen béo chật cứng",
      time: "5 giờ trước",
      source: "Gia Bảo Tin Tức",
      sentiment: "positive"
    },
    {
      id: "3",
      title: "Mèo Thần Tài khuyên: 'Tích vàng Bảo Tín phòng thân là quốc sách, chớ có lướt sóng kẻo mất pate ngon!'",
      time: "Vừa xong",
      source: "Mèo Vàng Tiên Tri",
      sentiment: "neutral"
    }
  ];

  let calculatedPrices = { ...defaultPrices };
  let scrapedList: CrawledProduct[] = [];

  try {
    // 1. Fetch Pages via AllOrigins CORS proxy with caching avoided
    const targetTichLuy = `${tichLuyUrl}?nocache=${Date.now()}`;
    const targetNhanTron = `${nhanTronUrl}?nocache=${Date.now()}`;

    const [tlResponse, ntResponse] = await Promise.all([
      fetch(`${proxyUrl}${encodeURIComponent(targetTichLuy)}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${proxyUrl}${encodeURIComponent(targetNhanTron)}`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const tichLuyText = tlResponse?.contents || "";
    const nhanTronText = ntResponse?.contents || "";

    let sjcBuy = 0;
    let sjcSell = 0;
    let kgbBuy = 0;
    let kgbSell = 0;
    let bt24kBuy = 0;
    let bt24kSell = 0;
    const fallbackSpread = 1.2;

    const sourceTexts = [tichLuyText, nhanTronText].filter(Boolean);

    for (const html of sourceTexts) {
      // Parse table rows
      const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
      for (const row of rows) {
        const cells = row.match(/<td\b[^>]*>[\s\S]*?<\/td>/gi) || [];
        if (cells.length >= 3) {
          const nameText = cells[0].replace(/<[^>]*>/g, "").trim().toLowerCase();
          
          const isSJCRow = nameText.includes("sjc") && !nameText.includes("nhẫn") && !nameText.includes("kgb");
          const isKGBRow = nameText.includes("kim gia bảo") || nameText.includes("kgb") || nameText.includes("gia bảo");
          const isBT24KRow = (nameText.includes("nhẫn tròn") || nameText.includes("tròn trơn") || nameText.includes("bt24k") || nameText.includes("9999") || nameText.includes("vtlt")) && !isKGBRow && !isSJCRow;
          
          if (isSJCRow || isKGBRow || isBT24KRow) {
            const parsedBuy = parseToMillionPerLuong(cells[1]);
            const parsedSell = parseToMillionPerLuong(cells[2]);
            
            if (parsedBuy && parsedSell && parsedBuy < parsedSell && parsedBuy >= 50 && parsedSell <= 220) {
              if (isSJCRow && sjcBuy === 0) {
                sjcBuy = parsedBuy;
                sjcSell = parsedSell;
              } else if (isKGBRow && kgbBuy === 0) {
                kgbBuy = parsedBuy;
                kgbSell = parsedSell;
              } else if (isBT24KRow && bt24kBuy === 0) {
                bt24kBuy = parsedBuy;
                bt24kSell = parsedSell;
              }
            }
          }
        }
      }

      // Safe Regex fallback patterns
      if (sjcBuy === 0) {
        const sjcMatch = html.match(/SJC9999\\*"\s*,\s*\\*"([^\\*"]+)\\*"\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (sjcMatch) {
          sjcBuy = parseInt(sjcMatch[2], 10) / 100000;
          sjcSell = parseInt(sjcMatch[3], 10) / 100000;
        }
      }

      if (kgbBuy === 0) {
        const kgbMatch = html.match(/KGB\\*"\s*,\s*\\*"([^\\*"]+)\\*"\s*,\s*(\d+)/i);
        if (kgbMatch) {
          kgbBuy = parseInt(kgbMatch[2], 10) / 100000;
          const idx = html.indexOf(kgbMatch[0]);
          if (idx !== -1) {
            const snippet = html.slice(idx, idx + 500);
            const nums = [...snippet.matchAll(/,(\d+)(?:,|$|\])/g)].map(x => parseInt(x[1], 10));
            const possibleSell = nums.find(n => n >= 6500000 && n <= 9500000 && n !== (kgbBuy * 100000));
            if (possibleSell) kgbSell = possibleSell / 100000;
            else kgbSell = kgbBuy + fallbackSpread;
          }
        }
      }

      if (bt24kBuy === 0) {
        const bt24kMatch = html.match(/BT24K\\*"\s*,\s*\\*"([^\\*"]+)\\*"\s*,\s*(\d+)/i);
        if (bt24kMatch) {
          bt24kBuy = parseInt(bt24kMatch[2], 10) / 100000;
          const idx = html.indexOf(bt24kMatch[0]);
          if (idx !== -1) {
            const snippet = html.slice(idx, idx + 500);
            const nums = [...snippet.matchAll(/,(\d+)(?:,|$|\])/g)].map(x => parseInt(x[1], 10));
            const possibleSell = nums.find(n => n >= 6500000 && n <= 9500000 && n !== (bt24kBuy * 100000));
            if (possibleSell) bt24kSell = possibleSell / 100000;
            else bt24kSell = bt24kBuy + fallbackSpread;
          }
        }
      }
    }

    const productsFound = new Set<string>();

    // Parse product cards from Nhấn Tròn page
    if (nhanTronText) {
      let seekIdx = 0;
      while (true) {
        const foundIdx = nhanTronText.indexOf('data-slot="card"', seekIdx);
        const altFoundIdx = nhanTronText.indexOf("data-slot='card'", seekIdx);
        let targetIdx = -1;
        if (foundIdx !== -1 && altFoundIdx !== -1) {
          targetIdx = Math.min(foundIdx, altFoundIdx);
        } else {
          targetIdx = foundIdx !== -1 ? foundIdx : altFoundIdx;
        }
        if (targetIdx === -1) break;

        const snippet = nhanTronText.slice(targetIdx, targetIdx + 1500);
        seekIdx = targetIdx + 16;

        const nameMatch = snippet.match(/class=["'][^"']*text-text-label[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                          snippet.match(/class=["'][^"']*text-text-label[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
        
        const priceMatch = snippet.match(/class=["'][^"']*text-secondary-red[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                           snippet.match(/class=["'][^"']*text-secondary-red[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);

        if (nameMatch && priceMatch) {
          const rawTitle = nameMatch[1].replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ");
          const rawPrice = priceMatch[1].replace(/<[^>]*>/g, "").trim();
          
          if (rawTitle && rawPrice && !productsFound.has(rawTitle)) {
            const numericPrice = parseInt(rawPrice.replace(/[^0-9]/g, ""), 10);
            if (numericPrice > 0) {
              const priceMin = numericPrice / 1000000;
              productsFound.add(rawTitle);
              scrapedList.push({
                title: rawTitle,
                priceRaw: rawPrice,
                priceMin: priceMin,
                url: nhanTronUrl,
                image: "https://baotinmanhhai.vn/uploads/logo/logo-btmh.png"
              });
            }
          }
        }
      }
    }

    // Parse general products from Tích Lũy page
    if (tichLuyText) {
      const blocks = tichLuyText.match(/<div\b[^>]*?(?:product-item|product-box|col-xs|card-product|product-grid|product_item|item-product|product-catalog-card|product-cart-item|layout-item-product|item|product)[^>]*>([\s\S]*?)<\/div\s*>/gi) || [];
      for (const block of blocks) {
        const hrefMatch = block.match(/href="([^"]*\/san-pham\/[^"]*)"/i);
        if (!hrefMatch) continue;
        const productUrl = hrefMatch[1];
        
        let title = "";
        const titleMatch1 = block.match(/<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/i) || block.match(/<a\b[^>]*class="[^"]*(?:title|name)[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        const titleMatch2 = block.match(/title="([^"]+)"/i);
        const titleMatch3 = block.match(/alt="([^"]+)"/i);
        
        if (titleMatch1) {
          title = titleMatch1[1].replace(/<[^>]*>/g, "").trim();
        } else if (titleMatch2) {
          title = titleMatch2[1].trim();
        } else if (titleMatch3) {
          title = titleMatch3[1].trim();
        }
        
        const titleClean = title.replace(/\s+/g, " ").trim();
        if (!titleClean || productsFound.has(titleClean)) continue;

        const titleLower = titleClean.toLowerCase();
        if (!titleLower.includes("kim gia") && !titleLower.includes("vàng") && !titleLower.includes("nhẫn") && !titleLower.includes("tròn") && !titleLower.includes("trơn") && !titleLower.includes("ép vỉ") && !titleLower.includes("ep vi")) {
          continue; 
        }
        
        productsFound.add(titleClean);
        
        let image = "";
        const imgMatch = block.match(/src="([^"]*(?:uploads|images|cdn|product)[^"]*)"/i) || block.match(/data-src="([^"]*)"/i);
        if (imgMatch) {
          image = imgMatch[1];
          if (image.startsWith("/")) {
            image = "https://baotinmanhhai.vn" + image;
          }
        } else {
          image = "https://baotinmanhhai.vn/uploads/logo/logo-btmh.png";
        }
        
        let priceRaw = "Liên hệ";
        let priceMin = 0;
        
        const priceMatches = [...block.matchAll(/(?:\d{1,3}[.,]\d{3}[.,]\d{3})/g)];
        if (priceMatches.length > 0) {
          const validPrices = priceMatches.map(m => {
            const rawVal = m[0].replace(/[.,]/g, "");
            return parseInt(rawVal, 10);
          }).filter(val => val >= 1000000 && val <= 180000000);
          
          if (validPrices.length > 0) {
            const lowestPrice = Math.min(...validPrices);
            priceMin = lowestPrice / 1000000;
            priceRaw = lowestPrice.toLocaleString("vi-VN") + " đ";
          }
        }
        
        scrapedList.push({
          title: titleClean,
          priceRaw,
          priceMin,
          url: productUrl.startsWith("/") ? "https://baotinmanhhai.vn" + productUrl : productUrl,
          image
        });
      }
    }

    // Default values fallback or resolved integration
    if (scrapedList.length > 0) {
      // Find Kim Gia Bảo item to refine kgb price
      const kgbItem = scrapedList.find(p => p.title.toLowerCase().includes("kim gia bảo") && (p.title.toLowerCase().includes("1 chỉ") || p.title.toLowerCase().includes("chỉ") || (p.priceMin >= 6.0 && p.priceMin <= 25.0)));
      if (kgbItem && kgbItem.priceMin > 0) {
        let valChỉ = kgbItem.priceMin;
        if (kgbItem.title.toLowerCase().includes("10 chỉ")) {
          valChỉ = kgbItem.priceMin / 10;
        } else if (kgbItem.title.toLowerCase().includes("5 chỉ")) {
          valChỉ = kgbItem.priceMin / 5;
        } else if (kgbItem.title.toLowerCase().includes("2 chỉ")) {
          valChỉ = kgbItem.priceMin / 2;
        } else if (kgbItem.title.toLowerCase().includes("3 chỉ")) {
          valChỉ = kgbItem.priceMin / 3;
        } else if (kgbItem.title.toLowerCase().includes("0.5 chỉ")) {
          valChỉ = kgbItem.priceMin * 2;
        }
        const resolvedSell = valChỉ * 10;
        if (resolvedSell >= 50 && resolvedSell <= 220) {
          kgbSell = resolvedSell;
          if (kgbBuy === 0 || kgbBuy >= kgbSell) {
            kgbBuy = kgbSell - fallbackSpread;
          }
        }
      }
    }

    // Apply scraped values if within normal limits
    if (sjcBuy >= 50 && sjcBuy <= 220 && sjcSell >= 50 && sjcSell <= 220) {
      calculatedPrices.sjc.buy = parseFloat(sjcBuy.toFixed(2));
      calculatedPrices.sjc.sell = parseFloat(sjcSell.toFixed(2));
      calculatedPrices.sjc.yesterdayChange = 0.15;
    }
    if (kgbBuy >= 50 && kgbBuy <= 220 && kgbSell >= 50 && kgbSell <= 220) {
      calculatedPrices.doji.buy = parseFloat(kgbBuy.toFixed(2));
      calculatedPrices.doji.sell = parseFloat(kgbSell.toFixed(2));
      calculatedPrices.doji.yesterdayChange = 0.25;
    }
    if (bt24kBuy >= 50 && bt24kBuy <= 220 && bt24kSell >= 50 && bt24kSell <= 220) {
      calculatedPrices.pnj.buy = parseFloat(bt24kBuy.toFixed(2));
      calculatedPrices.pnj.sell = parseFloat(bt24kSell.toFixed(2));
      calculatedPrices.pnj.yesterdayChange = 0.20;
    }

  } catch (e) {
    console.warn("Direct front-end scraping error:", e);
  }

  // If scraped list is empty, fill with standard mock products
  if (scrapedList.length === 0) {
    scrapedList = [
      {
        title: "Nhẫn tròn ép vỉ Kim Gia Bảo 24K - 1 chỉ",
        priceRaw: "13.800.000 đ",
        priceMin: 13.8,
        url: "https://baotinmanhhai.vn/vi/san-pham/nhan-tron-ep-vi-kim-gia-bao",
        image: "https://baotinmanhhai.vn/uploads/logo/logo-btmh.png"
      },
      {
        title: "Nhẫn tròn ép vỉ Kim Gia Bảo 24K - 2 chỉ",
        priceRaw: "27.600.000 đ",
        priceMin: 27.6,
        url: "https://baotinmanhhai.vn/vi/san-pham/nhan-tron-ep-vi-kim-gia-bao",
        image: "https://baotinmanhhai.vn/uploads/logo/logo-btmh.png"
      },
      {
        title: "Nhẫn tròn ép vỉ Kim Gia Bảo 24K - 5 chỉ",
        priceRaw: "69.000.000 đ",
        priceMin: 69.0,
        url: "https://baotinmanhhai.vn/vi/san-pham/nhan-tron-ep-vi-kim-gia-bao",
        image: "https://baotinmanhhai.vn/uploads/logo/logo-btmh.png"
      }
    ];
  }

  return {
    prices: calculatedPrices,
    crawledProducts: scrapedList,
    news: hotNews
  };
}
