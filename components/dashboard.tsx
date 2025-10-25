import React, { useState, useEffect } from 'react';
import { WhatsAppChat, Page } from '../types';
import { LoaderIcon, MessageSquareIcon, FileTextIcon, TrendingUpIcon } from './icons';

const API_URL = 'https://backend-do-whatsapp.onrender.com';

interface AnalyticsData {
  totalChats: number;
  aiActiveChats: number;
  totalReports: number;
  aiInsights: string;
  recentActivity: WhatsAppChat[];
}

interface DashboardProps {
  setCurrentPage: (page: Page) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_URL}/analytics`);
        if (!response.ok) {
          throw new Error('Falha ao buscar dados de análise do servidor.');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <LoaderIcon className="h-12 w-12 mx-auto text-blue-500" />
          <p className="mt-2 text-lg">Carregando análise de dados...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="text-center bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          <strong className="font-bold">Erro ao Carregar Dashboard!</strong>
          <span className="block sm:inline ml-2">{error || 'Não foi possível carregar os dados.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total de Conversas" value={analytics.totalChats} icon={<MessageSquareIcon className="h-6 w-6 text-blue-500" />} />
        <StatCard title="Conversas com IA Ativa" value={`${analytics.aiActiveChats} / ${analytics.totalChats}`} icon={<LoaderIcon className="h-6 w-6 text-blue-500 !animate-none" />} />
        <StatCard title="Relatórios Gerados" value={analytics.totalReports} icon={<FileTextIcon className="h-6 w-6 text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                    <TrendingUpIcon className="h-6 w-6 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Insights da IA</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Análise automática das conversas para identificar os principais interesses dos seus clientes.
            </p>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm font-mono leading-relaxed">
                    {analytics.aiInsights || "Ainda não há dados suficientes para gerar insights."}
                </pre>
            </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Atividade Recente</h2>
          <ul className="space-y-3">
            {analytics.recentActivity.length > 0 ? analytics.recentActivity.map(chat => (
              <li key={chat.id} 
                  onClick={() => setCurrentPage('whatsapp')}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <img src={chat.contact.avatar} alt={chat.contact.name} className="w-10 h-10 rounded-full" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{chat.contact.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {chat.messages[chat.messages.length - 1]?.content}
                  </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            )) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma atividade recente.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
