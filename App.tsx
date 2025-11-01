
import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

// --- Types ---
import type { Product, View, BlogPost } from './types';

// --- Contexts ---
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartSidebar } from './components/CartSidebar';
import { ToastContainer } from './components/ToastContainer';

// --- Components ---
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Catalog } from './components/Catalog';
import { ProductDetail } from './components/ProductDetail';
import { WishlistPage } from './components/WishlistPage';
import { About } from './components/About';
import { Contacts } from './components/Contacts';
import { Lookbook } from './components/Lookbook';
import { RecentlyViewed } from './components/RecentlyViewed';
import { QuickViewModal } from './components/QuickViewModal';
import { ConfiguratorModal } from './components/ConfiguratorModal';
import AiConsultantModal from './components/AiConsultantModal';
import { VisualSearchPage } from './components/VisualSearchPage';
import { VirtualStagingModal } from './components/VirtualStagingModal';
import { UpholsteryChangerModal } from './components/UpholsteryChangerModal';
import { BlogListPage } from './components/BlogListPage';
import { BlogPostPage } from './components/BlogPostPage';

// --- Admin ---
import { AdminPage } from './pages/AdminPage';


const App: React.FC = () => {
    const [view, setView] = useState<View>({ page: 'home' });
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    
    // State for modals
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [configuratorProduct, setConfiguratorProduct] = useState<Product | null>(null);
    const [virtualStagingProduct, setVirtualStagingProduct] = useState<Product | null>(null);
    const [upholsteryChangerProduct, setUpholsteryChangerProduct] = useState<Product | null>(null);
    const [isAiConsultantOpen, setIsAiConsultantOpen] = useState(false);
    const [aiConsultantInitialPrompt, setAiConsultantInitialPrompt] = useState<string | undefined>(undefined);
    
    // State for recently viewed products
    const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);

    // Fetch products from Firestore on component mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productsCollection = collection(db, 'products');
                const productSnapshot = await getDocs(productsCollection);
                const productList = productSnapshot.docs.map(doc => {
                    const data = doc.data();
                    // FIX: Manually construct a new plain object to sever any potential
                    // circular references from the complex Firestore document object.
                    // This prevents "Converting circular structure to JSON" errors later.
                    return {
                        id: data.id,
                        name: data.name,
                        category: data.category,
                        price: data.price,
                        originalPrice: data.originalPrice,
                        imageUrls: data.imageUrls,
                        description: data.description,
                        seoDescription: data.seoDescription,
                        rating: data.rating,
                        reviews: data.reviews,
                        details: data.details,
                        isConfigurable: data.isConfigurable,
                        configurationOptions: data.configurationOptions,
                    } as Product;
                });
                setProducts(productList);
            } catch (error) {
                console.error("Error fetching products from Firestore:", error);
                // Здесь можно установить состояние ошибки и показать пользователю сообщение
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);
    
    const handleNavigate = useCallback((newView: View) => {
        window.scrollTo(0, 0);
        setView(newView);
        
        if (newView.page === 'product' && !recentlyViewedIds.includes(newView.productId)) {
            setRecentlyViewedIds(prev => [newView.productId, ...prev].slice(0, 5)); // Keep last 5
        }
    }, [recentlyViewedIds]);
    
    const handleSearchSubmit = (searchTerm: string) => {
        handleNavigate({ page: 'catalog', searchTerm });
    };

    const handleUpdateProduct = (updatedProduct: Product) => {
      // TODO: Обновить продукт в Firestore
      setProducts(prevProducts => prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    const handleDeleteProduct = (productId: number) => {
      // TODO: Удалить продукт из Firestore
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    };
    
    const handleOpenAiConsultant = (initialPrompt?: string) => {
        setAiConsultantInitialPrompt(initialPrompt);
        setIsAiConsultantOpen(true);
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center py-20">Загрузка товаров...</div>;
        }

        switch (view.page) {
            case 'home':
                return (
                    <>
                        <Hero onNavigate={handleNavigate} />
                        <Catalog 
                            products={products.slice(0, 8)} // Show a featured selection
                            onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })}
                            onQuickView={setQuickViewProduct}
                            onVirtualStage={setVirtualStagingProduct}
                            onOpenAiConsultant={handleOpenAiConsultant}
                        />
                    </>
                );
            case 'catalog':
                return <Catalog 
                          products={products} 
                          onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })}
                          onQuickView={setQuickViewProduct}
                          onVirtualStage={setVirtualStagingProduct}
                          onOpenAiConsultant={handleOpenAiConsultant}
                          category={view.category}
                          searchTerm={view.searchTerm}
                       />;
            case 'product':
                const product = products.find(p => p.id === view.productId);
                if (!product) return <div>Товар не найден</div>;
                
                const recentlyViewedProducts = recentlyViewedIds
                    .filter(id => id !== product.id) // Exclude current product
                    .map(id => products.find(p => p.id === id))
                    .filter((p): p is Product => !!p);
                    
                return (
                    <>
                        <ProductDetail 
                            product={product} 
                            onBack={() => handleNavigate({ page: 'catalog' })}
                            onConfigure={setConfiguratorProduct}
                            onVirtualStage={setVirtualStagingProduct}
                            onUpholsteryChange={setUpholsteryChangerProduct}
                        />
                        <RecentlyViewed 
                            products={recentlyViewedProducts}
                            onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })}
                            onVirtualStage={setVirtualStagingProduct}
                        />
                    </>
                );
            case 'wishlist':
                return <WishlistPage 
                            allProducts={products} 
                            onNavigate={handleNavigate} 
                            onQuickView={setQuickViewProduct} 
                            onVirtualStage={setVirtualStagingProduct}
                        />;
            case 'about':
                return <About />;
            case 'contacts':
                return <Contacts />;
            case 'lookbook':
                return <Lookbook onNavigate={handleNavigate} />;
            case 'visual-search':
                return <VisualSearchPage 
                            allProducts={products}
                            onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })}
                        />;
            case 'blog-list':
                return <BlogListPage posts={blogPosts} setPosts={setBlogPosts} allProducts={products} onNavigate={handleNavigate} />;
            case 'blog-post':
                const post = blogPosts.find(p => p.id === view.postId);
                if (!post) return <div>Статья не найдена</div>;
                return <BlogPostPage post={post} allProducts={products} onNavigate={handleNavigate} />;
            case 'admin':
                return <AdminPage 
                          allProducts={products} 
                          blogPosts={blogPosts} 
                          onNavigate={handleNavigate}
                          onUpdateProduct={handleUpdateProduct}
                          onUpdatePosts={setBlogPosts}
                          onDeleteProduct={handleDeleteProduct}
                        />;
            default:
                return <div>Страница не найдена</div>;
        }
    };
    
    // Secret admin key sequence
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'a' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                handleNavigate({ page: 'admin' });
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleNavigate]);

    if (view.page === 'admin') {
      return (
        <ToastProvider>
           <AdminPage 
              allProducts={products} 
              blogPosts={blogPosts} 
              onNavigate={handleNavigate}
              onUpdateProduct={handleUpdateProduct}
              onUpdatePosts={setBlogPosts}
              onDeleteProduct={handleDeleteProduct}
            />
          <ToastContainer />
        </ToastProvider>
      )
    }

    return (
        <CartProvider>
            <WishlistProvider>
                <ToastProvider>
                    <div className="flex flex-col min-h-screen bg-brand-cream">
                        <Header onNavigate={handleNavigate} onSearchSubmit={handleSearchSubmit} />
                        <main className="flex-grow">
                            {renderContent()}
                        </main>
                        <Footer />
                        <CartSidebar />
                        <ToastContainer />
                        
                        {quickViewProduct && (
                            <QuickViewModal 
                                product={quickViewProduct} 
                                onClose={() => setQuickViewProduct(null)} 
                                onViewDetails={(id) => {
                                    setQuickViewProduct(null);
                                    handleNavigate({ page: 'product', productId: id });
                                }} 
                            />
                        )}
                        {configuratorProduct && (
                            <ConfiguratorModal 
                                product={configuratorProduct} 
                                onClose={() => setConfiguratorProduct(null)} 
                            />
                        )}
                         {virtualStagingProduct && (
                            <VirtualStagingModal
                                product={virtualStagingProduct}
                                onClose={() => setVirtualStagingProduct(null)}
                            />
                        )}
                        {upholsteryChangerProduct && (
                            <UpholsteryChangerModal
                                product={upholsteryChangerProduct}
                                onClose={() => setUpholsteryChangerProduct(null)}
                            />
                        )}
                        {isAiConsultantOpen && (
                            <AiConsultantModal
                                allProducts={products}
                                onClose={() => setIsAiConsultantOpen(false)}
                                onProductSelect={(id) => {
                                    setIsAiConsultantOpen(false);
                                    handleNavigate({ page: 'product', productId: id });
                                }}
                                initialPrompt={aiConsultantInitialPrompt}
                            />
                        )}
                    </div>
                </ToastProvider>
            </WishlistProvider>
        </CartProvider>
    );
};

export default App;
