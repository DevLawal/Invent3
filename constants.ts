import { Product, ReceiptTemplate } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const DEFAULT_RECEIPT_TEMPLATE: ReceiptTemplate = {
  id: crypto.randomUUID(),
  name: 'Default Template',
  brandColor: '#4f46e5', // Equivalent to Tailwind's indigo-600
  logoBase64: null,
  headerText: 'Thank you for your business!',
  footerText: 'Please contact us if you have any questions.',
  socialLinks: {
    twitter: '',
    instagram: '',
    facebook: '',
  },
};
