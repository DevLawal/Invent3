import React from 'react';
import { CartItem } from '../../types';
import { ClearIcon, CheckoutIcon, PlusIcon, MinusIcon, DeleteIcon } from '../Icons';

interface CartProps {
  cart: CartItem[];
  onCheckout: () => void;
  onClear: () => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

const Cart: React.FC<CartProps> = ({ cart, onCheckout, onClear, onUpdateQuantity, onRemoveItem }) => {
  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Shopping Cart</h3>
        <button
          onClick={onClear}
          disabled={cart.length === 0}
          className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Clear cart"
        >
          <ClearIcon className="w-5 h-5"/>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto -mr-6 pr-6">
        {cart.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-10">Scan an item or use search to begin.</p>
        ) : (
          <ul className="divide-y divide-y-slate-200 dark:divide-slate-700">
            {cart.map(item => (
              <li key={item.id} className="py-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <img src={item.imageBase64} alt={item.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-2 space-x-2">
                   <button onClick={() => onRemoveItem(item.id)} className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                      <DeleteIcon className="w-4 h-4" />
                    </button>
                  <div className="flex items-center space-x-1 border border-slate-300 dark:border-slate-600 rounded-full p-1">
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10) || 0)}
                      className="w-10 text-center bg-transparent border-none focus:ring-0 text-sm font-medium"
                      min="0"
                    />
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4">
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-lg font-medium">Total:</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalPrice)}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-indigo-600 text-white hover:bg-indigo-700 h-12 py-2 px-4"
        >
          <CheckoutIcon className="w-5 h-5 mr-2" />
          Complete Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
