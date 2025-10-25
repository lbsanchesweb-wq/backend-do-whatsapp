import twilio from 'twilio';
import { WhatsAppChat, ChatMessage, ChatRole } from '../types';
import { generateChatResponse } from './chatService';
import { getChats, getProducts, getSettings, saveChats } from '../db';

const { MessagingResponse } = twilio.twiml;

// This function will process the message received and return a response in TwiML
export const handleIncomingMessage = async (from: string, body: string): Promise<string> => {
    const chats = getChats();
    const products = getProducts();
    const settings = getSettings();
    
    // 1. Find the conversation or create a new one
    let chat = chats.find(c => c.contact.id === from);

    if (!chat) {
        const newChat: WhatsAppChat = {
            id: `chat_${new Date().getTime()}`,
            contact: {
                id: from,
                name: `Cliente ${from.slice(-4)}`, // Use the last 4 digits as a name
                avatar: `https://i.pravatar.cc/150?u=${from}`,
            },
            messages: [],
            isAiActive: true, // Starts active by default
            lastMessageTimestamp: new Date().toISOString(),
        };
        chats.unshift(newChat);
        chat = newChat;
    }

    // 2. Add the user's message to the history
    const userMessage: ChatMessage = {
        role: ChatRole.USER,
        content: body,
        timestamp: new Date().toISOString(),
    };
    chat.messages.push(userMessage);
    chat.lastMessageTimestamp = userMessage.timestamp!;

    let aiResponseContent = "O assistente de IA está desativado para esta conversa.";

    // 3. If AI is active, generate a response
    if (chat.isAiActive) {
        aiResponseContent = await generateChatResponse(chat.messages, products, settings);
        
        const aiMessage: ChatMessage = {
            role: ChatRole.ASSISTANT,
            content: aiResponseContent,
            timestamp: new Date().toISOString(),
        };
        chat.messages.push(aiMessage);
        chat.lastMessageTimestamp = aiMessage.timestamp!;
    }

    // IMPORTANT: Persist all chat changes to the file system
    await saveChats();
    
    // 4. Format the response for Twilio using TwiML
    const twiml = new MessagingResponse();
    twiml.message(aiResponseContent);

    return twiml.toString();
};
