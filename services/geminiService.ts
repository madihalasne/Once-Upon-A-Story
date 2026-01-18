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
export const generateStoryContent = async (prompt: string): Promise<{
  story: string;
  quote: string;
  poetry: string;
  lore: string;
  characterLore: string;
}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.85,
        responseMimeType: "application/json",
        systemInstruction: `
          You are a poetic narrator for a children's fairy tale book.
          Follow the user prompt and adapt freely.
          ONLY output story, quote, poetry, lore, and characterLore.
          Do NOT include warnings or notifications.
          Keep a gentle and whimsical tone.
        `
      }
    });

    const data = JSON.parse(response.text || "{}");

    // Strip unwanted notifications if present
    if (data.story) {
      data.story = data.story.replace(
        /one notification pops up\. The story is resisting change[\s\S]*$/i,
        ""
      );
    }

    return {
      story: data.story || FALLBACK_CONTENT.story,
      quote: data.quote || FALLBACK_CONTENT.quote,
      poetry: data.poetry || FALLBACK_CONTENT.poetry,
      lore: data.lore || FALLBACK_CONTENT.lore,
      characterLore: data.characterLore || FALLBACK_CONTENT.characterLore
    };
  } catch (e) {
    console.warn("Story generation failed, using fallback:", e);
    return FALLBACK_CONTENT;
  }
};

// ================== IMAGE ==================
export const generateStoryImage = async (storyText: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `A soft, delicate watercolor illustration in the style of Beatrix Potter. Scene: ${storyText}. Soft pastel colors, fine ink line work, warm cream background, charming and nostalgic.`
          }
        ]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

   for (const part of response.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    // FIX: convert Uint8Array to base64 if needed
    let base64String = part.inlineData.data;
    if (base64String instanceof Uint8Array) {
      base64String = Buffer.from(base64String).toString('base64');
    }
    return `data:image/png;base64,${base64String}`;
  }
}

    // fallback image
    return "https://via.placeholder.com/400x400.png?text=Story+Image";
  } catch (e) {
    console.warn("Image generation failed, using placeholder:", e);
    return "https://via.placeholder.com/400x400.png?text=Story+Image";
  }
};

// ================== EDIT IMAGE ==================
export const editImageWithPrompt = async (base64Image: string, editPrompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: "image/png" } },
          {
            text: `Gently update this watercolor illustration to reflect a happy, warm ending: ${editPrompt}. Keep the classic storybook style, add more sunshine and joy.`
          }
        ]
      }
    });

   for (const part of response.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    let base64String = part.inlineData.data;
    if (base64String instanceof Uint8Array) {
      base64String = Buffer.from(base64String).toString('base64');
    }
    return `data:image/png;base64,${base64String}`;
  }
}
catch (e) {
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
