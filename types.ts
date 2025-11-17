
export interface Product {
  name: string;
  description: string;
  image: string;
  features: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  groundingChunks?: any[];
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export enum DemoTab {
  ASSISTANT = 'Kaku Assistant',
  CREATIVE = 'Creative Suite',
  LIVE = 'Live Conversation',
}

export type ChatModel = 'lite' | 'flash' | 'pro';
