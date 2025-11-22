import React from 'react';
import { ViewMode } from '../types';
import { InventoryIcon, ScanIcon, TransactionIcon, ReceiptIcon } from './Icons';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
  const inactiveTab = "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700";
  const activeTab = "border-indigo-500 text-indigo-600 dark:text-indigo-400";

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            SuperScan<span className="text-indigo-500">.</span>
          </h1>
          <nav>
            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex -mb-px space-x-6">
                <button
                  onClick={() => setViewMode(ViewMode.INVENTORY)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200 ${viewMode === ViewMode.INVENTORY ? activeTab : inactiveTab}`}
                  aria-label="Inventory"
                >
                  <InventoryIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.SCANNER)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200 ${viewMode === ViewMode.SCANNER ? activeTab : inactiveTab}`}
                  aria-label="Checkout Scanner"
                >
                  <ScanIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.TRANSACTIONS)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200 ${viewMode === ViewMode.TRANSACTIONS ? activeTab : inactiveTab}`}
                  aria-label="Transactions"
                >
                  <TransactionIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode(ViewMode.RECEIPT_SETTINGS)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200 ${viewMode === ViewMode.RECEIPT_SETTINGS ? activeTab : inactiveTab}`}
                  aria-label="Receipt Settings"
                >
                  <ReceiptIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
