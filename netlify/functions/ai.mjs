import { GoogleGenAI } from "@google/genai";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const getRoute = (event) => {
  const path = event.path || "";
  return path.split("/").filter(Boolean).pop();
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const ai = getAI();
  if (!ai) {
    return json(500, { error: "Gemini API key not configured on server" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  try {
    const route = getRoute(event);

    if (route === "generate-text") {
      const { prompt, systemInstruction } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { systemInstruction },
      });
      return json(200, { text: response.text || "" });
    }

    if (route === "generate-image") {
      const { prompt, aspectRatio = "1:1" } = payload;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { imageConfig: { aspectRatio } },
      });

      const part = response.candidates?.[0]?.content?.parts?.find((item) => item.inlineData);
      if (part?.inlineData) {
        return json(200, { image: `data:image/png;base64,${part.inlineData.data}` });
      }
      return json(400, { error: "No image data returned from AI" });
    }

    if (route === "edit-image") {
      const { base64Image, prompt, aspectRatio = "1:1" } = payload;
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
        config: { imageConfig: { aspectRatio } },
      });

      const part = response.candidates?.[0]?.content?.parts?.find((item) => item.inlineData);
      if (part?.inlineData) {
        return json(200, { image: `data:image/png;base64,${part.inlineData.data}` });
      }
      return json(400, { error: "No edited image data returned from AI" });
    }

    return json(404, { error: "AI route not found" });
  } catch (error) {
    console.error("AI function error:", error);
    return json(500, { error: error instanceof Error ? error.message : "AI server error" });
  }
};
