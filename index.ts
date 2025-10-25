
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { WhatsAppChat, ChatMessage, ChatRole } from './types';
import { chats, products, settings } from './data';
import { generateChatResponse, generateOrderSummary } from './services/chatService';
import { handleIncomingMessage } from './services/twilioService';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Para Twilio

// Endpoint para o painel buscar todas as conversas
app.get('/chats', (req, res) => {
  res.json(chats);
});

// Endpoint para o painel criar uma nova conversa simulada
app.post('/chats', async (req, res) => {
    const { contactName, initialMessage } = req.body;
    
    const newChat: WhatsAppChat = {
        id: `chat_${new Date().getTime()}`,
        contact: {
            id: `contact_${new Date().getTime()}`,
            name: contactName,
            avatar: `https://i.pravatar.cc/150?u=${contactName}`,
        },
        messages: [{ role: ChatRole.USER, content: initialMessage, timestamp: new Date().toISOString() }],
        isAiActive: true,
        lastMessageTimestamp: new Date().toISOString(),
    };

    const aiResponse = await generateChatResponse(newChat.messages, products, settings);
    newChat.messages.push({ role: ChatRole.ASSISTANT, content: aiResponse, timestamp: new Date().toISOString() });
    newChat.lastMessageTimestamp = new Date().toISOString();

    chats.unshift(newChat);
    res.status(201).json(newChat);
});

// Endpoint para o painel enviar uma mensagem
app.post('/chats/:id/message', async (req, res) => {
    const { id } = req.params;
    const { content, role } = req.body;
    const chat = chats.find(c => c.id === id);

    if (chat) {
        const newMessage: ChatMessage = { role, content, timestamp: new Date().toISOString() };
        chat.messages.push(newMessage);
        chat.lastMessageTimestamp = newMessage.timestamp!;

        if (chat.isAiActive && role === ChatRole.USER) {
            const aiResponse = await generateChatResponse(chat.messages, products, settings);
            chat.messages.push({ role: ChatRole.ASSISTANT, content: aiResponse, timestamp: new Date().toISOString() });
            chat.lastMessageTimestamp = new Date().toISOString();
        }
        res.json(chat);
    } else {
        res.status(404).send('Chat not found');
    }
});

// Endpoint para o painel alternar a IA
app.post('/chats/:id/toggle-ai', (req, res) => {
    const { id } = req.params;
    const { isAiActive } = req.body;
    const chat = chats.find(c => c.id === id);
    if (chat) {
        chat.isAiActive = isAiActive;
        res.json(chat);
    } else {
        res.status(404).send('Chat not found');
    }
});

// Endpoint para o painel gerar relatório
app.post('/chats/:id/report', async (req, res) => {
    const { id } = req.params;
    const chat = chats.find(c => c.id === id);
    if (chat) {
        const summary = await generateOrderSummary(chat.messages);
        res.json({ summary });
    } else {
        res.status(404).send('Chat not found');
    }
});

// ******************************************************
// ** NOVO ENDPOINT PARA WEBHOOK DA TWILIO **
// ******************************************************
app.post('/webhook', async (req, res) => {
    const from = req.body.From; // Número do cliente (ex: whatsapp:+5511999998888)
    const body = req.body.Body; // Mensagem do cliente

    console.log(`Mensagem recebida de ${from}: "${body}"`);

    try {
        const twimlResponse = await handleIncomingMessage(from, body);
        res.type('text/xml').send(twimlResponse);
    } catch (error) {
        console.error("Erro ao processar webhook:", error);
        res.status(500).send("Ocorreu um erro interno.");
    }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
