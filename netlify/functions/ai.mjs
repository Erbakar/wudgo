import { GoogleGenAI } from "@google/genai";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const textModel = process.env.GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
const imageModel = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

const getRoute = (event) => {
  const path = event.path || "";
  return path.split("/").filter(Boolean).pop();
};

const getErrorResponse = (error) => {
  const rawMessage = error instanceof Error ? error.message : "AI server error";

  try {
    const parsed = JSON.parse(rawMessage);
    const googleError = parsed.error;
    if (googleError?.status === "RESOURCE_EXHAUSTED") {
      return json(429, {
        error:
          "Gemini quota exceeded for the selected model. Check the Google AI project billing/quota settings.",
      });
    }

    if (googleError?.code) {
      return json(googleError.code, { error: googleError.message || rawMessage });
    }
  } catch {
    // The SDK sometimes throws regular Error messages instead of JSON payloads.
  }

  return json(500, { error: rawMessage });
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
        model: textModel,
        contents: prompt,
        config: { systemInstruction },
      });
      return json(200, { text: response.text || "" });
    }

    if (route === "generate-image") {
      const { prompt, aspectRatio = "1:1" } = payload;
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: prompt,
        config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio } },
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
        model: imageModel,
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
        config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio } },
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
    return getErrorResponse(error);
  }
};
