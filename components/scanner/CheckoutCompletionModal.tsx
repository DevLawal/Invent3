import React, { useState } from 'react';

interface CheckoutCompletionModalProps {
  onClose: () => void;
  onFinalize: (customerDetails: { name: string, phone: string, email: string }) => void;
}

const CheckoutCompletionModal: React.FC<CheckoutCompletionModalProps> = ({ onClose, onFinalize }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFinalize({ name, phone, email });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-white">Complete Transaction</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter customer details (optional).</p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="customer-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Customer Name</label>
                <input
                  type="text"
                  id="customer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="customer-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Customer Phone</label>
                <input
                  type="tel"
                  id="customer-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="08012345678"
                />
              </div>
              <div>
                <label htmlFor="customer-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Customer Email</label>
                <input
                  type="email"
                  id="customer-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Finalize & Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CheckoutCompletionModal;
