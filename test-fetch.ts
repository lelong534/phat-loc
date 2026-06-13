function calibratePriceFromNews(titles: string[]): { sjcSell: number | null } {
  let matchedRate: number | null = null;
  
  for (const title of titles) {
    // Look for numbers followed by "triệu" in relation to SJC, lượng, or "vàng giảm/tăng xuống/lên"
    // E.g. "lên trên 145 triệu" or "xuống 138 triệu" or "mốc 150 triệu"
    const regex = /(\d+\.?\d*)\s*triệu/gi;
    let match;
    while ((match = regex.exec(title)) !== null) {
      const num = parseFloat(match[1]);
      if (num >= 80 && num <= 220) { // realistic range of gold price per lượng in Vietnam
        matchedRate = num;
        console.log(`Calibrated SJC Sell rate: ${num}M from title: "${title}"`);
        return { sjcSell: num };
      }
    }
  }

  return { sjcSell: null };
}

const testTitles = [
  "Giá dầu thấp nhất 3 tháng, vàng tăng nhẹ",
  "Mỗi lượng vàng tăng hơn 7 triệu đồng trong ngày... lên trên 145 triệu đồng",
  "Giá vàng thế giới tăng vọt",
  "Giá vàng giảm xuống 138 triệu đồng",
  "Giá vàng miếng về sát mốc 150 triệu đồng"
];

console.log(calibratePriceFromNews(testTitles));
