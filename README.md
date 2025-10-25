
# Araras Impressão - Assistente de Vendas com IA

![Dashboard Screenshot](./docs/screenshot.png) <!-- Adicione um screenshot do seu painel aqui -->

## 📜 Descrição

Este projeto é um painel de controle **full-stack** para a "Araras Impressão", uma empresa de impressão gráfica. Ele apresenta um assistente de vendas autônomo, alimentado pela **API Gemini do Google**, projetado para interagir com clientes através do WhatsApp, guiando-os por um funil de vendas completo, desde a sondagem inicial até o fechamento do pedido.

O sistema é dividido em um **frontend em React** (o painel de controle) e um **backend em Node.js/Express**, que centraliza toda a lógica de negócios, comunicação com a IA e persistência de dados.

---

## ✨ Funcionalidades Principais

*   **🤖 Assistente de Vendas Autônomo:**
    *   Utiliza a API Gemini para conduzir conversas naturais e inteligentes no WhatsApp.
    *   Segue um fluxo de vendas estruturado de 5 etapas (Sondagem, Orçamento, Arte, Aprovação, Fechamento).
    *   As respostas da IA são estritamente baseadas no catálogo de produtos e nas políticas da empresa cadastradas no painel.

*   **🖥️ Painel de Controle Intuitivo (Frontend):**
    *   **Dashboard:** Visão geral com métricas de atendimento, conversas ativas e insights gerados pela IA.
    *   **Gerenciamento de Produtos:** Interface CRUD (Criar, Ler, Atualizar, Deletar) para o catálogo de produtos, com opção de ativar/desativar a visibilidade para a IA.
    *   **Configurações:** Definição das políticas de pagamento, frete e briefing de arte que guiam o comportamento do assistente.
    *   **Interface do WhatsApp:**
        *   Simula uma tela de chat do WhatsApp para monitorar e intervir nas conversas.
        *   **Comunicação em tempo real** via WebSockets: as mensagens da IA aparecem instantaneamente.
        *   Permite alternar entre o modo automático (IA) e o manual para um atendente humano assumir a conversa.
    *   **Geração de Relatórios:** Extrai um resumo estruturado de uma conversa com um único clique.

*   **⚙️ Servidor Robusto (Backend):**
    *   Centraliza toda a lógica de negócios e chamadas para a API Gemini, mantendo as chaves de API seguras.
    *   **Persistência de Dados:** Salva todos os dados (produtos, configurações, conversas, relatórios) em arquivos JSON no servidor, garantindo que as informações não sejam perdidas.
    *   **Servidor WebSocket:** Permite a comunicação em tempo real entre o backend e o painel de controle.
    *   **Webhook para Twilio:** Pronto para receber mensagens de um número real do WhatsApp (requer configuração da Twilio).

---

## 🚀 Tecnologias Utilizadas

| Área        | Tecnologia                                                                                             |
|-------------|--------------------------------------------------------------------------------------------------------|
| **Frontend**  | `React`, `TypeScript`, `Tailwind CSS`                                                                    |
| **Backend**   | `Node.js`, `Express`, `TypeScript`, `WebSocket (ws)`                                                     |
| **IA**        | `Google Gemini API (@google/genai)`                                                                      |
| **Persistência** | Sistema de Arquivos Local (JSON)                                                                       |
| **Comunicação** | `REST API`, `WebSockets`                                                                                 |
| **WhatsApp**  | Integração via Webhook (preparado para `Twilio`)                                                         |

---

## 🔧 Como Funciona a Arquitetura

1.  **Painel (Frontend):** O usuário gerencia produtos e configurações através da interface em React. Todas as ações (ex: adicionar um produto) enviam requisições HTTP para a API do backend.
2.  **Servidor (Backend):** O servidor Express recebe as requisições, processa a lógica e atualiza os arquivos JSON correspondentes no diretório `/db`.
3.  **Conversa no WhatsApp:**
    *   Uma nova mensagem de um cliente chega ao webhook `/webhook` do backend (simulado ou via Twilio).
    *   O backend identifica a conversa, adiciona a mensagem do cliente e, se a IA estiver ativa, chama o `chatService`.
    *   O `chatService` monta o prompt do sistema com os produtos e políticas atuais e envia o histórico da conversa para a API Gemini.
    *   A API Gemini retorna a resposta, que é salva no histórico da conversa.
4.  **Atualização em Tempo Real:**
    *   Após qualquer alteração em uma conversa (seja por uma mensagem do cliente ou uma resposta da IA), o backend usa o WebSocket para **transmitir a lista de conversas atualizada** para todos os painéis conectados.
    *   O frontend recebe a nova lista e atualiza a interface do WhatsApp instantaneamente, sem a necessidade de recarregar a página.

---

## 📂 Estrutura do Projeto

```
/
├── backend-do-whatsapp/      # Servidor Node.js/Express
│   ├── db/                   # Diretório para os arquivos de dados .json
│   ├── services/             # Lógica de negócios (chatService, twilioService)
│   ├── data.ts               # Dados iniciais/padrão
│   ├── db.ts                 # Lógica de leitura/escrita dos arquivos JSON
│   ├── index.ts              # Ponto de entrada do servidor
│   └── package.json
├── components/               # Componentes React
├── hooks/                    # Hooks customizados do React
├── services/                 # Serviços do Frontend (chamadas à API)
├── index.html
├── index.tsx                 # Ponto de entrada do React
└── package.json
```

---

## ⚙️ Instalação e Execução

Siga os passos abaixo para rodar o projeto localmente.

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (versão 18 ou superior)
*   `npm` ou `yarn`
*   Uma chave de API do **Google Gemini**. Obtenha a sua no [Google AI Studio](https://aistudio.google.com/app/apikey).

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```

2.  **Instale as dependências do Frontend:**
    ```bash
    npm install
    ```

3.  **Instale as dependências do Backend:**
    ```bash
    cd backend-do-whatsapp
    npm install
    ```

4.  **Configure as Variáveis de Ambiente:**
    *   Ainda no diretório `backend-do-whatsapp`, crie um arquivo chamado `.env`.
    *   Adicione sua chave da API Gemini a este arquivo:
        ```
        # .env
        API_KEY="SUA_CHAVE_DA_API_GEMINI_AQUI"
        ```

5.  **Inicie o Servidor Backend:**
    *   No terminal, dentro do diretório `backend-do-whatsapp`, execute:
    ```bash
    npm start
    ```
    *   O servidor estará rodando em `http://localhost:3001`.

6.  **Inicie o Painel Frontend:**
    *   Abra **outro terminal**, navegue para a raiz do projeto e execute:
    ```bash
    npm start
    ```
    *   O painel estará acessível em `http://localhost:XXXX` (a porta será indicada no terminal).

Agora você pode acessar o painel no seu navegador e começar a usar o sistema!

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
