import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Products } from './components/Products';
import { SettingsComponent } from './components/Settings';
import { WhatsApp } from './components/WhatsApp';
import { Reports } from './components/Reports';
import { Page, Product, Settings, WhatsAppChat, Report } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LoaderIcon } from './components/icons';

const API_URL = 'https://backend-do-whatsapp.onrender.com';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('whatsapp');
  
  // State is now managed here, not in localStorage
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({ paymentPolicy: '', shippingPolicy: '', artBriefingPolicy: '' });
  const [whatsAppChats, setWhatsAppChats] = useState<WhatsAppChat[]>([]);
  const [reports, setReports] = useLocalStorage<Report[]>('reports', []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all initial data from the backend
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productsRes, settingsRes, chatsRes] = await Promise.all([
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/settings`),
          fetch(`${API_URL}/chats`)
        ]);

        if (!productsRes.ok || !settingsRes.ok || !chatsRes.ok) {
          throw new Error('Falha ao carregar dados essenciais do servidor.');
        }

        const productsData = await productsRes.json();
        const settingsData = await settingsRes.json();
        const chatsData = await chatsRes.json();

        setProducts(productsData);
        setSettings(settingsData);
        setWhatsAppChats(chatsData);

      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Ocorreu um erro desconhecido ao conectar com o servidor.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error('Falha ao adicionar produto.');
        const newProduct = await response.json();
        setProducts(prev => [...prev, newProduct]);
    } catch (error) {
        console.error("Error adding product:", error);
        alert('Não foi possível adicionar o produto.');
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
        const response = await fetch(`${API_URL}/products/${updatedProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct),
        });
        if (!response.ok) throw new Error('Falha ao atualizar produto.');
        setProducts(products.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
    } catch (error) {
        console.error("Error updating product:", error);
        alert('Não foi possível atualizar o produto.');
    }
  };

  const deleteProduct = async (id: string) => {
     try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Falha ao deletar produto.');
        setProducts(products.filter(p => p.id !== id));
    } catch (error) {
        console.error("Error deleting product:", error);
        alert('Não foi possível deletar o produto.');
    }
  };
  
  const updateSettings = async (newSettings: Settings) => {
      try {
        const response = await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings),
        });
        if (!response.ok) throw new Error('Falha ao salvar configurações.');
        setSettings(newSettings);
        return true; // Indicate success
    } catch (error) {
        console.error("Error updating settings:", error);
        alert('Não foi possível salvar as configurações.');
        return false; // Indicate failure
    }
  }
  
  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <LoaderIcon className="h-12 w-12 mx-auto text-blue-500" />
            <p className="mt-2 text-lg">Conectando ao servidor e carregando dados...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <div className="text-center bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative">
            <strong className="font-bold">Erro Crítico de Conexão!</strong>
            <span className="block sm:inline ml-2">{error}</span>
            <p className="text-sm mt-2">Por favor, verifique se o serviço de backend está online em Render.com e atualize a página.</p>
          </div>
        </div>
      );
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard products={products} settings={settings} />;
      case 'products':
        return <Products products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />;
      case 'settings':
        return <SettingsComponent settings={settings} onSave={updateSettings} />;
      case 'whatsapp':
        return <WhatsApp chats={whatsAppChats} setChats={setWhatsAppChats} products={products} settings={settings} setReports={setReports} />;
      case 'reports':
        return <Reports reports={reports} setReports={setReports} />;
      default:
        return <Dashboard products={products} settings={settings} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 flex flex-col ml-64">
        <Header currentPage={currentPage} />
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
