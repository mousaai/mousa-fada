import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { notifyMousaPricing } from "../mousa";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // ===== Image Proxy - لتحميل صور المنتجات بـ Referer صحيح =====
  app.get("/api/image-proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).send("Missing url parameter");
    }
    // التحقق من أن الرابط من مصادر موثوقة فقط
    const allowedDomains = [
      "ikea.com", "ikeacdn.com", "ingka.com",
      "danubehome.com",
      "panhome.com",
      "indigoliving.com",
      "loomcollection.com",
      "furn.com",
      "bloomr.ae",
      "homecentre.com",
      "2xlhome.com",
      "marinahome.com",
      "bonyan.co", "bonyanpltf",
      "media.bonyan", "cdn.bonyan",
      "potterybarn.ae", "westelm.ae",
      "homesrus.com", "theone.com",
      "pinkyfurniture.com",
      "cloudfront.net", "amazonaws.com",
      "imgix.net", "shopify.com",
    ];
    let isAllowed = false;
    try {
      const parsed = new URL(url);
      isAllowed = allowedDomains.some(d => parsed.hostname.includes(d));
    } catch {
      return res.status(400).send("Invalid URL");
    }
    if (!isAllowed) {
      return res.status(403).send("Domain not allowed");
    }
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": new URL(url).origin + "/",
          "Accept": "image/webp,image/avif,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch image");
      }
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = await response.arrayBuffer();
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400"); // cache 24h
      res.set("Access-Control-Allow-Origin", "*");
      return res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Image proxy error:", err);
      return res.status(500).send("Proxy error");
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // إبلاغ Mousa.ai بالأسعار الحالية عند كل بدء خادم
    notifyMousaPricing().catch(err =>
      console.warn("[mousa] Pricing webhook skipped:", err?.message)
    );
  });
}

startServer().catch(console.error);
