import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", market: "Chile", currency: "UF" });
});

// Mock Market Data API
app.get("/api/market-stats", (req, res) => {
  res.json([
    { commune: "Concepción", avgPriceUF: 4500, trend: "+1.5%" },
    { commune: "San Pedro de la Paz", avgPriceUF: 5200, trend: "+2.1%" },
    { commune: "Talcahuano", avgPriceUF: 3100, trend: "+0.8%" },
    { commune: "Chiguayante", avgPriceUF: 3800, trend: "+1.2%" },
    { commune: "Las Condes", avgPriceUF: 12500, trend: "+2.4%" },
    { commune: "Vitacura", avgPriceUF: 15800, trend: "+1.2%" },
  ]);
});

async function setupServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running in a serverless environment (like Vercel)
  if (process.env.VERCEL !== "1") {
    const PORT = parseInt(process.env.PORT || "3000", 10);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Prop value Chile Server running on http://localhost:${PORT}`);
    });
  }
}

setupServer();

export default app;
