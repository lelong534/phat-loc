import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import goldPricesHandler from "./api/gold-prices";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount VnExpress gold-prices API locally
  app.get("/api/gold-prices", (req: Request, res: Response) => {
    goldPricesHandler(req, res).catch((err) => {
      console.error("Local API Gold Prices error:", err);
      res.status(500).json({ error: "Thất bại khi lấy giá vàng" });
    });
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Chạy chế độ development với Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Chạy chế độ production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Server hoạt động tại http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Lỗi không thể khởi động server:", err);
});
