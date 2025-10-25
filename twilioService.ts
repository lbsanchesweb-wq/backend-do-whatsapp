import twilio from 'twilio';
import { WhatsAppChat, ChatMessage, ChatRole, Product, Settings } from '../types';
import { generateChatResponse } from './chatService';

// Mocked data storage (in a real app, use a database)
import { chats, products, settings } from '../data';

const { MessagingResponse } = twilio.twiml;

// Esta função irá processar a mensagem recebida e retornar uma resposta em TwiML
export const handleIncomingMessage = async (from: string, body: string): Promise<string> => {
    // 1. Encontrar a conversa ou criar uma nova
    let chat = chats.find(c => c.contact.id === from);

    if (!chat) {
        const newChat: WhatsAppChat = {
            id: `chat_${new Date().getTime()}`,
            contact: {
                id: from,
                name: `Cliente ${from.slice(-4)}`, // Usar os últimos 4 dígitos como nome
                avatar: `https://i.pravatar.cc/150?u=${from}`,
            },
            messages: [],
            isAiActive: true, // Começa ativa por padrão
            lastMessageTimestamp: new Date().toISOString(),
        };
        chats.unshift(newChat);
        chat = newChat;
    }

    // 2. Adicionar a mensagem do usuário ao histórico
    const userMessage: ChatMessage = {
        role: ChatRole.USER,
        content: body,
        timestamp: new Date().toISOString(),
    };
    chat.messages.push(userMessage);
    chat.lastMessageTimestamp = userMessage.timestamp!;

    let aiResponseContent = "O assistente de IA está desativado para esta conversa.";

    // 3. Se a IA estiver ativa, gerar uma resposta
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
    
    // 4. Formatar a resposta para a Twilio usando TwiML
    const twiml = new MessagingResponse();
    twiml.message(aiResponseContent);

    return twiml.toString();
};
