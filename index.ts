import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WhatsAppChat, ChatMessage, ChatRole, Product } from './types';
import { chats, products, settings } from './data';
import { generateChatResponse, generateOrderSummary } from './services/chatService';
import { handleIncomingMessage } from './services/twilioService';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// FIX: Use express.json() and express.urlencoded() to correctly parse request bodies.
app.use(express.json({ limit: '10mb' })); // Increase limit for product images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// -- Products API --
app.get('/products', (req, res) => {
    res.json(products);
});

app.post('/products', (req, res) => {
    const newProduct: Product = { ...req.body, id: `prod_${new Date().getTime()}` };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex > -1) {
        products[productIndex] = { ...products[productIndex], ...req.body };
        res.json(products[productIndex]);
    } else {
        res.status(404).send('Product not found');
    }
});

app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    // FIX: Mutate the array instead of reassigning an imported variable.
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex > -1) {
        products.splice(productIndex, 1);
        res.status(204).send();
    } else {
        res.status(404).send('Product not found');
    }
});

// -- Settings API --
app.get('/settings', (req, res) => {
    res.json(settings);
});

app.put('/settings', (req, res) => {
    const newSettings = req.body;
    // FIX: Mutate the imported settings object instead of reassigning it.
    Object.assign(settings, newSettings);
    res.json(settings);
});


// -- Chats API --
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
