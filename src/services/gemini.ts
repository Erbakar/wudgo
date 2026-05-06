import { GoogleGenAI } from "@google/genai";

// Try to get key from multiple possible sources for client-side fallback
const getClientAI = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 (import.meta as any).env?.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("Client fallback key (VITE_GEMINI_API_KEY) missing. Server proxy might be required.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Gemini client service with automatic server-proxy to client-fallback logic
export const generateText = async (prompt: string, systemInstruction?: string) => {
  try {
    // 1. Try Server Proxy first
    try {
      const response = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, systemInstruction }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.text || "";
      }
      
      // If server returns 404, we'll try client fallback
      if (response.status !== 404) {
        const errorData = await response.json().catch(() => ({ error: "Sunucu hatası" }));
        throw new Error(errorData.error || "Sunucu hatası");
      }
    } catch (serverError: any) {
      if (!serverError.message?.includes("404")) throw serverError;
      console.log("Server proxy not found (404), trying client fallback...");
    }

    // 2. Client Side Fallback (for static hosting like Netlify)
    const ai = getClientAI();
    if (!ai) throw new Error("Sunucu API rotası bulunamadı ve istemci için VITE_GEMINI_API_KEY yapılandırılmamış.");

    const response = await (ai as any).models.generateContent({ 
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { systemInstruction } 
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Error generating text:", error);
    throw error;
  }
};

export const generateImage = async (
  prompt: string, 
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1"
) => {
  try {
    // 1. Try Server Proxy
    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.image;
      }

      if (response.status !== 404) {
        const errorData = await response.json().catch(() => ({ error: "Görsel oluşturma hatası" }));
        throw new Error(errorData.error || "Görsel oluşturma hatası");
      }
    } catch (serverError: any) {
      if (!serverError.message?.includes("404")) throw serverError;
      console.log("Server proxy not found (404), trying client fallback...");
    }

    // 2. Client Side Fallback
    const ai = getClientAI();
    if (!ai) throw new Error("Görsel oluşturma servisi bulunamadı ve istemci anahtarı eksik.");

    const response = await (ai as any).models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        imageConfig: { aspectRatio }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("AI görsel verisi döndürmedi");
  } catch (error: any) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const editImage = async (
  base64Image: string, 
  prompt: string,
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1"
) => {
  try {
    // 1. Try Server Proxy
    try {
      const response = await fetch("/api/ai/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image, prompt, aspectRatio }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.image;
      }

      if (response.status !== 404) {
        const errorData = await response.json().catch(() => ({ error: "Görsel düzenleme hatası" }));
        throw new Error(errorData.error || "Görsel düzenleme hatası");
      }
    } catch (serverError: any) {
      if (!serverError.message?.includes("404")) throw serverError;
      console.log("Server proxy not found (404), trying client fallback...");
    }

    // 2. Client Side Fallback
    const ai = getClientAI();
    if (!ai) throw new Error("Görsel düzenleme servisi bulunamadı ve istemci anahtarı eksik.");

    const response = await (ai as any).models.generateContent({
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

    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("AI düzenlenmiş görsel verisi döndürmedi");
  } catch (error: any) {
    console.error("Error editing image:", error);
    throw error;
  }
};
