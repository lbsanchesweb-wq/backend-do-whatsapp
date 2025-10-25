
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Modal } from './Modal';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from './icons';
import { ToggleSwitch } from './ToggleSwitch';

interface ProductsProps {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'isActive'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductStatus: (id: string, isActive: boolean) => void;
}

const ProductForm: React.FC<{
  onSubmit: (product: Omit<Product, 'id' | 'isActive'>) => void;
  onUpdate: (product: Product) => void;
  onClose: () => void;
  productToEdit: Product | null;
}> = ({ onSubmit, onUpdate, onClose, productToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [productType, setProductType] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [productionTime, setProductionTime] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setImage(productToEdit.image);
      setProductType(productToEdit.productType);
      setSize(productToEdit.size);
      setQuantity(productToEdit.quantity);
      setProductionTime(productToEdit.productionTime);
    } else {
      setName('');
      setDescription('');
      setImage('');
      setProductType('');
      setSize('');
      setQuantity(100);
      setProductionTime('');
    }
  }, [productToEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !productType || !size || !productionTime) return;
    
    const productData = { name, description, image, productType, size, quantity, productionTime };

    if (productToEdit) {
      onUpdate({ ...productToEdit, ...productData });
    } else {
      onSubmit(productData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="productType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo do Produto</label>
            <input type="text" id="productType" value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="Ex: Rótulo, Etiqueta" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" required />
        </div>
        <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tamanho Padrão</label>
            <input type="text" id="size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Ex: 5x5cm" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade Mínima</label>
            <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" required min="1" />
        </div>
        <div>
            <label htmlFor="productionTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prazo de Produção</label>
            <input type="text" id="productionTime" value={productionTime} onChange={(e) => setProductionTime(e.target.value)} placeholder="Ex: 5 dias úteis" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" required />
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" required></textarea>
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imagem</label>
        <input type="file" id="image" onChange={handleImageChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"/>
        {image && <img src={image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-md" />}
      </div>
      <div className="flex justify-end pt-2 space-x-2">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">{productToEdit ? 'Atualizar' : 'Adicionar'}</button>
      </div>
    </form>
  );
};

export const Products: React.FC<ProductsProps> = ({ products, addProduct, updateProduct, deleteProduct, toggleProductStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddClick = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.productType.toLowerCase().includes(query) ||
      product.size.toLowerCase().includes(query) ||
      product.productionTime.toLowerCase().includes(query) ||
      product.quantity.toString().includes(query)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Seu Catálogo</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
                type="text"
                placeholder="Buscar em todos os campos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 pl-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-gray-200"
            />
          </div>
          <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm flex-shrink-0">
            <PlusIcon className="h-5 w-5" />
            Adicionar Produto
          </button>
        </div>
      </div>

      {products.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Nenhum produto cadastrado ainda.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Clique em "Adicionar Produto" para começar.</p>
          </div>
      ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado para "{searchQuery}".</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Tente ajustar seus termos de busca.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
              <div className="relative">
                <img src={product.image || 'https://picsum.photos/300/200'} alt={product.name} className={`h-40 w-full object-cover ${!product.isActive && 'grayscale opacity-60'}`} />
                <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
                  {product.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="p-4 flex-grow">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{product.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 h-12 overflow-hidden text-ellipsis">{product.description}</p>
                 <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p><strong>Tipo:</strong> {product.productType}</p>
                    <p><strong>Tamanho:</strong> {product.size}</p>
                    <p><strong>Qtd. Mínima:</strong> {product.quantity} un.</p>
                    <p><strong>Prazo:</strong> {product.productionTime}</p>
                </div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ToggleSwitch 
                        id={`product-toggle-${product.id}`}
                        isOn={product.isActive} 
                        handleToggle={() => toggleProductStatus(product.id, !product.isActive)}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{product.isActive ? 'Visível para IA' : 'Oculto da IA'}</span>
                </div>
                <div className="flex">
                  <button onClick={() => handleEditClick(product)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                    <EditIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => deleteProduct(product.id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}>
        <ProductForm 
          onSubmit={addProduct}
          onUpdate={updateProduct} 
          onClose={() => setIsModalOpen(false)}
          productToEdit={productToEdit}
        />
      </Modal>
    </div>
  );
};
