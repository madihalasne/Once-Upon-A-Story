import { GoogleGenAI, Type, Modality } from "@google/genai";

// ✅ Use Vite environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// Fallback content to show if API fails
const FALLBACK_CONTENT = {
  story: "Once upon a time in a magical land...",
  quote: "Every journey begins with a single step.",
  poetry: "Gentle winds whisper by,\nSoft clouds drift in the sky,\nStars twinkle high above,\nNight's calm sings a lullaby.",
  lore: "A hidden secret waits in the old library.",
  characterLore: "The hero remembers an old friend from childhood."
};

export const generateStoryContent = async (prompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.85,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            story: { type: Type.STRING },
            quote: { type: Type.STRING },
            poetry: { type: Type.STRING },
            lore: { type: Type.STRING },
            characterLore: { type: Type.STRING }
          },
          required: ["story", "quote", "poetry", "lore", "characterLore"]
        },
        systemInstruction: "You are a poetic narrator for a classic children's fairy tale book. Provide story, quote, poetry, lore, character lore."
      }
    });

    // Attempt to parse the API response
    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    console.warn("Gemini API failed, using fallback content:", err?.message || err);
    return FALLBACK_CONTENT;
  }
};

export const generateStoryImage = async (storyText: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A soft watercolor illustration: ${storyText}` }]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return ""; // fallback blank image
  } catch (err: any) {
    console.warn("Gemini image generation failed:", err?.message || err);
    return ""; // fallback blank image
  }
};

// Example for TTS
export const generateSpeech = async (text: string, voiceName = 'Kore') => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioData = decodeAudio(base64Audio);
      const buffer = await ctx.decodeAudioData(audioData.buffer);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  } catch (err: any) {
    console.warn("Gemini TTS failed:", err?.message || err);
  }
};

// Helper to decode Base64 to Uint8Array
function decodeAudio(base64: string) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
