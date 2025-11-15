(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/contexts/AiChatContext.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AiChatProvider",
    ()=>AiChatProvider,
    "useAiChat",
    ()=>useAiChat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$genai$2f$dist$2f$web$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@google/genai/dist/web/index.mjs [client] (ecmascript)");
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
    const aiRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const chatRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const systemInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AiChatProvider.useMemo[systemInstruction]": ()=>{
            const productListForContext = allProducts.map({
                "AiChatProvider.useMemo[systemInstruction].productListForContext": (p)=>({
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        price: p.price,
                        description: p.description
                    })
            }["AiChatProvider.useMemo[systemInstruction].productListForContext"]).slice(0, 30);
            return `Вы — 'Aura Assist', дружелюбный и знающий ИИ-ассистент... (ваш системный промпт без изменений)`;
        }
    }["AiChatProvider.useMemo[systemInstruction]"], [
        allProducts
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AiChatProvider.useEffect": ()=>{
            if (!aiRef.current) {
                const apiKey = ("TURBOPACK compile-time value", "AIzaSyAb_mGezCSXNyoY3btjAvy-V6J0LVKYt_c");
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                else {
                    aiRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$google$2f$genai$2f$dist$2f$web$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["GoogleGenAI"]({
                        apiKey
                    });
                }
            }
            if (!chatRef.current && aiRef.current) {
                chatRef.current = aiRef.current.chats.create({
                    model: 'gemini-2.5-pro',
                    config: {
                        systemInstruction: systemInstruction
                    }
                });
            }
        }
    }["AiChatProvider.useEffect"], [
        systemInstruction
    ]);
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
            if (!message.trim() || !chatRef.current) return;
            setIsLoading(true);
            setError(null);
            const userMessage = {
                role: 'user',
                content: message
            };
            setMessages({
                "AiChatProvider.useCallback[sendMessage]": (prev)=>[
                        ...prev,
                        userMessage
                    ]
            }["AiChatProvider.useCallback[sendMessage]"]);
            try {
                const stream = await chatRef.current.sendMessageStream({
                    message
                });
                let modelResponse = '';
                setMessages({
                    "AiChatProvider.useCallback[sendMessage]": (prev)=>[
                            ...prev,
                            {
                                role: 'model',
                                content: ''
                            }
                        ]
                }["AiChatProvider.useCallback[sendMessage]"]);
                for await (const chunk of stream){
                    modelResponse += chunk.text;
                    setMessages({
                        "AiChatProvider.useCallback[sendMessage]": (prev)=>{
                            const newMessages = [
                                ...prev
                            ];
                            newMessages[newMessages.length - 1].content = modelResponse;
                            return newMessages;
                        }
                    }["AiChatProvider.useCallback[sendMessage]"]);
                }
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
    }["AiChatProvider.useCallback[sendMessage]"], []);
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
        lineNumber: 107,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AiChatProvider, "SSiv9/qs2eDAQnOCrJXI97WHH9c=");
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

//# sourceMappingURL=_4a1f4f51._.js.map