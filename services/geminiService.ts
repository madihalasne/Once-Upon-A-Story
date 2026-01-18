
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

export const generateStoryContent = async (prompt: string): Promise<{ story: string, quote: string, poetry: string, lore: string, characterLore: string }> => {
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
          quote: { type: Type.STRING, description: "A short, 1-sentence emotional quote from the character." },
          poetry: { type: Type.STRING, description: "A 4-line rhyming poem reflecting the mood." },
          lore: { type: Type.STRING, description: "A subtle, mysterious piece of backstory or a secret hint about the world (15 words max)." },
          characterLore: { type: Type.STRING, description: "A deeper, intimate secret about the character's past or their unique magic (15 words max)." }
        },
        required: ["story", "quote", "poetry", "lore", "characterLore"]
      },
      systemInstruction: "You are a poetic narrator. The story can adapt freely to user input. Avoid repeating warnings or notifications. Be gentle and whimsical."
    }
  });
  
  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { 
      story: response.text || "", 
      quote: "...", 
      poetry: "Silence falls upon the page,\nLost within a paper cage.",
      lore: "Some secrets are better left unread.",
      characterLore: "The heart remembers what the eyes forget."
    };
  }
};

export const generateStoryImage = async (storyText: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A soft, delicate watercolor illustration in the style of Beatrix Potter. Scene: ${storyText}. Soft pastel colors, fine ink line work, warm cream background, charming and nostalgic.` }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return "";
};

export const editImageWithPrompt = async (base64Image: string, editPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg);base64,/, "");
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
        { text: `Gently update this watercolor illustration to reflect a happy, warm ending: ${editPrompt}. Keep the classic storybook style, add more sunshine and joy.` }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return base64Image;
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();
  }
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
}

export const generateVeoVideo = async (imageUri: string, prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const cleanBase64 = imageUri.replace(/^data:image\/(png|jpeg);base64,/, "");

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `The storybook illustration comes to life: ${prompt}. Subtle movement, magical.`,
      image: {
        imageBytes: cleanBase64,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error("Veo generation failed", error);
  }
  return null;
};
