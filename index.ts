import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WhatsAppChat, ChatMessage, ChatRole, Product } from './types';
import { initializeDatabase, getChats, getProducts, getSettings, saveChats, saveProducts, saveSettings } from './db';
import { generateChatResponse, generateOrderSummary } from './services/chatService';
import { handleIncomingMessage } from './services/twilioService';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// Fix: Explicitly provide a path to the middleware to resolve overload ambiguity.
app.use('/', express.json({ limit: '10mb' }));
// Fix: Explicitly provide a path to the middleware to resolve overload ambiguity.
app.use('/', express.urlencoded({ extended: true, limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

const broadcast = (data: any) => {
  const jsonData = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(jsonData);
  });
};

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  clients.add(ws);
  ws.send(JSON.stringify(getChats()));
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

// ** API Endpoints **

// -- Products API --
app.get('/products', (req, res) => {
    res.json(getProducts());
});

app.post('/products', async (req, res) => {
    const products = getProducts();
    const newProduct: Product = { ...req.body, id: `prod_${new Date().getTime()}` };
    products.push(newProduct);
    await saveProducts();
    res.status(201).json(newProduct);
});

app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex > -1) {
        products[productIndex] = { ...products[productIndex], ...req.body };
        await saveProducts();
        res.json(products[productIndex]);
    } else {
        res.status(404).send('Product not found');
    }
});

app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex > -1) {
        products.splice(productIndex, 1);
        await saveProducts();
        res.status(204).send();
    } else {
        res.status(404).send('Product not found');
    }
});

// -- Settings API --
app.get('/settings', (req, res) => {
    res.json(getSettings());
});

app.put('/settings', async (req, res) => {
    const newSettings = req.body;
    const settings = getSettings();
    Object.assign(settings, newSettings);
    await saveSettings();
    res.json(settings);
});

// -- Chats API --
app.get('/chats', (req, res) => {
  res.json(getChats());
});

app.post('/chats', async (req, res) => {
    const { contactName, initialMessage } = req.body;
    const chats = getChats();
    
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

    const aiResponse = await generateChatResponse(newChat.messages, getProducts(), getSettings());
    newChat.messages.push({ role: ChatRole.ASSISTANT, content: aiResponse, timestamp: new Date().toISOString() });
    newChat.lastMessageTimestamp = new Date().toISOString();

    chats.unshift(newChat);
    await saveChats();
    
    broadcast(chats);
    res.status(201).json(newChat);
});

app.post('/chats/:id/message', async (req, res) => {
    const { id } = req.params;
    const { content, role } = req.body;
    const chat = getChats().find(c => c.id === id);

    if (chat) {
        const newMessage: ChatMessage = { role, content, timestamp: new Date().toISOString() };
        chat.messages.push(newMessage);
        chat.lastMessageTimestamp = newMessage.timestamp!;

        if (chat.isAiActive && role === ChatRole.USER) {
            const aiResponse = await generateChatResponse(chat.messages, getProducts(), getSettings());
            chat.messages.push({ role: ChatRole.ASSISTANT, content: aiResponse, timestamp: new Date().toISOString() });
            chat.lastMessageTimestamp = new Date().toISOString();
        }
        
        await saveChats();
        broadcast(getChats());
        res.json(chat);
    } else {
        res.status(404).send('Chat not found');
    }
});

app.post('/chats/:id/toggle-ai', async (req, res) => {
    const { id } = req.params;
    const { isAiActive } = req.body;
    const chat = getChats().find(c => c.id === id);
    if (chat) {
        chat.isAiActive = isAiActive;
        await saveChats();
        broadcast(getChats());
        res.json(chat);
    } else {
        res.status(404).send('Chat not found');
    }
});

app.post('/chats/:id/report', async (req, res) => {
    const { id } = req.params;
    const chat = getChats().find(c => c.id === id);
    if (chat) {
        const summary = await generateOrderSummary(chat.messages);
        res.json({ summary });
    } else {
        res.status(404).send('Chat not found');
    }
});

// ** Twilio Webhook Endpoint **
app.post('/webhook', async (req, res) => {
    const from = req.body.From;
    const body = req.body.Body;

    console.log(`Mensagem recebida de ${from}: "${body}"`);

    try {
        const twimlResponse = await handleIncomingMessage(from, body);
        broadcast(getChats());
        res.type('text/xml').send(twimlResponse);
    } catch (error) {
        console.error("Erro ao processar webhook:", error);
        res.status(500).send("Ocorreu um erro interno.");
    }
});

// Initialize DB and start the server
async function startServer() {
  await initializeDatabase();
  server.listen(port, () => {
    console.log(`Server is running on port ${port}, data is being persisted to /db directory.`);
  });
}

startServer();
