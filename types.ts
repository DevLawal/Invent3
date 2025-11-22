export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageBase64: string;
}

export interface CartItem extends Product {
  quantity: number; // Override Product's quantity to represent cart quantity
}

export enum ViewMode {
  INVENTORY = 'INVENTORY',
  SCANNER = 'SCANNER',
  TRANSACTIONS = 'TRANSACTIONS',
  RECEIPT_SETTINGS = 'RECEIPT_SETTINGS',
}

export interface Transaction {
  id: string;
  date: string; // ISO string for simplicity with JSON
  items: CartItem[];
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface ReceiptTemplate {
  id: string;
  name: string;
  brandColor: string;
  logoBase64: string | null;
  headerText: string;
  footerText: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    facebook: string;
  };
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}
