
// FIX: Import `json` and `urlencoded` from express to resolve type errors.
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WhatsAppChat, ChatMessage, ChatRole } from './types';
import { chats, products, settings } from './data';
import { generateChatResponse, generateOrderSummary } from './services/chatService';
import { handleIncomingMessage } from './services/twilioService';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// FIX: Use imported `json` and `urlencoded` functions directly.
app.use(json());
app.use(urlencoded({ extended: true }));

// ** WebSocket Server Setup **
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set<WebSocket>();

// Function to broadcast data to all connected clients
const broadcast = (data: any) => {
  const jsonData = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonData);
    }
  });
};

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  clients.add(ws);

  // Send the current chat list to the newly connected client
  ws.send(JSON.stringify(chats));

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});


// ** API Endpoints **

app.get('/chats', (req, res) => {
  res.json(chats);
});

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
    
    broadcast(chats); // Notify all clients
    res.status(201).json(newChat);
});

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
        
        broadcast(chats); // Notify all clients
        res.json(chat);
    } else {
        res.status(404).send('Chat not found');
    }
});

app.post('/chats/:id/toggle-ai', (req, res) => {
    const { id } = req.params;
    const { isAiActive } = req.body;
    const chat = chats.find(c => c.id === id);
    if (chat) {
        chat.isAiActive = isAiActive;
        
        broadcast(chats); // Notify all clients
        res.json(chat);
    } else {
        res.status(404).send('Chat not found');
    }
});

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

// ** Twilio Webhook Endpoint **
app.post('/webhook', async (req, res) => {
    const from = req.body.From;
    const body = req.body.Body;

    console.log(`Mensagem recebida de ${from}: "${body}"`);

    try {
        const twimlResponse = await handleIncomingMessage(from, body);
        
        // After handling the message, the 'chats' array is updated.
        // Now, broadcast the change to all clients.
        broadcast(chats);

        res.type('text/xml').send(twimlResponse);
    } catch (error) {
        console.error("Erro ao processar webhook:", error);
        res.status(500).send("Ocorreu um erro interno.");
    }
});

// Use the http server to listen, not the express app
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
