import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Product } from '../../types';
import { ScanIcon, FlashlightIcon, CameraIcon } from '../Icons';

interface ScannerProps {
  products: Product[];
  onProductsIdentified: (productIds: string[]) => void;
}

const ScannerComponent: React.FC<ScannerProps> = ({ products, onProductsIdentified }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Flashlight specific state
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isFlashlightSupported, setIsFlashlightSupported] = useState(false);
  
  const identifyProduct = useCallback(async (imageData: string) => {
    if (products.length === 0) {
      setStatus('No products in inventory to compare.');
      return;
    }
    
    setStatus('Identifying product(s)...');
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        setStatus('API Key not configured.');
        console.error("API_KEY environment variable not set.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });

      const parts = [
        { text: `From the list of products provided, identify all products visible in the image. Respond with ONLY a comma-separated list of the product IDs (e.g., '1a2b3c,4d5e6f'). If no products from the list match, respond with 'NONE'.\n\nProducts:\n${products.map(p => `ID: ${p.id}, Name: ${p.name}`).join('\n')}` },
        { inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
      });
      
      const responseText = response.text.trim();
      
      if (responseText.toUpperCase() === 'NONE' || responseText === '') {
        setStatus('No products recognized. Try again.');
        setTimeout(() => setStatus('Ready to scan'), 2000);
        return;
      }

      const allProductIds = new Set(products.map(p => p.id));
      const foundIds = responseText
        .split(',')
        .map(id => id.trim())
        .filter(id => allProductIds.has(id));

      if (foundIds.length > 0) {
        const foundNames = foundIds.map(id => products.find(p => p.id === id)?.name).filter(Boolean);
        setStatus(`Found: ${foundNames.join(', ')}`);
        onProductsIdentified(foundIds);
        setLastResult(foundIds.join(','));
        
        setTimeout(() => {
          setLastResult(null);
          setStatus('Ready to scan');
        }, 2000); 
      } else {
        setStatus('Product not recognized. Try again.');
        setTimeout(() => setStatus('Ready to scan'), 2000);
      }
    } catch (error: any) {
      console.error("Gemini API error:", error);
      let errorMessage = 'AI identification failed.';
      if (error.message && error.message.includes('500')) {
          errorMessage = 'AI service is unavailable. Please try again.';
      }
      setStatus(errorMessage);
      setTimeout(() => setStatus('Ready to scan'), 3000);
    }
  }, [products, onProductsIdentified]);

  const handleManualScan = useCallback(() => {
    if (videoRef.current && canvasRef.current && lastResult === null) {
      if(videoRef.current.videoWidth === 0) {
        setStatus("Camera not ready. Please wait.");
        return;
      }
      setStatus('Capturing...');
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Resize logic
      const MAX_DIMENSION = 1024;
      let { videoWidth: width, videoHeight: height } = video;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
          } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
          }
      }
      
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        identifyProduct(dataUrl);
      }
    }
  }, [identifyProduct, lastResult]);

  const toggleFlashlight = async () => {
    if (streamRef.current && isFlashlightSupported) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
          try {
            const newFlashlightState = !isFlashlightOn;
            // @ts-ignore
            await track.applyConstraints({ advanced: [{ torch: newFlashlightState }] });
            setIsFlashlightOn(newFlashlightState);
          } catch (err) {
            console.error('Error toggling flashlight:', err);
          }
      }
    }
  };

  useEffect(() => {
    const startCamera = async () => {
      setStatus('Initializing camera...');
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera not supported on this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
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
        setStatus('Ready to scan');
      } catch (err) {
        console.error("Error starting camera:", err);
        setStatus('Camera error. Please grant permission.');
      }
    };
    
    if (isCameraOpen) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        const stream = streamRef.current;
        streamRef.current = null; // Prevent re-entry

        stream.getTracks().forEach(track => {
            if (track.readyState !== 'live') return;

            if (track.kind === 'video') {
                // @ts-ignore
                if (track.getCapabilities().torch) {
                    // @ts-ignore
                    track.applyConstraints({ advanced: [{ torch: false }] })
                        .catch(e => console.error("Scanner: Failed to turn off flash on cleanup", e))
                        .finally(() => track.stop());
                    return;
                }
            }
            track.stop();
        });
      }
      setIsFlashlightOn(false);
      setIsFlashlightSupported(false);
    };
  }, [isCameraOpen]);
  
  if (!isCameraOpen) {
    return (
      <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-lg flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <ScanIcon className="w-16 h-16 mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-white">Scan Products</h3>
        <p className="mb-6">Click the button below to start your camera.</p>
        <button
          onClick={() => setIsCameraOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-indigo-600 text-white hover:bg-indigo-700 h-10 py-2 px-4"
        >
          <CameraIcon className="w-5 h-5 mr-2" />
          Start Scanner
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <div className="absolute inset-0 bg-black bg-opacity-20 flex flex-col justify-between p-4">
        <div className="bg-black/50 text-white text-center text-sm font-medium py-1 px-3 rounded-full self-center backdrop-blur-sm">
          {status}
        </div>
        <div className="flex items-center justify-center space-x-4">
            <button onClick={() => setIsCameraOpen(false)} className="px-4 py-2 bg-slate-700/80 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium">Cancel</button>
            <button
              onClick={handleManualScan}
              disabled={lastResult !== null}
              className="p-4 rounded-full font-semibold shadow-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              aria-label="Scan Product"
            >
              <ScanIcon className="w-8 h-8" />
            </button>
            {isFlashlightSupported ? (
               <button 
                onClick={toggleFlashlight} 
                className={`p-3 rounded-full shadow-lg transition-colors ${isFlashlightOn ? 'bg-amber-400 text-slate-900' : 'bg-slate-700/80 text-white hover:bg-slate-600'}`}
               >
                <FlashlightIcon className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-[52px]"></div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ScannerComponent;