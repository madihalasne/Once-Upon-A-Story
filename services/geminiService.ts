import { GoogleGenAI, Modality } from "@google/genai";

// ✅ Use Vite env variable, not process.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// Fallback content if story generation fails
const FALLBACK_CONTENT = {
  story: "Once upon a time in a magical land...",
  quote: "Every journey begins with a single step.",
  poetry: "Gentle winds whisper by,\nSoft clouds drift in the sky,\nStars twinkle high above,\nNight's calm sings a lullaby.",
  lore: "A hidden secret waits in the old library.",
  characterLore: "The hero remembers an old friend from childhood."
};

// ================== STORY ==================
export const generateStoryContent = async (
  prompt: string
): Promise<{ story: string; quote: string; poetry: string; lore: string; characterLore: string }> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY }); 

  try {
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
        systemInstruction: "You are a gentle poetic narrator for a fairy tale book. Provide story, quote, poetry, lore, and characterLore."
      }
    });

    // FIX: Safely return all fields, using defaults if missing
    const data = JSON.parse(response.text || "{}");

    return {
      story: data.story || response.text || "",
      quote: data.quote || "...",
      poetry: data.poetry || "Soft winds whisper through the trees,\nLeaves dance gently with the breeze.\nA tale awaits in morning light,\nTo fill the heart with pure delight.",
      lore: data.lore || "Secrets hide in the folds of forgotten maps.",
      characterLore: data.characterLore || "The character once whispered to the stars."
    };

  } catch (e) {
    console.warn("Story generation failed, using fallback:", e);
    return {
      story: "A gentle story unfolds, but the magic hesitated.",
      quote: "Even dreams need a patient heart.",
      poetry: "Soft winds whisper through the trees,\nLeaves dance gently with the breeze.\nA tale awaits in morning light,\nTo fill the heart with pure delight.",
      lore: "Secrets hide in the folds of forgotten maps.",
      characterLore: "The character once whispered to the stars."
    };
  }
};

// ================== IMAGE ==================
export const generateStoryImage = async (storyText: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          text: `Create a detailed watercolor illustration in the style of Beatrix Potter. Scene: ${storyText}. 
          Focus on soft pastel colors, fine ink line work, charming, whimsical, warm cream background, magical atmosphere.`
        }
      ],
      config: {
        imageConfig: { aspectRatio: "1:1", width: 512, height: 512 } // explicit resolution
      }
    });

    // Try inline data first
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      // If Gemini returns a uri
      if (part.uri) return part.uri;
    }

    console.warn("No image data returned, using placeholder");
    return 'https://picsum.photos/id/20/400/400';

  } catch (e) {
    console.warn("Image generation failed, using placeholder:", e);
    return 'https://picsum.photos/id/20/400/400';
  }
};

// ================== EDIT IMAGE ==================
export const editImageWithPrompt = async (base64Image: string, editPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
        { text: `Gently update this watercolor illustration: ${editPrompt}. Keep classic storybook style, soft light, magical, charming.` }
      ],
      config: { imageConfig: { aspectRatio: "1:1", width: 512, height: 512 } }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      if (part.uri) return part.uri;
    }

    console.warn("Edit image returned no data, using original");
    return base64Image;

  } catch (e) {
    console.warn("Edit image failed, returning original:", e);
    return base64Image;
  }
};

// ================== SPEECH ==================
export const generateSpeech = async (text: string, voiceName = "Kore"): Promise<void> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    }
  } catch (e) {
    console.warn("TTS generation failed:", e);
  }
};

// ================== HELPERS ==================
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// ================== VIDEO ==================
export const generateVeoVideo = async (imageUri: string, prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const cleanBase64 = imageUri.replace(/^data:image\/(png|jpeg);base64,/, "");

    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: `The storybook illustration comes to life: ${prompt}. Subtle movement, magical.`,
      image: { imageBytes: cleanBase64, mimeType: "image/png" },
      config: { numberOfVideos: 1, resolution: "720p", aspectRatio: "16:9" }
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.error("Veo generation failed", e);
  }
  return null;
};
