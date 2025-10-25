
import { GoogleGenAI, Content } from "@google/genai";
import { Product, Settings, ChatMessage, ChatRole, WhatsAppChat } from '../types';

// Supondo que as variáveis de ambiente estão configuradas no Render
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

function createSystemInstruction(products: Product[], settings: Settings): string {
    const productCatalog = products.map(p =>
        `- **${p.name}**: ${p.description} (Tipo: ${p.productType}, Tamanho Padrão: ${p.size}, Qtd. Mínima: ${p.quantity} un., Prazo: ${p.productionTime})`
    ).join('\n');

    return `
Você é Ara, um assistente de vendas e atendimento da 'Araras Impressão', uma gráfica especializada em rótulos e adesivos. Sua função é guiar os clientes por um funil de vendas de forma autônoma via WhatsApp.

Seja sempre cordial, profissional e proativo. Conduza a conversa, fazendo uma pergunta de cada vez para não sobrecarregar o cliente. Mantenha suas mensagens curtas e diretas, como em uma conversa real.

**IMPORTANTÍSSIMO: BASEIE TODAS as suas respostas estritamente nas informações fornecidas abaixo. NÃO invente produtos, preços, políticas ou detalhes. Se a informação não estiver aqui, você não a conhece.**

---

**Catálogo de Produtos:**
${productCatalog || 'Nenhum produto cadastrado ainda.'}

**Políticas da Empresa:**
- **Pagamento:** ${settings.paymentPolicy || 'Não definida.'}
- **Frete e Envio:** ${settings.shippingPolicy || 'Não definida.'}
- **Briefing para Arte:** ${settings.artBriefingPolicy || 'Não definida.'}

---

**FLUXO DE ATENDIMENTO OBRIGATÓRIO (Siga estas 5 etapas em ordem):**

**Etapa 1: Sondagem e Descoberta**
1.  Apresente-se: "Olá! Sou Ara, assistente virtual da Araras Impressão. Para começar, me diga, para qual finalidade você precisa dos adesivos?"
2.  Faça perguntas abertas para entender a necessidade do cliente (ex: "É para embalagem de alimentos?", "Precisa ser resistente à água?").

**Etapa 2: Recomendação e Orçamento**
1.  Com base na necessidade do cliente, recomende o produto MAIS adequado do Catálogo. Justifique sua recomendação.
2.  Para fazer um orçamento, pergunte o **tamanho** e a **quantidade** desejada.
3.  **Lógica de Preços (SIMULAÇÃO):** Use a seguinte estrutura: "Para o [Nome do Produto] no tamanho [tamanho informado], temos pacotes com os seguintes valores (valores ilustrativos): 100 unidades por R$ 50,00, 500 unidades por R$ 180,00 e 1000 unidades por R$ 300,00. Qual pacote te atende melhor?".

**Etapa 3: Definição da Arte**
1.  Pergunte sobre a arte: "Ótima escolha! Agora, sobre a arte dos adesivos, você já tem ela pronta ou prefere que nossa equipe crie uma para você?".
2.  **Se o cliente TEM a arte:** Diga "Perfeito! Você pode nos enviar o arquivo.".
3.  **Se o cliente NÃO TEM a arte:** Diga "Sem problemas, nós criamos para você! Para começarmos, preciso que me envie algumas informações. ${settings.artBriefingPolicy}".

**Etapa 4: Aprovação da Arte**
1.  Informe: "Certo. Nossa equipe irá montar um modelo virtual e te enviar para aprovação. A produção só começa depois que você disser que está tudo 100% correto, ok?".

**Etapa 5: Fechamento do Pedido**
1.  Confirme o pedido, peça o CEP e apresente as opções de pagamento com base nas políticas.

**Regras Gerais:**
- **Mensagens Curtas:** Divida respostas longas em 2-3 mensagens menores.
- **Tratamento de Exceções:** Se não souber, responda: "Essa é uma ótima pergunta. Vou transferir você para um de nossos especialistas para te ajudar com isso, ok?".
`;
}

export const generateChatResponse = async (
    history: ChatMessage[],
    products: Product[],
    settings: Settings
): Promise<string> => {
    try {
        const systemInstruction = createSystemInstruction(products, settings);
        
        const geminiHistory: Content[] = history
            .filter(m => m.role !== ChatRole.SYSTEM)
            .map(msg => ({
                role: msg.role === ChatRole.ASSISTANT ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));
        
        const lastMessage = geminiHistory.pop();
        if (!lastMessage || lastMessage.role !== 'user') {
            return "Não foi possível processar a última mensagem.";
        }

        const chat = ai.chats.create({
            model,
            history: geminiHistory,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        const response = await chat.sendMessage({ message: lastMessage.parts[0].text || '' });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Desculpe, ocorreu um erro ao me comunicar com a IA. Por favor, tente novamente mais tarde.";
    }
};

export const generateOrderSummary = async (history: ChatMessage[]): Promise<string> => {
    try {
        const conversationText = history
            .map(m => `${m.role === ChatRole.USER ? 'Cliente' : 'Assistente'}: ${m.content}`)
            .join('\n');

        const prompt = `
            Analise a conversa a seguir e gere um resumo de pedido claro e conciso. Se alguma informação não estiver presente, escreva "Não informado".

            **Conversa:**
            ---
            ${conversationText}
            ---

            **Resumo do Pedido - Araras Impressão**

            *   **Cliente:** [Extraia o nome do cliente]
            *   **Contato:** [Extraia o número de telefone]
            *   **Produto(s):** [Liste o(s) produto(s) escolhido(s)]
            *   **Tamanho:** [Especifique o tamanho]
            *   **Quantidade:** [Especifique a quantidade]
            *   **Status da Arte:** [Informe se o cliente tem a arte pronta ou precisa de criação]
            *   **Endereço/CEP:** [Informe o CEP ou endereço]
            *   **Resumo Geral:** [Faça um breve parágrafo resumindo o estado atual do atendimento.]
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });

        return response.text;

    } catch (error) {
        console.error("Error generating order summary:", error);
        return "Desculpe, ocorreu um erro ao gerar o resumo do pedido.";
    }
};

export const generateAnalyticsInsights = async (chats: WhatsAppChat[]): Promise<string> => {
    if (chats.length === 0) {
        return "Nenhuma conversa para analisar ainda.";
    }

    // Combine all user messages into one block of text for analysis
    const allUserMessages = chats
        .flatMap(chat => chat.messages)
        .filter(message => message.role === ChatRole.USER)
        .map(message => message.content)
        .join('\n---\n');

    const prompt = `
        Você é um analista de negócios sênior em uma empresa de impressão gráfica. Sua tarefa é analisar um compilado de mensagens de clientes e identificar os 3 a 5 tópicos mais frequentes ou importantes.

        Analise as seguintes mensagens de clientes:
        ---
        ${allUserMessages}
        ---

        Com base nesta análise, liste os principais pontos de interesse dos clientes. Seja conciso e direto. Use o formato de lista (bullet points).
        
        Exemplo de resposta:
        *   Orçamentos para rótulos de vinil resistentes à água.
        *   Dúvidas sobre o processo de criação de arte.
        *   Perguntas sobre prazos de entrega para grandes quantidades.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error generating analytics insights:", error);
        return "Ocorreu um erro ao analisar os dados das conversas.";
    }
};
