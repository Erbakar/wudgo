import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for images
  app.use(express.json({ limit: "50mb" }));

  // AI Service Setup
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("AI FAIL: No API key found in GEMINI_API_KEY or VITE_GEMINI_API_KEY");
      return null;
    }
    // Log a masked version for debugging
    console.log(`AI INFO: Initializing with key ending in: ...${apiKey.slice(-4)}`);
    return new GoogleGenAI({ apiKey });
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/ai/generate-text", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const ai = getAI();
      if (!ai) return res.status(500).json({ error: "Gemini API key not configured on server" });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash", // Using stable 2.0 Flash
        contents: prompt,
        config: { systemInstruction },
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Server Text Gen error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio = "1:1" } = req.body;
      const ai = getAI();
      if (!ai) return res.status(500).json({ error: "Gemini API key not configured on server" });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash", // Gemini 2.0 Flash handles images too
        contents: prompt,
        config: {
          imageConfig: { aspectRatio },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        return res.json({ image: `data:image/png;base64,${part.inlineData.data}` });
      }
      res.status(400).json({ error: "No image data returned from AI" });
    } catch (error: any) {
      console.error("Server Image Gen error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/edit-image", async (req, res) => {
    try {
      const { base64Image, prompt, aspectRatio = "1:1" } = req.body;
      const ai = getAI();
      if (!ai) return res.status(500).json({ error: "Gemini API key not configured on server" });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.includes(",") ? base64Image.split(",")[1] : base64Image,
                mimeType: "image/png",
              },
            },
            { text: prompt },
          ],
        },
        config: {
          imageConfig: { aspectRatio },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        return res.json({ image: `data:image/png;base64,${part.inlineData.data}` });
      }
      res.status(400).json({ error: "No edited image data returned from AI" });
    } catch (error: any) {
      console.error("Server Image Edit error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // SPA Fallback: Serve index.html for any unknown routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
