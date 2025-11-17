
import { GoogleGenAI, Modality } from '@google/genai';
import type { ChatMessage, AspectRatio, ChatModel } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Some features may not work.");
}

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILS ---
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

// --- CHAT API ---
export const streamChat = (history: ChatMessage[], newMessage: string, modelType: ChatModel, useGrounding: boolean, location: { latitude: number, longitude: number } | null) => {
  const ai = getAIClient();
  const model = {
    'lite': 'gemini-flash-lite-latest',
    'flash': 'gemini-2.5-flash',
    'pro': 'gemini-2.5-pro',
  }[modelType];

  const chat = ai.chats.create({
    model,
    history,
    config: {
      ...(modelType === 'pro' && { thinkingConfig: { thinkingBudget: 32768 } }),
      ...(useGrounding && { tools: [{ googleSearch: {} }, { googleMaps: {} }] }),
    },
    ...(useGrounding && location && { toolConfig: { retrievalConfig: { latLng: location } } })
  });
  return chat.sendMessageStream({ message: newMessage });
};

// --- IMAGE API ---
export const generateImage = async (prompt: string, aspectRatio: AspectRatio) => {
  const ai = getAIClient();
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio,
    },
  });
  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (prompt: string, imageFile: File) => {
    const ai = getAIClient();
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [imagePart, { text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error('No image generated');
};

export const analyzeImage = async (prompt: string, imageFile: File) => {
    const ai = getAIClient();
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text;
};

// --- VIDEO API ---
export const generateVideo = async (prompt: string, imageFile: File | null) => {
    const ai = getAIClient(); // Always create a fresh client for Veo
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        ...(imageFile && { image: await fileToGenerativePart(imageFile) }),
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9',
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    }
    throw new Error('Video generation failed or returned no URI.');
};

// --- LIVE API ---
export const connectLive = (callbacks: any) => {
    const ai = getAIClient();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: 'You are Kaku, a friendly and helpful AI assistant for Kaku Technologies.',
        },
    });
};
