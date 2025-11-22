import React, { useState, useCallback } from 'react';
import { Product, CartItem, ViewMode, Transaction, ReceiptTemplate, Notification as NotificationType } from './types';
import { INITIAL_PRODUCTS, DEFAULT_RECEIPT_TEMPLATE } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import InventoryView from './components/views/InventoryView';
import ScannerView from './components/views/ScannerView';
import TransactionsView from './components/transactions/TransactionsView';
import ReceiptSettingsView from './components/views/ReceiptSettingsView';
import CheckoutCompletionModal from './components/scanner/CheckoutCompletionModal';
import Notification from './components/Notification';

const App: React.FC = () => {
  const [products, setProducts] = useLocalStorage<Product[]>('inventory_products_ai', INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('inventory_transactions_ai', []);
  const [receiptTemplates, setReceiptTemplates] = useLocalStorage<ReceiptTemplate[]>('inventory_receipt_templates_ai', [DEFAULT_RECEIPT_TEMPLATE]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.INVENTORY);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ id: Date.now(), message, type });
    setTimeout(() => {
        setNotification(null);
    }, 4000);
  }, []);

  const handleAddToCart = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      if (product.quantity <= 0) {
        showNotification(`'${product.name}' is out of stock.`, 'error');
        return;
      }
      
      const existingCartItem = cart.find(item => item.id === product.id);
      if (existingCartItem) {
        if(existingCartItem.quantity >= product.quantity) {
           showNotification(`No more '${product.name}' in stock.`, 'error');
           return;
        }
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        setCart([...cart, { ...product, quantity: 1 }]);
      }
    } else {
      showNotification(`Product with ID ${productId} not found.`, 'error');
    }
  }, [products, cart, showNotification]);

  const handleMultipleProductsToCart = (productIds: string[]) => {
    let updatedCart = [...cart];
    let cartUpdated = false;
    let errorShown = false;

    productIds.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const stockAvailable = product.quantity;
        const existingCartItem = updatedCart.find(item => item.id === product.id);
        const quantityInCart = existingCartItem ? existingCartItem.quantity : 0;

        if (stockAvailable > quantityInCart) {
          if (existingCartItem) {
            updatedCart = updatedCart.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
          } else {
            updatedCart.push({ ...product, quantity: 1 });
          }
          cartUpdated = true;
        } else {
          if (!errorShown) {
            showNotification(`No more '${product.name}' in stock.`, 'error');
            errorShown = true;
          }
        }
      }
    });

    if (cartUpdated) {
      setCart(updatedCart);
    }
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.quantity) {
      showNotification(`Only ${product.quantity} of '${product.name}' available in stock.`, 'error');
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: product.quantity } : item
      ));
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckoutModalOpen(true);
  };

  const handleFinalizeCheckout = (customerDetails: { name: string, phone: string, email: string }) => {
    const newProducts = [...products];
    let updateError = false;

    cart.forEach(cartItem => {
      const productIndex = newProducts.findIndex(p => p.id === cartItem.id);
      if (productIndex !== -1) {
        const newQuantity = newProducts[productIndex].quantity - cartItem.quantity;
        if (newQuantity < 0) {
          showNotification(`Not enough stock for ${newProducts[productIndex].name}. Checkout failed.`, 'error');
          updateError = true;
        } else {
          newProducts[productIndex] = { ...newProducts[productIndex], quantity: newQuantity };
        }
      }
    });

    if (!updateError) {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        items: [...cart],
        totalAmount: cart.reduce((total, item) => total + item.price * item.quantity, 0),
        customerName: customerDetails.name || undefined,
        customerPhone: customerDetails.phone || undefined,
        customerEmail: customerDetails.email || undefined,
      };
      setTransactions(prev => [...prev, newTransaction]);
      setProducts(newProducts);
      setCart([]);
      setIsCheckoutModalOpen(false);
      showNotification('Checkout complete! Transaction saved.', 'success');
    }
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts([...products, { ...product, id: crypto.randomUUID() }]);
    showNotification(`'${product.name}' added successfully.`);
  };
  
  const addMultipleProducts = (newProducts: Omit<Product, 'id'>[]) => {
    const productsToAdd = newProducts.map(p => ({ ...p, id: crypto.randomUUID() }));
    setProducts(prevProducts => [...prevProducts, ...productsToAdd]);
    showNotification(`${newProducts.length} products added successfully.`);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    showNotification(`'${updatedProduct.name}' updated successfully.`);
  };

  const deleteProduct = (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    setProducts(products.filter(p => p.id !== productId));
    if (productToDelete) {
      showNotification(`'${productToDelete.name}' deleted successfully.`);
    }
  };
  
  const clearCart = () => setCart([]);

  const handleUpdateReceiptTemplates = (updatedTemplates: ReceiptTemplate[]) => {
    setReceiptTemplates(updatedTemplates);
    showNotification('Receipt templates updated.');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header viewMode={viewMode} setViewMode={setViewMode} />
      <main className="p-4 sm:p-6 lg:p-8">
        {viewMode === ViewMode.INVENTORY && (
          <InventoryView 
            products={products}
            onAddProduct={addProduct}
            onAddMultipleProducts={addMultipleProducts}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
        )}
        {viewMode === ViewMode.SCANNER && (
          <ScannerView
            products={products}
            cart={cart}
            onProductsIdentified={handleMultipleProductsToCart}
            onAddToCart={handleAddToCart}
            onCheckout={handleCheckout}
            onClearCart={clearCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
          />
        )}
        {viewMode === ViewMode.TRANSACTIONS && (
          <TransactionsView transactions={transactions} receiptTemplates={receiptTemplates} />
        )}
        {viewMode === ViewMode.RECEIPT_SETTINGS && (
          <ReceiptSettingsView
            templates={receiptTemplates}
            onTemplatesChange={handleUpdateReceiptTemplates}
          />
        )}
      </main>
      {isCheckoutModalOpen && (
        <CheckoutCompletionModal
          onClose={() => setIsCheckoutModalOpen(false)}
          onFinalize={handleFinalizeCheckout}
        />
      )}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default App;
