(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/services/geminiService.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// services/geminiService.ts
__turbopack_context__.s([
    "analyzeChatLogs",
    ()=>analyzeChatLogs,
    "generateBlogPost",
    ()=>generateBlogPost,
    "generateConfiguredImage",
    ()=>generateConfiguredImage,
    "generateFurnitureFromPhoto",
    ()=>generateFurnitureFromPhoto,
    "generateRoomMakeover",
    ()=>generateRoomMakeover,
    "generateStagedImage",
    ()=>generateStagedImage,
    "getAiConfigurationDescription",
    ()=>getAiConfigurationDescription,
    "getStyleRecommendations",
    ()=>getStyleRecommendations,
    "getVisualRecommendations",
    ()=>getVisualRecommendations,
    "sendChatMessage",
    ()=>sendChatMessage
]);
// Helper function to handle API requests to our backend
async function callApi(action, body) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action,
            ...body
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера.');
    }
    return response.json();
}
const getStyleRecommendations = (prompt, products)=>{
    const productNames = products.map((p)=>p.name);
    return callApi('styleRecommendations', {
        prompt,
        productNames
    });
};
const getVisualRecommendations = (base64, mimeType, allProducts)=>{
    return callApi('visualSearch', {
        base64,
        mimeType,
        allProducts
    });
};
const generateRoomMakeover = (base64, mimeType, style, allProducts)=>{
    return callApi('roomMakeover', {
        base64,
        mimeType,
        style,
        allProducts
    });
};
const generateConfiguredImage = (base64, mimeType, productName, visualPrompt)=>{
    return callApi('generateConfiguredImage', {
        base64,
        mimeType,
        productName,
        visualPrompt
    });
};
const getAiConfigurationDescription = (productName, selectedOptions)=>{
    return callApi('configDescription', {
        productName,
        selectedOptions
    });
};
const generateStagedImage = (roomBase64, roomMimeType, productBase64, productMimeType, productName)=>{
    return callApi('stageFurniture', {
        roomBase64,
        roomMimeType,
        productBase64,
        productMimeType,
        productName
    });
};
const generateBlogPost = (allProducts)=>{
    return callApi('generateBlogPost', {
        allProducts
    });
};
const generateFurnitureFromPhoto = (base64, mimeType, dimensions)=>{
    return callApi('furnitureFromPhoto', {
        base64,
        mimeType,
        dimensions
    });
};
const analyzeChatLogs = (chatLogs)=>{
    return callApi('analyzeChatLogs', {
        chatLogs
    });
};
const sendChatMessage = async (messages, allProducts)=>{
    const data = await callApi('chat', {
        messages,
        allProducts
    });
    return data.reply;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/contexts/AiChatContext.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AiChatProvider",
    ()=>AiChatProvider,
    "useAiChat",
    ()=>useAiChat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/geminiService.ts [client] (ecmascript)"); // ИСПРАВЛЕНО
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const AiChatContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const initialMessage = {
    role: 'model',
    content: 'Здравствуйте! Я — ваш ИИ-помощник Aura. Чем могу помочь в выборе мебели?'
};
const AiChatProvider = ({ children, allProducts, onSessionEnd })=>{
    _s();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([
        initialMessage
    ]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const toggleChat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AiChatProvider.useCallback[toggleChat]": ()=>{
            if (isOpen && messages.length > 1) {
                onSessionEnd(messages);
            }
            setIsOpen({
                "AiChatProvider.useCallback[toggleChat]": (prev)=>!prev
            }["AiChatProvider.useCallback[toggleChat]"]);
        }
    }["AiChatProvider.useCallback[toggleChat]"], [
        isOpen,
        messages,
        onSessionEnd
    ]);
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AiChatProvider.useCallback[sendMessage]": async (message)=>{
            if (!message.trim()) return;
            setIsLoading(true);
            setError(null);
            const newMessages = [
                ...messages,
                {
                    role: 'user',
                    content: message
                }
            ];
            setMessages(newMessages);
            try {
                const reply = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["sendChatMessage"])(newMessages, allProducts);
                setMessages({
                    "AiChatProvider.useCallback[sendMessage]": (prev)=>[
                            ...prev,
                            {
                                role: 'model',
                                content: reply
                            }
                        ]
                }["AiChatProvider.useCallback[sendMessage]"]);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'Произошла ошибка. Попробуйте еще раз.';
                setError(errorMessage);
                setMessages({
                    "AiChatProvider.useCallback[sendMessage]": (prev)=>[
                            ...prev,
                            {
                                role: 'model',
                                content: `К сожалению, произошла ошибка: ${errorMessage}`
                            }
                        ]
                }["AiChatProvider.useCallback[sendMessage]"]);
            } finally{
                setIsLoading(false);
            }
        }
    }["AiChatProvider.useCallback[sendMessage]"], [
        messages,
        allProducts
    ]);
    const contextValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AiChatProvider.useMemo[contextValue]": ()=>({
                isOpen,
                toggleChat,
                messages,
                sendMessage,
                isLoading,
                error
            })
    }["AiChatProvider.useMemo[contextValue]"], [
        isOpen,
        toggleChat,
        messages,
        sendMessage,
        isLoading,
        error
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AiChatContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/AiChatContext.tsx",
        lineNumber: 70,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AiChatProvider, "ULRULw+6CvPMa9o0LGRafMLerHo=");
_c = AiChatProvider;
const useAiChat = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(AiChatContext);
    if (context === undefined) {
        throw new Error('useAiChat must be used within an AiChatProvider');
    }
    return context;
};
_s1(useAiChat, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AiChatProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/FloatingChatButton.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FloatingChatButton",
    ()=>FloatingChatButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/AiChatContext.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const FloatingChatButton = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["memo"])(_c = _s(()=>{
    _s();
    const { isOpen, toggleChat } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useAiChat"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: toggleChat,
        className: "fixed bottom-6 right-6 bg-brand-brown text-white p-4 rounded-full shadow-lg hover:bg-brand-charcoal focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-brown transition-all duration-300 animate-scale-in z-40",
        title: isOpen ? "Закрыть чат" : "Открыть AI-помощника",
        "aria-label": isOpen ? "Закрыть чат" : "Открыть AI-помощника",
        children: isOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["XMarkIcon"], {
            className: "w-8 h-8"
        }, void 0, false, {
            fileName: "[project]/components/FloatingChatButton.tsx",
            lineNumber: 16,
            columnNumber: 23
        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["RobotIcon"], {
            className: "w-8 h-8"
        }, void 0, false, {
            fileName: "[project]/components/FloatingChatButton.tsx",
            lineNumber: 16,
            columnNumber: 58
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/FloatingChatButton.tsx",
        lineNumber: 10,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "6VM5cMZvfUQj3GGQ3qaGK6/8t7U=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useAiChat"]
    ];
})), "6VM5cMZvfUQj3GGQ3qaGK6/8t7U=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useAiChat"]
    ];
});
_c1 = FloatingChatButton;
FloatingChatButton.displayName = 'FloatingChatButton';
var _c, _c1;
__turbopack_context__.k.register(_c, "FloatingChatButton$memo");
__turbopack_context__.k.register(_c1, "FloatingChatButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/FloatingChatButton.tsx [client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/FloatingChatButton.tsx [client] (ecmascript)"));
}),
]);

//# sourceMappingURL=_66a3bd6c._.js.map