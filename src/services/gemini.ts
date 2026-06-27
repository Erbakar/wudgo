const tryServerProxy = async (url: string, body: object): Promise<any> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!isJson) {
    throw new Error("AI sunucu rotası JSON döndürmedi. Netlify Function yapılandırmasını kontrol edin.");
  }

  if (response.ok) {
    return await response.json();
  }

  const errorData = await response.json().catch(() => ({ error: "Sunucu hatası" }));
  throw new Error(errorData.error || "Sunucu hatası");
};

export const generateText = async (prompt: string, systemInstruction?: string) => {
  try {
    const data = await tryServerProxy("/api/ai/generate-text", { prompt, systemInstruction });
    return data.text || "";
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
    const data = await tryServerProxy("/api/ai/generate-image", { prompt, aspectRatio });
    return data.image;
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
    const data = await tryServerProxy("/api/ai/edit-image", { base64Image, prompt, aspectRatio });
    return data.image;
  } catch (error: any) {
    console.error("Error editing image:", error);
    throw error;
  }
};
