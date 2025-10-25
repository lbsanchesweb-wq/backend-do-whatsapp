import { WhatsAppChat, Product, Settings } from './types';

// This file now exports the INITIAL default data.
// The live data will be managed by db.ts and stored in JSON files.
export const initialChats: WhatsAppChat[] = [];

export const initialProducts: Product[] = [
    {id: '1', name: 'Rótulo Adesivo Vinil', description: 'Rótulo de alta durabilidade, resistente à água e rasgos. Ideal para produtos que entram em contato com umidade.', image: 'https://picsum.photos/seed/label1/300/200', productType: 'Rótulo', size: '10x15cm', quantity: 100, productionTime: '5 dias úteis'},
    {id: '2', name: 'Rótulo Adesivo BOPP', description: 'Filme plástico com ótima aparência e resistência. Perfeito para embalagens de alimentos e bebidas.', image: 'https://picsum.photos/seed/label2/300/200', productType: 'Rótulo', size: '5x5cm', quantity: 500, productionTime: '5 dias úteis'},
    {id: '3', name: 'Etiqueta de Papel Couchê', description: 'Excelente qualidade de impressão e custo-benefício. Usado em produtos secos e embalagens em geral.', image: 'https://picsum.photos/seed/label3/300/200', productType: 'Etiqueta', size: 'Variado', quantity: 1000, productionTime: '3 dias úteis'},
];

export const initialSettings: Settings = {
    paymentPolicy: 'Aceitamos Pix com 5% de desconto, e cartão de crédito em até 6x sem juros.',
    shippingPolicy: 'Entregamos para todo o Brasil. O frete é calculado no momento do pedido. O prazo de produção é de 3 a 5 dias úteis após a confirmação do pagamento.',
    artBriefingPolicy: 'Para a criação da arte, precisaremos do seu logotipo (em vetor, se possível), textos que deseja incluir, informações de contato (telefone, redes sociais) e uma breve descrição da sua ideia ou referências de estilo que você gosta.',
};
