import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WhatsAppChat, ChatMessage, Product, Settings, ChatRole, Report, Contact } from '../types';
import { LoaderIcon, SendIcon, UserIcon, MessageSquareIcon, FileTextIcon, PlusIcon } from './icons';
import { ToggleSwitch } from './ToggleSwitch';
import { Modal } from './Modal';

interface WhatsAppProps {
  chats: WhatsAppChat[];
  setChats: React.Dispatch<React.SetStateAction<WhatsAppChat[]>>;
  products: Product[];
  settings: Settings;
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
}

const API_URL = 'https://backend-do-whatsapp.onrender.com';
const WS_URL = 'wss://backend-do-whatsapp.onrender.com';


const NewChatForm: React.FC<{
  onSubmit: (contactName: string, initialMessage: string) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [contactName, setContactName] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !initialMessage.trim()) return;
    onSubmit(contactName, initialMessage);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Contato</label>
        <input 
          type="text" 
          id="contactName" 
          value={contactName} 
          onChange={(e) => setContactName(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" 
          required 
          placeholder="Ex: João da Silva"
        />
      </div>
      <div>
        <label htmlFor="initialMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primeira Mensagem do Cliente</label>
        <textarea 
          id="initialMessage" 
          value={initialMessage} 
          onChange={(e) => setInitialMessage(e.target.value)} 
          rows={3} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" 
          required
          placeholder="Ex: Olá, gostaria de um orçamento."
        ></textarea>
      </div>
      <div className="flex justify-end pt-2 space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Iniciar Conversa</button>
      </div>
    </form>
  );
};


export const WhatsApp: React.FC<WhatsAppProps> = ({ chats, setChats, products, settings, setReports }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
  }, [chats]);
  
  const selectedChat = useMemo(() => {
    return chats.find(c => c.id === selectedChatId);
  }, [chats, selectedChatId]);
  
  // Real-time updates with WebSockets
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      try {
        const updatedChats = JSON.parse(event.data);
        setChats(updatedChats);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Optional: implement reconnection logic here
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    // Cleanup on component unmount
    return () => {
      ws.close();
    };
  }, [setChats]);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedChat?.messages, isLoading]);
  
  useEffect(() => {
      if (!selectedChatId && sortedChats.length > 0) {
          setSelectedChatId(sortedChats[0].id);
      }
  }, [sortedChats, selectedChatId]);

  const handleToggleAI = async (chatId: string) => {
    const originalChats = chats;
    // Optimistic UI update
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, isAiActive: !chat.isAiActive } : chat
    ));

    try {
        const chatToUpdate = originalChats.find(c => c.id === chatId);
        if (!chatToUpdate) return;

        const response = await fetch(`${API_URL}/chats/${chatId}/toggle-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAiActive: !chatToUpdate.isAiActive }),
        });

        if (!response.ok) {
            throw new Error('Falha ao atualizar o status da IA.');
        }
        // The backend will broadcast the update via WebSocket, so no need to set state here.
    } catch (error) {
        console.error("Error toggling AI status:", error);
        setChats(originalChats); // Revert on error
        alert('Falha ao atualizar o status da IA. Tente novamente.');
    }
  };

 const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedChat) return;

    const isAiActive = selectedChat.isAiActive;
    const role = isAiActive ? ChatRole.USER : ChatRole.ASSISTANT;
    const messageContent = userInput;
    
    // Optimistic UI update for user's message
    const newMessage: ChatMessage = {
      role,
      content: messageContent,
      timestamp: new Date().toISOString(),
    };
    
    const originalChats = [...chats];
    setChats(prev => prev.map(chat => 
        chat.id === selectedChatId 
        ? { ...chat, messages: [...chat.messages, newMessage], lastMessageTimestamp: newMessage.timestamp! } 
        : chat
    ));
    setUserInput('');
    setIsLoading(isAiActive); // Only show loader if AI is active and will respond

    try {
      const response = await fetch(`${API_URL}/chats/${selectedChatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent, role }),
      });

      if (!response.ok) throw new Error("O servidor respondeu com um erro.");

      // The backend will broadcast the final state (with AI response) via WebSocket.
      // No need to process the response here.

    } catch (error) {
        console.error("Error sending message:", error);
        setChats(originalChats); // Revert on error
        alert('Erro de rede. A mensagem não foi enviada.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddNewChat = async (contactName: string, initialMessage: string) => {
    setIsNewChatModalOpen(false);
    setIsLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactName, initialMessage }),
        });

        if (!response.ok) throw new Error('Falha ao criar nova conversa.');
        
        // Backend broadcasts the new chat list, which includes the AI's first response.
        // We just need to select the new chat once it arrives.
        const newChat: WhatsAppChat = await response.json();
        setSelectedChatId(newChat.id);

    } catch (error) {
        console.error("Error creating new chat:", error);
        alert('Não foi possível criar a nova conversa. Verifique o backend e tente novamente.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedChat || selectedChat.messages.length === 0 || isGeneratingReport) return;

    setIsGeneratingReport(true);
    try {
      const response = await fetch(`${API_URL}/chats/${selectedChatId}/report`, { method: 'POST' });
      if (!response.ok) throw new Error('Falha ao buscar resumo do relatório.');
      
      const { summary } = await response.json();
      
      const newReport: Report = {
        id: new Date().toISOString(),
        chatId: selectedChat.id,
        contactName: selectedChat.contact.name,
        generatedAt: new Date().toISOString(),
        summary: summary,
      };
      setReports(prevReports => [newReport, ...prevReports]);
      
      const reportHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-A">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório do Pedido - ${selectedChat.contact.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 font-sans p-8">
          <div class="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl">
            <h1 class="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Relatório de Atendimento</h1>
            <pre class="whitespace-pre-wrap text-gray-700 text-sm font-sans leading-relaxed">${summary.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
          </div>
        </body>
        </html>
      `;
      
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(reportHtml);
        newWindow.document.close();
      } else {
        alert('Por favor, habilite pop-ups para ver o relatório.');
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setIsGeneratingReport(false);
    }
  };


  const ChatView = () => (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Chat Header */}
      <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <img src={selectedChat!.contact.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedChat!.contact.name}</h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || isLoading || !selectedChat?.messages.length}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Gerar relatório do pedido"
          >
            {isGeneratingReport ? (
              <LoaderIcon className="h-4 w-4" />
            ) : (
              <FileTextIcon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Relatório</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${selectedChat!.isAiActive ? 'text-green-500' : 'text-gray-500'}`}>
              IA {selectedChat!.isAiActive ? 'Ativa' : 'Inativa'}
            </span>
            <ToggleSwitch 
              id={`ai-toggle-${selectedChat!.id}`}
              isOn={selectedChat!.isAiActive} 
              handleToggle={() => handleToggleAI(selectedChat!.id)} 
            />
          </div>
        </div>
      </header>
      
      {/* Messages */}
      <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {selectedChat!.messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === ChatRole.USER ? 'justify-end' : 'justify-start'}`}>
            {msg.role === ChatRole.ASSISTANT && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>
            )}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow-sm ${
              msg.role === ChatRole.USER 
              ? 'bg-green-500 text-white rounded-br-none' 
              : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
            }`}>
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
               {msg.timestamp && (
                 <p className={`text-xs mt-2 text-right ${msg.role === ChatRole.USER ? 'text-green-200' : 'text-gray-400 dark:text-gray-500'}`}>
                   {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
               )}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex items-end gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">AI</div>
              <div className="p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                <div className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
          </div>
        )}
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-100 dark:bg-gray-800">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={selectedChat?.isAiActive ? 'Digite a mensagem do cliente...' : 'Digite sua resposta manual...'}
          className="flex-grow px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 dark:text-gray-200"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors duration-200">
          <SendIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );

  return (
    <>
      <div className="h-full flex">
        {/* Contact List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Conversas</h2>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Iniciar Nova Conversa"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`flex items-center p-3 cursor-pointer border-l-4 ${
                  selectedChatId === chat.id 
                  ? 'bg-blue-100 dark:bg-gray-700 border-blue-500' 
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <img src={chat.contact.avatar} alt="avatar" className="w-12 h-12 rounded-full mr-3" />
                <div className="flex-grow overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{chat.contact.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {chat.messages[chat.messages.length - 1]?.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedChat ? <ChatView /> : (
          <div className="w-2/3 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageSquareIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-200">Selecione uma conversa</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Escolha uma conversa da lista para começar a interagir ou inicie uma nova.</p>
            </div>
          </div>
        )}
      </div>
      <Modal isOpen={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)} title="Iniciar Nova Conversa">
        <NewChatForm onSubmit={handleAddNewChat} onCancel={() => setIsNewChatModalOpen(false)} />
      </Modal>
    </>
  );
};
