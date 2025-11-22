import React, { useState, useEffect } from 'react';
import { CartItem, Product } from '../../types';
import ScannerComponent from '../scanner/Scanner';
import Cart from '../scanner/Cart';
import { SearchIcon } from '../Icons';

interface ScannerViewProps {
  products: Product[];
  cart: CartItem[];
  onProductsIdentified: (productIds: string[]) => void;
  onAddToCart: (productId: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
  onUpdateCartQuantity: (productId: string, newQuantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
}

const ScannerView: React.FC<ScannerViewProps> = ({ 
    products, 
    cart, 
    onProductsIdentified,
    onAddToCart,
    onCheckout, 
    onClearCart, 
    onUpdateCartQuantity, 
    onRemoveFromCart 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
      return;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    const results = products.filter(product => 
      product.name.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredProducts(results);
  }, [searchQuery, products]);

  const handleAddItem = (productId: string) => {
    onAddToCart(productId);
    // Do not clear search query to allow adding multiple items from search
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products by name to add to cart"
            className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-md leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {filteredProducts.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {filteredProducts.map(product => (
                <li key={product.id} className="text-slate-900 dark:text-slate-200 select-none relative p-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <img src={product.imageBase64} alt={product.name} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                      <div>
                        <span className="font-medium block truncate">{product.name}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(product.price)} - Stock: {product.quantity}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddItem(product.id)}
                      className="ml-4 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                      disabled={product.quantity <= (cart.find(item => item.id === product.id)?.quantity || 0)}
                    >
                      Add
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ScannerComponent products={products} onProductsIdentified={onProductsIdentified} />
      </div>
      <div className="lg:col-span-1">
        <Cart 
            cart={cart} 
            onCheckout={onCheckout}
            onClear={onClearCart}
            onUpdateQuantity={onUpdateCartQuantity}
            onRemoveItem={onRemoveFromCart}
        />
      </div>
    </div>
  );
};

export default ScannerView;
