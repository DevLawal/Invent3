import React, { useState } from 'react';
import { Transaction, ReceiptTemplate } from '../../types';
import ReceiptModal from './ReceiptModal';
import { TransactionIcon } from '../Icons';

interface TransactionsViewProps {
  transactions: Transaction[];
  receiptTemplates: ReceiptTemplate[];
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, receiptTemplates }) => {
  const [viewingReceipt, setViewingReceipt] = useState<Transaction | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };
  
  // Sort transactions from newest to oldest
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow">
          <TransactionIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No transactions found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Complete a checkout to see it here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow">
          <table className="min-w-full text-sm divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Items</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Total</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedTransactions.map(t => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{t.customerName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{t.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{formatCurrency(t.totalAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => setViewingReceipt(t)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <ReceiptModal
        transaction={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        receiptTemplates={receiptTemplates}
      />
    </div>
  );
};

export default TransactionsView;
