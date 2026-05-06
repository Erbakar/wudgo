import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    // Try to get key from multiple possible sources
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                   (import.meta as any).env?.GEMINI_API_KEY || 
                   "AIzaSyDrSupsS8lA3FC3-1GNEDA9qGiLkwCDUlE"; // User provided backup key
    
    if (!apiKey) {
      console.warn("GEMINI_API_KEY missing. Check environment variables.");
      return null;
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const generateText = async (prompt: string, systemInstruction?: string) => {
  try {
    const ai = getAI();
    if (!ai) throw new Error("API Key not configured");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};

export const generateImage = async (
  prompt: string, 
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1"
) => {
  try {
    const ai = getAI();
    if (!ai) throw new Error("API Key not configured");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("AI yanıtı beklenen formatta değil");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("AI görsel verisi döndürmedi");
  } catch (error) {
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
    const ai = getAI();
    if (!ai) throw new Error("API Key not configured");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(",")[1],
              mimeType: "image/png",
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("AI yanıtı beklenen formatta değil");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("AI düzenlenmiş görsel verisi döndürmedi");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};
