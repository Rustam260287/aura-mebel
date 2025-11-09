import React, { useState, Suspense, memo, useMemo, useCallback } from 'react';
// FIX: import extend to manually register THREE components as JSX elements.
import { Canvas, useLoader, extend } from '@react-three/fiber';
import { OrbitControls, useTexture, Text, TransformControls, Box } from '@react-three/drei';
// FIX: import THREE classes that will be used as JSX elements.
import { TextureLoader, RepeatWrapping, Vector3, MeshStandardMaterial, Mesh, PlaneGeometry, AmbientLight, DirectionalLight, PointLight, Group } from 'three';
import type { Product } from '../types';
import { generateSeamlessTexture } from '../services/geminiService';
import { Button } from './Button';
import { SparklesIcon, LoadingIcon } from './Icons';

// FIX: Explicitly extend THREE components to make them available as JSX elements for react-three-fiber.
extend({ Mesh, PlaneGeometry, MeshStandardMaterial, AmbientLight, DirectionalLight, PointLight, Group });

// Helper to manage texture loading with state
// FIX: Correct the type for 'args' from [number, number, number] to [number, number] to match the expected props for planeGeometry.
const TexturedMesh: React.FC<{ textureUrl: string; a_o: string; roughness: string; normal: string; position: [number, number, number]; rotation: [number, number, number]; args: [number, number] }> = memo(({ textureUrl, a_o, roughness, normal, position, rotation, args }) => {
    const [map, aoMap, roughnessMap, normalMap] = useTexture([textureUrl, a_o, roughness, normal]);
    
    // Configure texture wrapping for tiling
    [map, aoMap, roughnessMap, normalMap].forEach(tex => {
        tex.wrapS = tex.wrapT = RepeatWrapping;
        tex.repeat.set(args[0] / 4, args[1] / 4); // Adjust tiling based on plane size
    });

    return (
        <mesh position={position} rotation={rotation}>
            <planeGeometry args={args} />
            <meshStandardMaterial map={map} aoMap={aoMap} roughnessMap={roughnessMap} normalMap={normalMap} />
        </mesh>
    );
});


const Furniture: React.FC<{ product: Product; position: Vector3; onSelect: () => void; isSelected: boolean }> = ({ product, position, onSelect, isSelected }) => {
    const color = isSelected ? '#DAA520' : '#AF4E2E';
    
    return (
        <Box args={[1.5, 1, 2]} position={position} onClick={onSelect}>
             <meshStandardMaterial color={color} />
        </Box>
    );
};


// Main 3D Scene
const ShowroomScene: React.FC<{ wallTexture: string; floorTexture: string; furniture: any[]; onSelectFurniture: (id: string | null) => void; selectedFurnitureId: string | null; onUpdatePosition: (id: string, position: Vector3) => void; }> = memo(({ wallTexture, floorTexture, furniture, onSelectFurniture, selectedFurnitureId, onUpdatePosition }) => {
    const [
        defaultWall, defaultWallAO, defaultWallRoughness, defaultWallNormal,
        defaultFloor, defaultFloorAO, defaultFloorRoughness, defaultFloorNormal,
    ] = useLoader(TextureLoader, [
        'https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Fwhite_plaster_diff.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Fwhite_plaster_ao.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Fwhite_plaster_rough.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Fwhite_plaster_nor_gl.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Flight_herringbone_wood_diff.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Flight_herringbone_wood_ao.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Flight_herringbone_wood_rough.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Flight_herringbone_wood_nor_gl.jpg?alt=media',
    ]);
    
    const selectedItem = useMemo(() => furniture.find(f => f.id === selectedFurnitureId), [furniture, selectedFurnitureId]);

    return (
        <Suspense fallback={null}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 10, 7]} intensity={2} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={1} />

            {/* Room */}
            <group onClick={() => onSelectFurniture(null)}>
                <TexturedMesh textureUrl={floorTexture} a_o={defaultFloorAO.image.src} roughness={defaultFloorRoughness.image.src} normal={defaultFloorNormal.image.src} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[10, 10]} />
                <TexturedMesh textureUrl={wallTexture} a_o={defaultWallAO.image.src} roughness={defaultWallRoughness.image.src} normal={defaultWallNormal.image.src} position={[0, 2.5, -5]} rotation={[0, 0, 0]} args={[10, 5]} />
                <TexturedMesh textureUrl={wallTexture} a_o={defaultWallAO.image.src} roughness={defaultWallRoughness.image.src} normal={defaultWallNormal.image.src} position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} args={[10, 5]} />
            </group>
            
            {/* Furniture */}
            {furniture.map((item) => (
                <Furniture
                    key={item.id}
                    product={item.product}
                    position={item.position}
                    onSelect={() => onSelectFurniture(item.id)}
                    isSelected={item.id === selectedFurnitureId}
                />
            ))}
            
            {selectedItem && (
                 <TransformControls
                    object={null} // Hack to avoid direct attachment
                    position={selectedItem.position}
                    onMouseUp={(e: any) => {
                        // FIX: The event target for TransformControls is the control instance itself.
                        // We access its position property after a drag operation to get the new coordinates.
                        if (e?.target) {
                           onUpdatePosition(selectedItem.id, e.target.position);
                        }
                    }}
                 >
                    <Box position={new Vector3(0,0,0)} material-transparent={true} material-opacity={0} />
                 </TransformControls>
            )}

            <OrbitControls minDistance={2} maxDistance={15} enablePan={false} />
        </Suspense>
    );
});

const ControlPanel: React.FC<{ onGenerate: (target: 'wall' | 'floor', prompt: string) => void; isLoading: Record<string, boolean>; onAddFurniture: (product: Product) => void; availableProducts: Product[] }> = memo(({ onGenerate, isLoading, onAddFurniture, availableProducts }) => {
    const [wallPrompt, setWallPrompt] = useState('светлая декоративная штукатурка');
    const [floorPrompt, setFloorPrompt] = useState('паркет из темного дуба');
    
    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-lg shadow-xl space-y-6">
            <div>
                <label className="block text-lg font-semibold text-brand-charcoal mb-2">Отделка стен</label>
                <div className="flex gap-2">
                    <input type="text" value={wallPrompt} onChange={(e) => setWallPrompt(e.target.value)} placeholder="например, бетон, кирпич" className="flex-grow p-2 border rounded-md w-full bg-white/50 border-gray-300 focus:ring-brand-brown focus:border-brand-brown" />
                    <Button onClick={() => onGenerate('wall', wallPrompt)} disabled={isLoading.wall} className="flex-shrink-0">
                        {isLoading.wall ? <LoadingIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
            <div>
                <label className="block text-lg font-semibold text-brand-charcoal mb-2">Отделка пола</label>
                <div className="flex gap-2">
                    <input type="text" value={floorPrompt} onChange={(e) => setFloorPrompt(e.target.value)} placeholder="например, деревянные доски, плитка" className="flex-grow p-2 border rounded-md w-full bg-white/50 border-gray-300 focus:ring-brand-brown focus:border-brand-brown" />
                    <Button onClick={() => onGenerate('floor', floorPrompt)} disabled={isLoading.floor} className="flex-shrink-0">
                        {isLoading.floor ? <LoadingIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
            <div>
                 <label className="block text-lg font-semibold text-brand-charcoal mb-2">Добавить мебель</label>
                 <select onChange={(e) => {
                     const product = availableProducts.find(p => p.id === e.target.value);
                     if (product) {
                        onAddFurniture(product);
                        e.target.value = ""; // Reset select
                     }
                 }} className="w-full p-2 border rounded-md bg-white/50 border-gray-300 focus:ring-brand-brown focus:border-brand-brown">
                    <option value="">Выберите товар...</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
            </div>
        </div>
    );
});

// FIX: Add the main page component and export it to resolve the import error in App.tsx.
interface VirtualShowroomPageProps {
    allProducts: Product[];
}

export const VirtualShowroomPage: React.FC<VirtualShowroomPageProps> = memo(({ allProducts }) => {
    const [wallTexture, setWallTexture] = useState('https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Fwhite_plaster_diff.jpg?alt=media');
    const [floorTexture, setFloorTexture] = useState('https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.appspot.com/o/textures%2Flight_herringbone_wood_diff.jpg?alt=media');
    const [isLoading, setIsLoading] = useState({ wall: false, floor: false });
    const [furniture, setFurniture] = useState<any[]>([]);
    const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);

    const handleGenerateTexture = useCallback(async (target: 'wall' | 'floor', prompt: string) => {
        setIsLoading(prev => ({ ...prev, [target]: true }));
        try {
            const base64Image = await generateSeamlessTexture(prompt);
            const dataUrl = `data:image/png;base64,${base64Image}`;
            if (target === 'wall') {
                setWallTexture(dataUrl);
            } else {
                setFloorTexture(dataUrl);
            }
        } catch (error) {
            console.error(`Failed to generate ${target} texture:`, error);
        } finally {
            setIsLoading(prev => ({ ...prev, [target]: false }));
        }
    }, []);

    const handleAddFurniture = useCallback((product: Product) => {
        const newFurniture = {
            id: `${product.id}-${Date.now()}`,
            product,
            position: new Vector3(Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2),
        };
        setFurniture(prev => [...prev, newFurniture]);
        setSelectedFurnitureId(newFurniture.id);
    }, []);

    const handleUpdatePosition = useCallback((id: string, newPosition: Vector3) => {
        setFurniture(prev => prev.map(f => f.id === id ? { ...f, position: newPosition.clone() } : f));
    }, []);

    const availableProducts = useMemo(() => {
        const placedIds = new Set(furniture.map(f => f.product.id));
        return allProducts.filter(p => !placedIds.has(p.id));
    }, [allProducts, furniture]);

    return (
        <div className="relative h-[calc(100vh-5rem)] w-full bg-brand-cream">
             <div className="absolute top-0 left-0 right-0 z-20 p-4 text-center pointer-events-none">
                <h1 className="text-3xl font-serif text-brand-brown [text-shadow:_1px_1px_2px_rgb(255_255_255_/_80%)]">Виртуальный Шоурум</h1>
                <p className="text-brand-charcoal [text-shadow:_1px_1px_2px_rgb(255_255_255_/_80%)]">Создайте свой интерьер с помощью ИИ</p>
            </div>
            <Canvas shadows camera={{ position: [0, 2.5, 7], fov: 60 }}>
                <ShowroomScene 
                    wallTexture={wallTexture} 
                    floorTexture={floorTexture} 
                    furniture={furniture} 
                    onSelectFurniture={setSelectedFurnitureId} 
                    selectedFurnitureId={selectedFurnitureId}
                    onUpdatePosition={handleUpdatePosition}
                />
            </Canvas>
            <div className="absolute top-24 left-4 z-10 w-full max-w-sm">
                <ControlPanel 
                    onGenerate={handleGenerateTexture} 
                    isLoading={isLoading}
                    onAddFurniture={handleAddFurniture}
                    availableProducts={availableProducts}
                />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 p-2 rounded-md text-sm pointer-events-none">
                Используйте мышь для навигации. Колесо - зум, левая кнопка - вращение.
            </div>
        </div>
    );
});
