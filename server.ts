import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Global Exception Handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

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

// Proxy for UF value to avoid CORS
app.get("/api/uf", async (req, res) => {
  try {
    console.log("Fetching UF from mindicador...");
    
    // Check if global fetch is available (Node 18+)
    if (typeof fetch !== 'function') {
      console.warn("Global fetch not available, using fallback UF value");
      return res.json({ serie: [{ valor: 38500 }] });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch('https://mindicador.cl/api/uf', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Mindicador returned status ${response.status}`);
        return res.json({ serie: [{ valor: 38500 }] });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn("UF fetch timed out, using fallback");
      } else {
        console.error('Error fetching UF from mindicador:', fetchError);
      }
      res.json({ serie: [{ valor: 38500 }] });
    }
  } catch (error) {
    console.error('Error in /api/uf route:', error);
    res.json({ serie: [{ valor: 38500 }] });
  }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

async function setupServer() {
  console.log("Starting server setup...");
  console.log("Environment:", process.env.NODE_ENV || "development");
  console.log("Gemini API Key present:", !!process.env.GEMINI_API_KEY);

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

setupServer().catch(err => {
  console.error("Failed to setup server:", err);
});

export default app;
