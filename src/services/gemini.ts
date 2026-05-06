// Gemini client service using proxy backend routes for security
export const generateText = async (prompt: string, systemInstruction?: string) => {
  try {
    const response = await fetch("/api/ai/generate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Sunucu hatası");
    }

    const data = await response.json();
    return data.text || "";
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
    const response = await fetch("/api/ai/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspectRatio }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Görsel oluşturma hatası");
    }

    const data = await response.json();
    return data.image;
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
    const response = await fetch("/api/ai/edit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, prompt, aspectRatio }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Görsel düzenleme hatası");
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};
