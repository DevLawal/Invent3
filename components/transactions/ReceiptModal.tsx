import React, { useState, useEffect } from 'react';
import { Transaction, ReceiptTemplate } from '../../types';
import { PrintIcon, EmailIcon, CheckIcon } from '../Icons';

interface ReceiptModalProps {
  transaction: Transaction | null;
  receiptTemplates: ReceiptTemplate[];
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const generateReceiptHtml = (transaction: Transaction, template: ReceiptTemplate): string => {
  const {
    brandColor,
    logoBase64,
    headerText,
    footerText,
    socialLinks,
  } = template;
  
  const itemsHtml = transaction.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #334155;">${item.name}</td>
      <td style="text-align: center; padding: 12px 0; border-bottom: 1px solid #334155;">${item.quantity}</td>
      <td style="text-align: right; padding: 12px 0; border-bottom: 1px solid #334155;">${formatCurrency(item.price)}</td>
      <td style="text-align: right; padding: 12px 0; border-bottom: 1px solid #334155;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const socialLinksHtml = [
    socialLinks.twitter && ` | <a href="${socialLinks.twitter}" style="color: ${brandColor}; text-decoration: none;">Twitter</a>`,
    socialLinks.instagram && ` | <a href="${socialLinks.instagram}" style="color: ${brandColor}; text-decoration: none;">Instagram</a>`,
    socialLinks.facebook && ` | <a href="${socialLinks.facebook}" style="color: ${brandColor}; text-decoration: none;">Facebook</a>`,
  ].filter(Boolean).join('').substring(3);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Receipt from SuperScan</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #1e293b; color: #cbd5e1;">
      <div style="max-width: 600px; margin: 20px auto; background-color: #0f172a; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${brandColor}; color: #ffffff; padding: 24px; text-align: center;">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Brand Logo" style="max-height: 50px; margin-bottom: 12px;">` : `<h1 style="font-size: 24px; margin:0;">SuperScan</h1>`}
          <p style="margin: 8px 0 0;">${headerText}</p>
        </div>
        <div style="padding: 24px;">
          <p>Hello ${transaction.customerName || 'Valued Customer'},</p>
          <p>Your recent purchase with SuperScan has been confirmed.</p>
          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            Transaction ID: ${transaction.id}<br>
            Date: ${new Date(transaction.date).toLocaleString()}
          </p>
          <h3 style="color: ${brandColor}; margin-top: 24px; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 8px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 12px 0; color: #94a3b8; font-weight: normal; border-bottom: 1px solid #334155; text-transform: uppercase; font-size: 12px;">Item</th>
                <th style="text-align: center; padding: 12px 0; color: #94a3b8; font-weight: normal; border-bottom: 1px solid #334155; text-transform: uppercase; font-size: 12px;">Qty</th>
                <th style="text-align: right; padding: 12px 0; color: #94a3b8; font-weight: normal; border-bottom: 1px solid #334155; text-transform: uppercase; font-size: 12px;">Price</th>
                <th style="text-align: right; padding: 12px 0; color: #94a3b8; font-weight: normal; border-bottom: 1px solid #334155; text-transform: uppercase; font-size: 12px;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align: right; margin-top: 16px; border-top: 2px solid #334155; padding-top: 16px;">
            <strong style="font-size: 18px; font-weight: bold;">Grand Total: ${formatCurrency(transaction.totalAmount)}</strong>
          </div>
        </div>
        <div style="padding: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>${footerText}</p>
          ${socialLinksHtml ? `<p>${socialLinksHtml}</p>` : ''}
          <p style="margin-top: 16px;">&copy; ${new Date().getFullYear()} SuperScan. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, receiptTemplates, onClose }) => {
  const [showEmailView, setShowEmailView] = useState(false);
  const [emailHtml, setEmailHtml] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(receiptTemplates[0]?.id || '');

  useEffect(() => {
    // Reset state when a new transaction is opened
    if (transaction) {
      setShowEmailView(false);
      setCopyStatus('');
      if (receiptTemplates.length > 0) {
        setSelectedTemplateId(receiptTemplates[0].id);
      }
    }
  }, [transaction, receiptTemplates]);

  useEffect(() => {
    if (transaction) {
      const selectedTemplate = receiptTemplates.find(t => t.id === selectedTemplateId) || receiptTemplates[0];
      if (selectedTemplate) {
        setEmailHtml(generateReceiptHtml(transaction, selectedTemplate));
      }
    }
  }, [transaction, selectedTemplateId, receiptTemplates]);

  if (!transaction) return null;

  const handlePrint = () => {
    const printable = document.getElementById('receipt-iframe');
    if (printable && (printable as HTMLIFrameElement).contentWindow) {
      const iframeWindow = (printable as HTMLIFrameElement).contentWindow;
      iframeWindow.focus();
      iframeWindow.print();
    }
  };

  const handleCopyToClipboard = () => {
    if (!emailHtml) return;

    // A legacy fallback using an event listener for broader compatibility.
    const legacyCopy = () => {
      const listener = (e: ClipboardEvent) => {
        if (e.clipboardData) {
          e.clipboardData.setData('text/html', emailHtml);
          // Simple text fallback for applications that don't support HTML.
          e.clipboardData.setData('text/plain', emailHtml.replace(/<[^>]+>/g, ''));
          e.preventDefault();
        }
      };
      
      try {
        document.addEventListener('copy', listener);
        // This may fail in some sandboxed environments, but it's our best legacy shot.
        const success = document.execCommand('copy');
        if (success) {
          setCopyStatus('Copied!');
        } else {
          setCopyStatus('Copy failed');
        }
      } catch (err) {
        console.error('Legacy copy failed:', err);
        setCopyStatus('Copy failed');
      } finally {
        document.removeEventListener('copy', listener);
        setTimeout(() => setCopyStatus(''), 2000);
      }
    };
    
    // Modern Clipboard API approach
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        const htmlBlob = new Blob([emailHtml], { type: 'text/html' });
        const plainTextBlob = new Blob([emailHtml.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
        const item = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': plainTextBlob,
        });

        navigator.clipboard.write([item]).then(() => {
          setCopyStatus('Copied!');
          setTimeout(() => setCopyStatus(''), 2000);
        }).catch(err => {
          console.error('Async clipboard write failed, trying legacy:', err);
          legacyCopy();
        });
      } catch (err) {
        console.error('ClipboardItem error, trying legacy:', err);
        legacyCopy();
      }
    } else {
      // If modern API is not available at all
      legacyCopy();
    }
  };

  const handleOpenEmailClient = () => {
     if (!transaction) return;
    let recipientEmail = transaction.customerEmail || prompt("Enter customer's email address:");
    if (!recipientEmail || !recipientEmail.includes('@')) {
       if(recipientEmail) alert('Invalid email address provided.');
       return;
    }
    const emailSubject = `Your Receipt from SuperScan (ID: ${transaction.id.slice(0, 8)})`;
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent('\n\nPlease paste the receipt here.')}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-full flex flex-col">
        {showEmailView ? (
          <>
            <div className="p-6 overflow-y-auto">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Email Preview &amp; Send</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Follow these steps to send the receipt:</p>
                <div className="mt-4 space-y-3 text-sm">
                    <p><strong className="text-indigo-500">Step 1:</strong> Click "Copy Receipt" to copy the formatted receipt.</p>
                    <p><strong className="text-indigo-500">Step 2:</strong> Click "Open Email" to start a new draft.</p>
                    <p><strong className="text-indigo-500">Step 3:</strong> Paste the receipt into the email body and send.</p>
                </div>
                <div className="mt-4 w-full h-48 border border-slate-200 dark:border-slate-700 rounded-md bg-white">
                    <iframe srcDoc={emailHtml} title="Email Preview" className="w-full h-full"/>
                </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex gap-3">
                    <button onClick={handleCopyToClipboard} className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700">
                        {copyStatus ? <><CheckIcon className="w-5 h-5 mr-2"/> {copyStatus}</> : '1. Copy Receipt'}
                    </button>
                    <button onClick={handleOpenEmailClient} className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700">
                        2. Open Email
                    </button>
                </div>
                <button onClick={() => setShowEmailView(false)} className="w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700">
                    Back to Receipt
                </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">Transaction Receipt</h2>
              <div className="mb-4">
                <label htmlFor="template-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Receipt Template</label>
                <select 
                  id="template-select" 
                  value={selectedTemplateId} 
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {receiptTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full h-96 border border-slate-200 dark:border-slate-700 rounded-md bg-white">
                <iframe id="receipt-iframe" srcDoc={emailHtml} title="Receipt Preview" className="w-full h-full"/>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row-reverse sm:justify-between items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Close
              </button>
              <div className="w-full sm:w-auto">
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handlePrint} className="w-full sm:w-auto flex-1 inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-600 text-base font-medium text-white hover:bg-slate-700">
                        <PrintIcon className="w-5 h-5 mr-2" /> Print
                    </button>
                    <button 
                      onClick={() => setShowEmailView(true)} 
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700"
                    >
                      <EmailIcon className="w-5 h-5 mr-2" /> Email
                    </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReceiptModal;