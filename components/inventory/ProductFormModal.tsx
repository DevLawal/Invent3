import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../../types';
import { GoogleGenAI, Type } from '@google/genai';
import { CameraIcon, FlashlightIcon, CheckIcon, EditIcon, PlusIcon } from '../Icons';

interface ProductFormModalProps {
  product: Product | null;
  onSave: (productData: Omit<Product, 'id'> | Product) => void;
  onSaveAll: (products: Omit<Product, 'id'>[]) => void;
  onClose: () => void;
}

type DetectedProduct = {
  imageBase64: string;
  formData: {
    name: string;
    price: string;
    quantity: string;
  };
  isComplete: boolean;
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onSave, onSaveAll, onClose }) => {
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [status, setStatus] = useState('Ready');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isFlashlightSupported, setIsFlashlightSupported] = useState(false);
  
  const handleDataChange = (index: number, field: string, value: string) => {
    const updatedProducts = detectedProducts.map((p, i) => {
      if (i === index) {
        const newFormData = { ...p.formData, [field]: value };
        const { name, price, quantity } = newFormData;
        return {
          ...p,
          formData: newFormData,
          isComplete: !!(name && price && quantity),
        };
      }
      return p;
    });
    setDetectedProducts(updatedProducts);
  };
  
  const handleSelectProduct = (index: number) => {
    setSelectedProductIndex(index);
    setSaveError(null);
  };
  
  const handleManualAdd = () => {
    const placeholderSvg = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><text x="50" y="55" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">No Image</text></svg>')}`;
    setDetectedProducts([{
      imageBase64: placeholderSvg,
      formData: { name: '', price: '', quantity: '' },
      isComplete: false,
    }]);
    setSelectedProductIndex(0);
    setStatus('Please fill in the product details.');
  };

  const handleAddAnotherProduct = () => {
    const placeholderSvg = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><text x="50" y="55" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">No Image</text></svg>')}`;
    const newProduct: DetectedProduct = {
      imageBase64: placeholderSvg,
      formData: { name: '', price: '', quantity: '' },
      isComplete: false,
    };
    const newProducts = [...detectedProducts, newProduct];
    setDetectedProducts(newProducts);
    setSelectedProductIndex(newProducts.length - 1);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || selectedProductIndex === null) return;
    setStatus('Processing images...');

    const fileList = Array.from(files);
    // FIX: Add explicit type annotation to the 'file' parameter to fix type inference issue.
    const base64Promises = fileList.map((file: File) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    });

    try {
      const base64Images = await Promise.all(base64Promises);
      const newProductsFromImages: DetectedProduct[] = base64Images.map(b64 => ({
        imageBase64: b64,
        formData: { name: '', price: '', quantity: '' },
        isComplete: false,
      }));
      
      const updatedProducts = [...detectedProducts];
      updatedProducts.splice(selectedProductIndex, 1, ...newProductsFromImages);
      setDetectedProducts(updatedProducts);
      setStatus(`Added ${base64Images.length} image(s). Please fill in the details.`);
    } catch (error) {
      console.error("Error reading files:", error);
      setStatus('Error processing images.');
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  useEffect(() => {
    if (product) {
      setDetectedProducts([
        {
          imageBase64: product.imageBase64,
          formData: {
            name: product.name,
            price: product.price.toString(),
            quantity: product.quantity.toString(),
          },
          isComplete: true,
        },
      ]);
      setSelectedProductIndex(0);
    }
  }, [product]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const track = stream.getVideoTracks()[0];
      if (track) {
          const capabilities = track.getCapabilities();
          // @ts-ignore
          if (capabilities.torch) {
            setIsFlashlightSupported(true);
          }
      }
    } catch (err) {
      console.error("Camera error:", err);
      setStatus('Camera permission denied.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
        const stream = streamRef.current;
        streamRef.current = null; // Prevent re-entry

        stream.getTracks().forEach(track => {
            if (track.readyState !== 'live') {
                return;
            }

            if (track.kind === 'video') {
                // @ts-ignore
                const capabilities = track.getCapabilities();
                // @ts-ignore
                if (capabilities.torch) {
                    // @ts-ignore
                    track.applyConstraints({ advanced: [{ torch: false }] })
                        .catch(e => {
                            if (track.readyState === 'live') {
                                console.error("Failed to turn off flash on stop", e);
                            }
                        })
                        .finally(() => {
                            if (track.readyState === 'live') {
                                track.stop();
                            }
                        });
                    return;
                }
            }
            track.stop();
        });
    }
    setIsFlashlightOn(false);
    setIsFlashlightSupported(false);
  }, []);

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraOpen, stopCamera]);


  const toggleFlashlight = async () => {
    if (streamRef.current && isFlashlightSupported) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        const newState = !isFlashlightOn;
        // @ts-ignore
        await track.applyConstraints({ advanced: [{ torch: newState }] });
        setIsFlashlightOn(newState);
      } catch (err) { console.error('Flashlight error:', err); }
    }
  };
  
  const resizeImage = (video: HTMLVideoElement, maxDimension: number): string => {
      let { videoWidth: width, videoHeight: height } = video;
      if (width > maxDimension || height > maxDimension) {
          if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
          } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
          }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.9);
  }
  
  const handleCaptureAndDetect = async () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return;
    setStatus('Capturing...');
    const resizedImageBase64 = resizeImage(videoRef.current, 1024);
    
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = videoRef.current.videoWidth;
    fullCanvas.height = videoRef.current.videoHeight;
    fullCanvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const fullImageBase64 = fullCanvas.toDataURL('image/jpeg', 0.9);

    setIsCameraOpen(false);
    setStatus('Detecting products...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { box: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
            required: ['box'],
          },
        };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { text: "Find all distinct physical products in this image. For each product, provide its bounding box as normalized vertices [ymin, xmin, ymax, xmax]. Respond with a JSON array of objects, where each object has a 'box' key." },
            { inlineData: { mimeType: 'image/jpeg', data: resizedImageBase64.split(',')[1] } }
          ]
        },
        config: { responseMimeType: 'application/json', responseSchema }
      });
      
      const boundingBoxes = JSON.parse(response.text).map((item: any) => item.box);

      if (boundingBoxes.length === 0) {
        setStatus('No products detected. Using full image.');
        setDetectedProducts([{ imageBase64: fullImageBase64, formData: { name: '', price: '', quantity: ''}, isComplete: false }]);
        setSelectedProductIndex(0);
        return;
      }
      
      const image = new Image();
      image.src = fullImageBase64;
      image.onload = () => {
        const croppedProducts: DetectedProduct[] = boundingBoxes.map((box: number[]) => {
          const [ymin, xmin, ymax, xmax] = box;
          const cropCanvas = document.createElement('canvas');
          const cropCtx = cropCanvas.getContext('2d');
          const sx = xmin * image.width;
          const sy = ymin * image.height;
          const sWidth = (xmax - xmin) * image.width;
          const sHeight = (ymax - ymin) * image.height;
          cropCanvas.width = sWidth;
          cropCanvas.height = sHeight;
          cropCtx?.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
          return { imageBase64: cropCanvas.toDataURL('image/jpeg', 0.9), formData: { name: '', price: '', quantity: ''}, isComplete: false };
        });
        setDetectedProducts(croppedProducts);
        setSelectedProductIndex(0);
        setStatus(`Detected ${croppedProducts.length} products. Please fill in the details.`);
      };

    } catch (error: any) {
      console.error("Gemini detection error:", error);
      let errorMessage = 'AI detection failed. Using full image.';
      if (error.message && error.message.includes('500')) {
        errorMessage = 'AI service is unavailable. Please try again.';
      }
      setStatus(errorMessage);
      setDetectedProducts([{ imageBase64: fullImageBase64, formData: { name: '', price: '', quantity: ''}, isComplete: false }]);
      setSelectedProductIndex(0);
    }
  };

  const handleSaveAll = () => {
    const incompleteProductIndex = detectedProducts.findIndex(p => !p.isComplete);
    if(incompleteProductIndex !== -1) {
      setSaveError(`Please complete the details for product ${incompleteProductIndex + 1}.`);
      setSelectedProductIndex(incompleteProductIndex);
      return;
    }
    setSaveError(null);
    const newProducts = detectedProducts.map(p => ({
      name: p.formData.name,
      price: parseFloat(p.formData.price) || 0,
      quantity: parseInt(p.formData.quantity, 10) || 0,
      imageBase64: p.imageBase64,
    }));
    onSaveAll(newProducts);
    onClose();
  }

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (product?.id && selectedProductIndex !== null) {
        const currentData = detectedProducts[selectedProductIndex].formData;
        onSave({
            id: product.id,
            name: currentData.name,
            price: parseFloat(currentData.price) || 0,
            quantity: parseInt(currentData.quantity, 10) || 0,
            imageBase64: detectedProducts[selectedProductIndex].imageBase64,
        });
        onClose();
    }
  };


  if (isCameraOpen) {
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-stretch p-4">
            <div className="relative flex-1 w-full bg-slate-800 rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                <div className="absolute top-2 left-2 right-2 text-white text-center bg-black/50 p-1 rounded-md">{status}</div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center space-x-4 pt-4">
                <button onClick={() => setIsCameraOpen(false)} className="px-4 py-2 bg-slate-700/80 text-white rounded-lg">Cancel</button>
                <button onClick={handleCaptureAndDetect} className="p-4 bg-indigo-600 text-white rounded-full"><CameraIcon className="w-8 h-8" /></button>
                {isFlashlightSupported && (
                <button onClick={toggleFlashlight} className={`p-3 rounded-full ${isFlashlightOn ? 'bg-amber-400' : 'bg-slate-700/80 text-white'}`}>
                    <FlashlightIcon className="w-6 h-6" />
                </button>
                )}
            </div>
        </div>
    );
  }

  const currentProductData = selectedProductIndex !== null ? detectedProducts[selectedProductIndex]?.formData : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <form onSubmit={handleSaveSingle}>
           <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*" className="hidden"/>
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-white mb-2">
              {product ? 'Edit Product' : 'Add New Product(s)'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{status}</p>
            
            {detectedProducts.length === 0 ? (
                <div className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" onClick={() => setIsCameraOpen(true)} className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <CameraIcon className="w-10 h-10 mb-2" />
                            <span className="font-medium">Add with Camera</span>
                        </button>
                        <button type="button" onClick={handleManualAdd} className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <EditIcon className="w-10 h-10 mb-2" />
                            <span className="font-medium">Add Manually</span>
                        </button>
                    </div>
                </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 overflow-x-auto p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg mb-4">
                  {detectedProducts.map((p, index) => (
                    <div 
                      key={index}
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={() => {
                        if (selectedProductIndex === index) {
                          fileInputRef.current?.click();
                        } else {
                          handleSelectProduct(index);
                        }
                      }}
                    >
                      <img 
                        src={p.imageBase64} 
                        alt={`Product ${index + 1}`} 
                        className={`w-20 h-20 rounded-md object-cover border-4 ${selectedProductIndex === index ? 'border-indigo-500' : p.isComplete ? 'border-green-500' : 'border-transparent'}`}
                      />
                      {p.isComplete && !product && (
                        <div className="absolute top-0 right-0 bg-green-500 rounded-full p-1 m-1">
                          <CheckIcon className="w-3 h-3 text-white"/>
                        </div>
                      )}
                      {selectedProductIndex === index && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white pointer-events-none rounded-md">
                          <CameraIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  ))}
                  {!product && (
                     <button type="button" onClick={handleAddAnotherProduct} className="flex-shrink-0 w-20 h-20 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" aria-label="Add another product">
                        <PlusIcon className="w-8 h-8" />
                     </button>
                  )}
                </div>
              </div>
            )}
            
            {currentProductData && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                 <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Product Name</label>
                  <input type="text" name="name" value={currentProductData.name} onChange={(e) => handleDataChange(selectedProductIndex!, 'name', e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Price (NGN)</label>
                    <input type="number" name="price" value={currentProductData.price} onChange={(e) => handleDataChange(selectedProductIndex!, 'price', e.target.value)} required min="0" step="0.01" className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"/>
                  </div>
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</label>
                    <input type="number" name="quantity" value={currentProductData.quantity} onChange={(e) => handleDataChange(selectedProductIndex!, 'quantity', e.target.value)} required min="0" step="1" className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-700"/>
                  </div>
                </div>
                {saveError && <p className="text-sm text-red-500">{saveError}</p>}
              </div>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
             {product ? (
                <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm">
                    Save Changes
                </button>
             ) : (
                <button type="button" onClick={handleSaveAll} disabled={detectedProducts.length === 0} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                    Save All Products
                </button>
             )}
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;