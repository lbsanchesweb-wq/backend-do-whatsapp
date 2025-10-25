// server.js

// --- 1. CONFIGURAÇÃO INICIAL E DEPENDÊNCIAS ---
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require("@google/genai");
const twilio = require('twilio');

// --- 2. INICIALIZAÇÃO DOS SERVIÇOS ---
const geminiApiKey = process.env.API_KEY;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!geminiApiKey || !twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
    console.error("ERRO: Uma ou mais variáveis de ambiente estão faltando.");
    console.error("Verifique se seu arquivo .env contém API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_NUMBER.");
    process.exit(1);
}
/*
 *  IMPORTANTE: CRIE UM ARQUIVO CHAMADO `.env` na mesma pasta
 *  e adicione suas chaves dentro dele, assim:
 *
 *  API_KEY=SUA_CHAVE_GEMINI_AQUI
 *  TWILIO_ACCOUNT_SID=SEU_ACCOUNT_SID_DA_TWILIO
 *  TWILIO_AUTH_TOKEN=SEU_AUTH_TOKEN_DA_TWILIO
 *  TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886 (o número do sandbox da Twilio)
 */

const ai = new GoogleGenAI({ apiKey: geminiApiKey });
const geminiModel = 'gemini-2.5-flash';
const twilioClient = new twilio(twilioAccountSid, twilioAuthToken);
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// --- 3. A LÓGICA PRINCIPAL (WEBHOOK) ---
app.post('/whatsapp-webhook', async (req, res) => {
    const incomingMsg = req.body.Body;
    const fromNumber = req.body.From;
    
    console.log(`Mensagem recebida de ${fromNumber}: "${incomingMsg}"`);

    try {
        const systemInstruction = `
            Você é Ara, um assistente de vendas e atendimento da 'Araras Impressão'.
            Sua função é atender clientes via WhatsApp. Seja sempre cordial, profissional e proativo.
            Mantenha suas mensagens curtas e diretas, como em uma conversa real.
            NÃO invente produtos ou políticas. Se não souber, peça para falar com um atendente humano.
        `;
        const response = await ai.models.generateContent({
            model: geminiModel,
            contents: incomingMsg,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        const aiResponseText = response.text;
        console.log(`Resposta da IA: "${aiResponseText}"`);

        if (aiResponseText) {
            await twilioClient.messages.create({
                body: aiResponseText,
                from: twilioWhatsAppNumber,
                to: fromNumber
            });
            console.log("Resposta enviada para o cliente via WhatsApp.");
        }
    } catch (error) {
        console.error("Ocorreu um erro no processo:", error);
        await twilioClient.messages.create({
            body: 'Desculpe, estou com um problema técnico no momento. Um de nossos atendentes entrará em contato em breve.',
            from: twilioWhatsAppNumber,
            to: fromNumber
        });
    }
    const twiml = new twilio.twiml.MessagingResponse();
    res.type('text/xml').send(twiml.toString());
});

// --- 4. INICIA O SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
    console.log("Agora, configure esta URL no seu Sandbox da Twilio (usando ngrok ou um servidor hospedado): /whatsapp-webhook");
});
