import React, { useState } from 'react';
import { Product } from '../../types';
import ProductTable from '../inventory/ProductTable';
import ProductFormModal from '../inventory/ProductFormModal';
import { PlusIcon } from '../Icons';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onAddMultipleProducts: (products: Omit<Product, 'id'>[]) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ products, onAddProduct, onAddMultipleProducts, onUpdateProduct, onDeleteProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleOpenModalForCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <button
          onClick={handleOpenModalForCreate}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-indigo-600 text-white hover:bg-indigo-700 h-10 py-2 px-4"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>
      <ProductTable 
        products={products} 
        onEdit={handleOpenModalForEdit} 
        onDelete={onDeleteProduct} 
      />
      {isModalOpen && (
        <ProductFormModal 
          product={editingProduct}
          onSave={handleSaveProduct}
          onSaveAll={onAddMultipleProducts}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default InventoryView;