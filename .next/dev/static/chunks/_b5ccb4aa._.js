(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/contexts/CartContext.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartProvider",
    ()=>CartProvider,
    "useCart",
    ()=>useCart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const CartContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const CartProvider = ({ children })=>{
    _s();
    const [cartItems, setCartItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isCartOpen, setIsCartOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const toggleCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[toggleCart]": ()=>setIsCartOpen({
                "CartProvider.useCallback[toggleCart]": (prev)=>!prev
            }["CartProvider.useCallback[toggleCart]"])
    }["CartProvider.useCallback[toggleCart]"], []);
    const clearCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[clearCart]": ()=>{
            setCartItems([]);
        }
    }["CartProvider.useCallback[clearCart]"], []);
    const removeFromCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[removeFromCart]": (cartId)=>{
            setCartItems({
                "CartProvider.useCallback[removeFromCart]": (prev)=>prev.filter({
                        "CartProvider.useCallback[removeFromCart]": (item)=>item.cartId !== cartId
                    }["CartProvider.useCallback[removeFromCart]"])
            }["CartProvider.useCallback[removeFromCart]"]);
        }
    }["CartProvider.useCallback[removeFromCart]"], []);
    const addToCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[addToCart]": (product, configuration, quantity = 1)=>{
            const configStr = configuration ? JSON.stringify(Object.keys(configuration).sort().map({
                "CartProvider.useCallback[addToCart]": (key)=>[
                        key,
                        configuration[key]
                    ]
            }["CartProvider.useCallback[addToCart]"])) : '';
            const existingItem = cartItems.find({
                "CartProvider.useCallback[addToCart].existingItem": (item)=>{
                    const itemConfigStr = item.configuration ? JSON.stringify(Object.keys(item.configuration).sort().map({
                        "CartProvider.useCallback[addToCart].existingItem": (key)=>[
                                key,
                                item.configuration[key]
                            ]
                    }["CartProvider.useCallback[addToCart].existingItem"])) : '';
                    return item.id === product.id && itemConfigStr === configStr;
                }
            }["CartProvider.useCallback[addToCart].existingItem"]);
            if (existingItem) {
                setCartItems({
                    "CartProvider.useCallback[addToCart]": (currentCartItems)=>currentCartItems.map({
                            "CartProvider.useCallback[addToCart]": (item)=>item.cartId === existingItem.cartId ? {
                                    ...item,
                                    quantity: item.quantity + quantity
                                } : item
                        }["CartProvider.useCallback[addToCart]"])
                }["CartProvider.useCallback[addToCart]"]);
            } else {
                const newCartItem = {
                    ...product,
                    cartId: `${product.id}-${Date.now()}`,
                    quantity,
                    configuration,
                    configuredPrice: product.price
                };
                setCartItems({
                    "CartProvider.useCallback[addToCart]": (prev)=>[
                            ...prev,
                            newCartItem
                        ]
                }["CartProvider.useCallback[addToCart]"]);
            }
        }
    }["CartProvider.useCallback[addToCart]"], [
        cartItems
    ]);
    const updateQuantity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CartProvider.useCallback[updateQuantity]": (cartId, quantity)=>{
            if (quantity <= 0) {
                removeFromCart(cartId);
            } else {
                setCartItems({
                    "CartProvider.useCallback[updateQuantity]": (prev)=>prev.map({
                            "CartProvider.useCallback[updateQuantity]": (item)=>item.cartId === cartId ? {
                                    ...item,
                                    quantity
                                } : item
                        }["CartProvider.useCallback[updateQuantity]"])
                }["CartProvider.useCallback[updateQuantity]"]);
            }
        }
    }["CartProvider.useCallback[updateQuantity]"], [
        removeFromCart
    ]);
    const cartCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CartProvider.useMemo[cartCount]": ()=>{
            return cartItems.reduce({
                "CartProvider.useMemo[cartCount]": (total, item)=>total + item.quantity
            }["CartProvider.useMemo[cartCount]"], 0);
        }
    }["CartProvider.useMemo[cartCount]"], [
        cartItems
    ]);
    const totalPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CartProvider.useMemo[totalPrice]": ()=>{
            return cartItems.reduce({
                "CartProvider.useMemo[totalPrice]": (total, item)=>total + item.configuredPrice * item.quantity
            }["CartProvider.useMemo[totalPrice]"], 0);
        }
    }["CartProvider.useMemo[totalPrice]"], [
        cartItems
    ]);
    const contextValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CartProvider.useMemo[contextValue]": ()=>({
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                isCartOpen,
                toggleCart,
                cartCount,
                totalPrice,
                clearCart
            })
    }["CartProvider.useMemo[contextValue]"], [
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        isCartOpen,
        toggleCart,
        cartCount,
        totalPrice,
        clearCart
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CartContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/CartContext.tsx",
        lineNumber: 102,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(CartProvider, "HTF0fWgfUwuAGjjZu0J2cUwYJhI=");
_c = CartProvider;
const useCart = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
_s1(useCart, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "CartProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/contexts/WishlistContext.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WishlistProvider",
    ()=>WishlistProvider,
    "useWishlist",
    ()=>useWishlist
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const WishlistContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const WishlistProvider = ({ children })=>{
    _s();
    const [wishlistItems, setWishlistItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        "WishlistProvider.useState": ()=>{
            // Эта логика теперь безопасна, так как компонент рендерится только на клиенте
            try {
                const item = window.localStorage.getItem('aura_wishlist');
                return item ? JSON.parse(item) : [];
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    }["WishlistProvider.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WishlistProvider.useEffect": ()=>{
            try {
                window.localStorage.setItem('aura_wishlist', JSON.stringify(wishlistItems));
            } catch (error) {
                console.error(error);
            }
        }
    }["WishlistProvider.useEffect"], [
        wishlistItems
    ]);
    const addToWishlist = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WishlistProvider.useCallback[addToWishlist]": (id)=>{
            setWishlistItems({
                "WishlistProvider.useCallback[addToWishlist]": (prev)=>[
                        ...new Set([
                            ...prev,
                            id
                        ])
                    ]
            }["WishlistProvider.useCallback[addToWishlist]"]);
        }
    }["WishlistProvider.useCallback[addToWishlist]"], []);
    const removeFromWishlist = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WishlistProvider.useCallback[removeFromWishlist]": (id)=>{
            setWishlistItems({
                "WishlistProvider.useCallback[removeFromWishlist]": (prev)=>prev.filter({
                        "WishlistProvider.useCallback[removeFromWishlist]": (itemId)=>itemId !== id
                    }["WishlistProvider.useCallback[removeFromWishlist]"])
            }["WishlistProvider.useCallback[removeFromWishlist]"]);
        }
    }["WishlistProvider.useCallback[removeFromWishlist]"], []);
    const isInWishlist = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WishlistProvider.useCallback[isInWishlist]": (id)=>{
            return wishlistItems.includes(id);
        }
    }["WishlistProvider.useCallback[isInWishlist]"], [
        wishlistItems
    ]);
    const wishlistCount = wishlistItems.length;
    const contextValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WishlistProvider.useMemo[contextValue]": ()=>({
                wishlistItems,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                wishlistCount
            })
    }["WishlistProvider.useMemo[contextValue]"], [
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WishlistContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/WishlistContext.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(WishlistProvider, "t47D5HAiDP6ualGVY0ct8bYxwww=");
_c = WishlistProvider;
const useWishlist = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
_s1(useWishlist, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "WishlistProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/Header.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$CartContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/CartContext.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$WishlistContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/WishlistContext.tsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const NavLink = ({ view, onNavigate, children, isMobile, onClick })=>{
    const handleClick = (e)=>{
        e.preventDefault();
        onNavigate(view);
        onClick?.();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
        href: "#",
        onClick: handleClick,
        className: isMobile ? 'block px-4 py-2 text-lg text-brand-charcoal hover:bg-brand-cream-dark rounded-md' : 'text-brand-charcoal/80 hover:text-brand-brown transition-colors font-medium',
        children: children
    }, void 0, false, {
        fileName: "[project]/components/Header.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = NavLink;
const HeaderComponent = ({ onNavigate, onStyleFinderClick })=>{
    _s();
    const { cartCount, toggleCart } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$CartContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useCart"])();
    const { wishlistCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$WishlistContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useWishlist"])();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const navLinks = [
        {
            label: 'Каталог',
            view: {
                page: 'catalog'
            }
        },
        {
            label: 'Визуальный поиск',
            view: {
                page: 'visual-search'
            }
        },
        {
            label: 'Блог',
            view: {
                page: 'blog-list'
            }
        },
        {
            label: 'О нас',
            view: {
                page: 'about'
            }
        },
        {
            label: 'Контакты',
            view: {
                page: 'contacts'
            }
        }
    ];
// ... остальная часть компонента без изменений
};
_s(HeaderComponent, "nG8NoT1MyKOpXh1QJkdSnywyLJY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$CartContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useCart"],
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$WishlistContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useWishlist"]
    ];
});
_c1 = HeaderComponent;
const Header = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["memo"])(HeaderComponent);
_c2 = Header;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "NavLink");
__turbopack_context__.k.register(_c1, "HeaderComponent");
__turbopack_context__.k.register(_c2, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/Header.tsx [client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/Header.tsx [client] (ecmascript)"));
}),
]);

//# sourceMappingURL=_b5ccb4aa._.js.map