import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with the API key provided by the environment
// Vite will replace 'process.env.GEMINI_API_KEY' with the actual value during build
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export const generateText = async (prompt: string, systemInstruction?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};

export const generateImage = async (
  prompt: string, 
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "1:4" | "1:8" | "4:1" | "8:1" = "1:1",
  imageSize: "512px" | "1K" | "2K" | "4K" = "1K"
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize,
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
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "1:4" | "1:8" | "4:1" | "8:1" = "1:1",
  imageSize: "512px" | "1K" | "2K" | "4K" = "1K"
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
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
          imageSize,
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
