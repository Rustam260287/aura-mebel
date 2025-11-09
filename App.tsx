import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';

// Data and Types
import type { Product, BlogPost, View, ChatMessage } from './types';
import { productsData, blogPostsData } from './constants';

// Contexts
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './contexts/ToastContext';
import { AiChatProvider } from './contexts/AiChatContext';

// Eagerly loaded components (visible on initial load)
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { CategoryShowcase } from './components/CategoryShowcase';
import { Catalog } from './components/Catalog';
import { ToastContainer } from './components/ToastContainer';
import { CartSidebar } from './components/CartSidebar';
import { FloatingChatButton } from './components/FloatingChatButton';
import { Skeleton } from './components/Skeleton';

// Lazily loaded components
const ProductDetail = lazy(() => import('./components/ProductDetail').then(module => ({ default: module.ProductDetail })));
const About = lazy(() => import('./components/About').then(module => ({ default: module.About })));
const Contacts = lazy(() => import('./components/Contacts').then(module => ({ default: module.Contacts })));
const RecentlyViewed = lazy(() => import('./components/RecentlyViewed').then(module => ({ default: module.RecentlyViewed })));
const AiRoomMakeoverPage = lazy(() => import('./components/AiRoomMakeoverPage').then(module => ({ default: module.AiRoomMakeoverPage })));
const WishlistPage = lazy(() => import('./components/WishlistPage').then(module => ({ default: module.WishlistPage })));
const BlogListPage = lazy(() => import('./components/BlogListPage').then(module => ({ default: module.BlogListPage })));
const BlogPostPage = lazy(() => import('./components/BlogPostPage').then(module => ({ default: module.BlogPostPage })));
const VisualSearchPage = lazy(() => import('./components/VisualSearchPage').then(module => ({ default: module.VisualSearchPage })));
const FurnitureFromPhotoPage = lazy(() => import('./components/FurnitureFromPhotoPage').then(module => ({ default: module.FurnitureFromPhotoPage })));
const AiDesignerPage = lazy(() => import('./components/AiDesignerPage').then(module => ({ default: module.AiDesignerPage })));
const CheckoutPage = lazy(() => import('./components/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));
const AiChatbot = lazy(() => import('./components/AiChatbot').then(module => ({ default: module.AiChatbot })));

// Lazily loaded modals
const QuickViewModal = lazy(() => import('./components/QuickViewModal').then(module => ({ default: module.QuickViewModal })));
const StyleFinderModal = lazy(() => import('./components/StyleFinderModal').then(module => ({ default: module.StyleFinderModal })));
const VirtualStagingModal = lazy(() => import('./components/VirtualStagingModal').then(module => ({ default: module.VirtualStagingModal })));
const ConfiguratorModal = lazy(() => import('./components/ConfiguratorModal').then(module => ({ default: module.ConfiguratorModal })));
const UpholsteryChangerModal = lazy(() => import('./components/UpholsteryChangerModal').then(module => ({ default: module.UpholsteryChangerModal })));


const LoadingFallback: React.FC = () => (
    <div className="container mx-auto px-6 py-24 text-center">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-brown mx-auto"></div>
        <p className="mt-4 text-lg text-brand-charcoal">Загрузка...</p>
    </div>
);


const App: React.FC = () => {
    const [view, setView] = useState<View>({ page: 'home' });
    const [allProducts, setAllProducts] = useState<Product[]>(productsData);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(blogPostsData.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()));
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
    const [chatLogs, setChatLogs] = useState<ChatMessage[][]>([]);
    
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [styleFinderOpen, setStyleFinderOpen] = useState(false);
    const [virtualStageProduct, setVirtualStageProduct] = useState<Product | null>(null);
    const [configureProduct, setConfigureProduct] = useState<Product | null>(null);
    const [upholsteryProduct, setUpholsteryProduct] = useState<Product | null>(null);
    
    const handleUpdateProduct = useCallback(async (updatedProduct: Product) => {
        setAllProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }, []);

    const handleAddProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
        const newProduct: Product = {
            id: `prod-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...productData
        };
        setAllProducts(prev => [newProduct, ...prev]);
    }, []);
    
    const handleDeleteProduct = useCallback(async (productId: string) => {
        setAllProducts(prev => prev.filter(p => p.id !== productId));
    }, []);
    
    const handleAddBlogPost = useCallback(async (postData: Omit<BlogPost, 'id' | 'imageUrl'> & { imageBase64: string }) => {
        const { imageBase64, ...restOfPost } = postData;
        const newPostId = new Date().toISOString();
        const imageUrl = `data:image/png;base64,${imageBase64}`;
        
        const finalPostData: BlogPost = { ...restOfPost, imageUrl, id: newPostId };
        
        setBlogPosts(prev => [finalPostData, ...prev].sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()));
    }, []);

    const handleUpdateBlogPost = useCallback(async (updatedPost: BlogPost) => {
         setBlogPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    }, []);
    
    const handleDeleteBlogPost = useCallback(async (postId: string) => {
        setBlogPosts(prev => prev.filter(p => p.id !== postId));
    }, []);

    const handleChatSessionEnd = useCallback((sessionMessages: ChatMessage[]) => {
        setChatLogs(prev => [...prev, sessionMessages]);
        console.log('Chat session logged:', sessionMessages);
    }, []);


    const handleNavigate = useCallback((newView: View) => {
        if (view.page === 'product') {
            setRecentlyViewed(prev => {
                const newId = (view as { page: 'product', productId: string }).productId;
                const updatedList = [newId, ...prev.filter(id => id !== newId)];
                return updatedList.slice(0, 5);
            });
        }
        setView(newView);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [view]);
    
    const popularProducts = useMemo(() => {
        return [...allProducts].sort((a,b) => b.rating - a.rating).slice(0, 4);
    }, [allProducts]);

    const renderView = () => {
        switch (view.page) {
            case 'home':
                return (
                    <>
                        <Hero onNavigate={handleNavigate} />
                        <CategoryShowcase onNavigate={handleNavigate} />
                        <Catalog 
                            allProducts={popularProducts}
                            onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })}
                            onQuickView={setQuickViewProduct}
                            onVirtualStage={setVirtualStageProduct}
                            isHomePage
                        />
                    </>
                );
            case 'catalog':
                return <Catalog allProducts={allProducts} onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })} onQuickView={setQuickViewProduct} onVirtualStage={setVirtualStageProduct} initialCategory={view.category} initialSearchTerm={view.searchTerm} />;
            case 'product':
                const product = allProducts.find(p => p.id === view.productId);
                const relatedRecentlyViewed = allProducts.filter(p => recentlyViewed.includes(p.id) && p.id !== product?.id);
                if (!product) return <div>Товар не найден</div>;
                return (
                    <>
                        <ProductDetail product={product} onBack={() => window.history.back()} onConfigure={setConfigureProduct} onVirtualStage={setVirtualStageProduct} onUpholsteryChange={setUpholsteryProduct}/>
                        <Suspense fallback={<Skeleton className="h-96 w-full mt-24" />}>
                           <RecentlyViewed products={relatedRecentlyViewed} onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })} onVirtualStage={setVirtualStageProduct} />
                        </Suspense>
                    </>
                );
            case 'wishlist':
                return <WishlistPage allProducts={allProducts} onNavigate={handleNavigate} onQuickView={setQuickViewProduct} onVirtualStage={setVirtualStageProduct} />;
            case 'ai-room-makeover':
                return <AiRoomMakeoverPage allProducts={allProducts} onNavigate={handleNavigate} />;
            case 'blog-list':
                return <BlogListPage posts={blogPosts} onNavigate={handleNavigate} />;
            case 'blog-post':
                const post = blogPosts.find(p => p.id === view.postId);
                if (!post) return <div>Статья не найдена</div>;
                return <BlogPostPage post={post} allProducts={allProducts} onNavigate={handleNavigate} />;
            case 'about':
                return <About />;
            case 'contacts':
                return <Contacts />;
            case 'visual-search':
                return <VisualSearchPage allProducts={allProducts} onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })} />;
            case 'furniture-from-photo':
                return <FurnitureFromPhotoPage />;
            case 'ai-designer':
                return <AiDesignerPage onNavigate={handleNavigate} />;
            case 'checkout':
            case 'order-success':
                 return <CheckoutPage view={view} onNavigate={handleNavigate} />;
            case 'admin':
                return <AdminPage 
                            allProducts={allProducts}
                            blogPosts={blogPosts}
                            chatLogs={chatLogs}
                            onNavigate={handleNavigate}
                            onUpdateProduct={handleUpdateProduct}
                            onAddProduct={handleAddProduct}
                            onDeleteProduct={handleDeleteProduct}
                            onAddBlogPost={handleAddBlogPost}
                            onUpdateBlogPost={handleUpdateBlogPost}
                            onDeleteBlogPost={handleDeleteBlogPost}
                        />;
            default:
                return <div>Страница не найдена</div>;
        }
    };
    
    const isAdminPage = view.page === 'admin';

    return (
        <ToastProvider>
            <WishlistProvider>
                <CartProvider>
                    <AiChatProvider allProducts={allProducts} onSessionEnd={handleChatSessionEnd}>
                        <div className="flex flex-col min-h-screen font-sans bg-brand-cream text-brand-charcoal">
                            {!isAdminPage && <Header onNavigate={handleNavigate} onStyleFinderClick={() => setStyleFinderOpen(true)}/>}
                            <main className="flex-grow">
                                <Suspense fallback={<LoadingFallback />}>
                                    {renderView()}
                                </Suspense>
                            </main>
                            {!isAdminPage && <Footer onNavigate={handleNavigate} />}
                            {!isAdminPage && <CartSidebar onNavigate={handleNavigate} />}
                            
                            <Suspense>
                                {!isAdminPage && <AiChatbot />}
                            </Suspense>
                            
                            {!isAdminPage && <FloatingChatButton />}
                        </div>
                        <ToastContainer />

                        <Suspense>
                            {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onViewDetails={(id) => { setQuickViewProduct(null); handleNavigate({ page: 'product', productId: id }); }} />}
                            {styleFinderOpen && <StyleFinderModal allProducts={allProducts} onClose={() => setStyleFinderOpen(null)} onNavigate={(v) => { setStyleFinderOpen(null); handleNavigate(v); }} />}
                            {virtualStageProduct && <VirtualStagingModal product={virtualStageProduct} onClose={() => setVirtualStageProduct(null)} />}
                            {configureProduct && <ConfiguratorModal product={configureProduct} onClose={() => setConfigureProduct(null)} />}
                            {upholsteryProduct && <UpholsteryChangerModal product={upholsteryProduct} onClose={() => setUpholsteryProduct(null)} />}
                        </Suspense>

                    </AiChatProvider>
                </CartProvider>
            </WishlistProvider>
        </ToastProvider>
    );
};

export default App;