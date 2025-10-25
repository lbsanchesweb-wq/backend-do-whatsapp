
export interface Product {
  id: string;
  name: string;
  description: string;
  image: string; // base64 string
  productType: string;
  size: string;
  quantity: number;
  productionTime: string;
  isActive: boolean;
}

export interface Settings {
  paymentPolicy: string;
  shippingPolicy: string;
  artBriefingPolicy: string;
}

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp?: string; 
}

export type Page = 'dashboard' | 'products' | 'settings' | 'whatsapp' | 'reports';

// New types for WhatsApp feature
export interface Contact {
    id: string;
    name:string;
    avatar: string; // URL or base64
}

export interface WhatsAppChat {
    id: string;
    contact: Contact;
    messages: ChatMessage[];
    isAiActive: boolean;
    lastMessageTimestamp: string;
}

export interface Report {
    id: string;
    chatId: string;
    contactName: string;
    generatedAt: string;
    summary: string;
}
