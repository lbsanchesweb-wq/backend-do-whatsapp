import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { LoaderIcon } from './icons';

interface SettingsProps {
  settings: Settings;
  onSave: (newSettings: Settings) => Promise<boolean>;
}

export const SettingsComponent: React.FC<SettingsProps> = ({ settings: initialSettings, onSave }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);
    
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await onSave(settings);
    if (success) {
        alert('Configurações salvas com sucesso!');
    }
    setIsSaving(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setSettings(prev => ({...prev, [name]: value}));
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Políticas de Pagamento</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Defina como seus clientes podem pagar. Esta informação será usada pelo assistente de IA.
            </p>
            <textarea
              name="paymentPolicy"
              rows={4}
              value={settings.paymentPolicy}
              onChange={handleInputChange}
              className="mt-2 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200"
              placeholder="Ex: Aceitamos Pix, cartão de crédito em até 3x sem juros e boleto bancário."
            />
          </div>

          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Políticas de Frete e Envio</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Descreva suas opções de envio, prazos e custos.
            </p>
            <textarea
              name="shippingPolicy"
              rows={4}
              value={settings.shippingPolicy}
              onChange={handleInputChange}
              className="mt-2 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200"
              placeholder="Ex: Enviamos para todo o Brasil via Correios. O frete é calculado com base no CEP. Prazo de produção: 5 dias úteis."
            />
          </div>

          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Instruções para Briefing de Arte</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Guie o cliente sobre quais informações são necessárias para criar a arte. O assistente usará isso na Etapa 3 do atendimento.
            </p>
            <textarea
              name="artBriefingPolicy"
              rows={4}
              value={settings.artBriefingPolicy}
              onChange={handleInputChange}
              className="mt-2 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200"
              placeholder="Ex: Para criar sua arte, envie seu logo, textos, contatos e ideias de cores..."
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm flex items-center justify-center disabled:bg-blue-400 dark:disabled:bg-blue-800"
            >
              {isSaving ? <LoaderIcon className="h-5 w-5" /> : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
