
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, PhotoIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface FurnitureTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productImage: string;
  productName: string;
}

export const FurnitureTryOnModal: React.FC<FurnitureTryOnModalProps> = ({ isOpen, onClose, productImage, productName }) => {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRoomImage(url);
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStartRef.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setPosition({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col h-[80vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <Dialog.Title as="h3" className="text-xl font-serif text-brand-brown">
                    Примерка: {productName}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
                  
                  {/* Canvas Area */}
                  <div 
                    ref={containerRef}
                    className="flex-grow bg-[#F0F0F0] relative overflow-hidden flex items-center justify-center cursor-move"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                  >
                    {roomImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={roomImage} alt="Room" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center pointer-events-none">
                        <PhotoIcon className="w-16 h-16 mb-2" />
                        <p>Загрузите фото комнаты</p>
                      </div>
                    )}

                    {/* Draggable Product */}
                    {roomImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                            src={productImage} 
                            alt={productName}
                            draggable={false}
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleMouseDown}
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                cursor: isDragging ? 'grabbing' : 'grab',
                                mixBlendMode: removeBackground ? 'multiply' : 'normal', // Simple background removal for white backgrounds
                            }}
                            className="absolute max-w-[200px] select-none touch-none"
                        />
                    )}
                  </div>

                  {/* Sidebar Controls */}
                  <div className="w-full md:w-80 bg-white border-l border-gray-100 p-6 flex flex-col gap-6 z-10 shadow-lg">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">1. Фото комнаты</label>
                        <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-brown hover:bg-brand-cream/20 transition-colors">
                            <span className="text-brand-brown font-medium flex items-center gap-2">
                                <PhotoIcon className="w-5 h-5" />
                                {roomImage ? 'Заменить фото' : 'Загрузить фото'}
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>

                    {roomImage && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">2. Размер мебели</label>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">Меньше</span>
                                    <input 
                                        type="range" 
                                        min="0.5" 
                                        max="2.5" 
                                        step="0.1" 
                                        value={scale} 
                                        onChange={(e) => setScale(parseFloat(e.target.value))}
                                        className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-brown"
                                    />
                                    <span className="text-xs text-gray-500">Больше</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Убрать белый фон</span>
                                <button 
                                    onClick={() => setRemoveBackground(!removeBackground)}
                                    className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${removeBackground ? 'bg-brand-brown' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${removeBackground ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="mt-auto bg-blue-50 p-4 rounded-xl text-xs text-blue-800 border border-blue-100">
                                <p>💡 Перетаскивайте мебель пальцем или мышкой. Используйте ползунок для изменения размера.</p>
                            </div>
                        </>
                    )}
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
