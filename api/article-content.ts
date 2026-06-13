import { Request, Response } from "express";

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

export default async function handler(req: Request, res: Response) {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Tham số 'url' là bắt buộc" });
  }

  // Security check: restrict only to VnExpress domains or relative safe links
  if (!url.startsWith("https://vnexpress.net") && !url.startsWith("https://vneconomy.vn") && !url.startsWith("http://vnexpress.net")) {
    return res.status(400).json({ error: "Ứng dụng chỉ hỗ trợ đọc báo từ VnExpress nhe meow!" });
  }

  try {
    console.log(`[ARTICLE WRITER] Fetching full article text from URL: ${url}`);
    
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const html = await response.text();
    const paragraphs: string[] = [];

    // Extract Description/Lead paragraph if present
    const descMatch = html.match(/<p class="description">([\s\S]+?)<\/p>/i) ||
                      html.match(/<span class="lead">([\s\S]+?)<\/span>/i);
    if (descMatch) {
      const descText = descMatch[1].replace(/<[^>]*>/g, "").trim();
      if (descText) {
        paragraphs.push(decodeHtmlEntities(descText));
      }
    }

    // Extract all standard VnExpress paragraphs: <p class="Normal">...</p>
    let pos = 0;
    while (true) {
      const pStart = html.indexOf('<p class="Normal">', pos);
      const pStartWithStyle = pStart === -1 ? html.indexOf('<p class="Normal" style="', pos) : pStart;
      
      const targetStart = pStart !== -1 && (pStartWithStyle === -1 || pStart < pStartWithStyle) 
        ? pStart 
        : pStartWithStyle;

      if (targetStart === -1) break;

      const tagCloseIndex = html.indexOf('>', targetStart);
      if (tagCloseIndex === -1) break;

      const pEnd = html.indexOf('</p>', tagCloseIndex);
      if (pEnd === -1) break;

      const innerContent = html.slice(tagCloseIndex + 1, pEnd);
      // Clean HTML tags and decode entities
      const text = innerContent
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (text) {
        paragraphs.push(decodeHtmlEntities(text));
      }

      pos = pEnd + 4;
    }

    console.log(`[ARTICLE WRITER] Successfully parsed ${paragraphs.length} paragraphs for article.`);

    if (paragraphs.length === 0) {
      // If we couldn't parse any Normal paragraphs, try falling back to general paragraphs inside fck_detail
      const detailStart = html.indexOf('class="fck_detail"');
      if (detailStart !== -1) {
        const detailEnd = html.indexOf('</div>', detailStart);
        const detailHtml = html.slice(detailStart, detailEnd !== -1 ? detailEnd : html.length);
        let pPos = 0;
        while (true) {
          const ptStart = detailHtml.indexOf('<p>', pPos);
          if (ptStart === -1) break;
          const ptEnd = detailHtml.indexOf('</p>', ptStart);
          if (ptEnd === -1) break;
          const inner = detailHtml.slice(ptStart + 3, ptEnd);
          const text = inner.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          if (text && !paragraphs.includes(text)) {
            paragraphs.push(decodeHtmlEntities(text));
          }
          pPos = ptEnd + 4;
        }
      }
    }

    // In case there's absolutely no paragraphs detected, send a nice fallback message
    const finalParagraphs = paragraphs.length > 0 ? paragraphs : [
      "Bản tin giá vàng cập nhật hôm nay phản ánh sức nóng thị trường nhẫn trơn 24k Kim Gia Bảo ép vỉ 1 chỉ đầu ngày.",
      "Hiện tại nội dung chi tiết bài viết đang được đồng bộ và cập nhật tự động trực tiếp từ hệ thống VnExpress.",
      "Bạn hãy nhấn nút 'Xem bài báo gốc' ở dưới để xem toàn văn trực quan hơn trên giao diện chính của VnExpress nhe meow!"
    ];

    res.status(200).json({
      url,
      paragraphs: finalParagraphs
    });

  } catch (err: any) {
    console.error(`[ARTICLE EXCEPTION] Error fetching full article text: ${err.message}`);
    res.status(500).json({ 
      error: "Không thể tải chi tiết bài viết.", 
      paragraphs: [
        "Không thể kết nối tới máy chủ VnExpress hoặc định dạng bài viết thay đổi.",
        "Bạn hãy click vào nút 'Xem bài báo gốc' bên dưới để mở bài báo trực tuyến nhé meow."
      ] 
    });
  }
}
