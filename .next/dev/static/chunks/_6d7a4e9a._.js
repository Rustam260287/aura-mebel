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
                const apiKey = ("TURBOPACK compile-time value", "ВАШ_КЛЮЧ_GEMINI_API");
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
"[project]/components/AiChatbot.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AiChatbot",
    ()=>AiChatbot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/AiChatContext.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Button.tsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const parseMarkdown = (text)=>{
    let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;') // Basic XSS protection
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    const lines = html.split('\n');
    let inList = false;
    html = lines.map((line)=>{
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            const listItem = `<li>${trimmedLine.substring(2)}</li>`;
            if (!inList) {
                inList = true;
                return `<ul>${listItem}`;
            }
            return listItem;
        } else {
            if (inList) {
                inList = false;
                return `</ul>${trimmedLine ? `<p>${trimmedLine}</p>` : ''}`;
            }
            return trimmedLine ? `<p>${trimmedLine}</p>` : '';
        }
    }).join('');
    if (inList) {
        html += '</ul>';
    }
    return html;
};
const AiChatbot = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["memo"])(_c = _s(()=>{
    _s();
    const { isOpen, toggleChat, messages, sendMessage, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useAiChat"])();
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const textareaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const scrollToBottom = ()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AiChatbot.useEffect": ()=>{
            scrollToBottom();
        }
    }["AiChatbot.useEffect"], [
        messages,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AiChatbot.useEffect": ()=>{
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
        }
    }["AiChatbot.useEffect"], [
        input
    ]);
    const handleSend = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AiChatbot.useCallback[handleSend]": ()=>{
            if (input.trim()) {
                sendMessage(input);
                setInput('');
            }
        }
    }["AiChatbot.useCallback[handleSend]"], [
        input,
        sendMessage
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AiChatbot.useCallback[handleKeyDown]": (e)=>{
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        }
    }["AiChatbot.useCallback[handleKeyDown]"], [
        handleSend
    ]);
    if (!isOpen) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed bottom-24 right-6 w-[calc(100%-3rem)] max-w-md h-[70vh] max-h-[600px] bg-brand-cream rounded-2xl shadow-2xl flex flex-col z-40 animate-subtle-fade-in",
        "aria-modal": "true",
        role: "dialog",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex items-center justify-between p-4 border-b border-brand-cream-dark",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["SparklesIcon"], {
                                className: "w-6 h-6 text-brand-terracotta"
                            }, void 0, false, {
                                fileName: "[project]/components/AiChatbot.tsx",
                                lineNumber: 86,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-serif text-brand-brown",
                                children: "Aura AI-помощник"
                            }, void 0, false, {
                                fileName: "[project]/components/AiChatbot.tsx",
                                lineNumber: 87,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AiChatbot.tsx",
                        lineNumber: 85,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "ghost",
                        onClick: toggleChat,
                        className: "p-2 -mr-2",
                        "aria-label": "Закрыть чат",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["XMarkIcon"], {
                            className: "w-6 h-6"
                        }, void 0, false, {
                            fileName: "[project]/components/AiChatbot.tsx",
                            lineNumber: 90,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/AiChatbot.tsx",
                        lineNumber: 89,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/AiChatbot.tsx",
                lineNumber: 84,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-grow p-4 overflow-y-auto space-y-4",
                children: [
                    messages.map((msg, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-brand-terracotta text-white rounded-br-lg' : 'bg-white text-brand-charcoal rounded-bl-lg shadow-sm'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2",
                                    dangerouslySetInnerHTML: {
                                        __html: parseMarkdown(msg.content)
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/AiChatbot.tsx",
                                    lineNumber: 102,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/components/AiChatbot.tsx",
                                lineNumber: 97,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, index, false, {
                            fileName: "[project]/components/AiChatbot.tsx",
                            lineNumber: 96,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))),
                    isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-start",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "max-w-[85%] rounded-2xl px-4 py-2.5 bg-white text-brand-charcoal rounded-bl-lg shadow-sm",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-pulse",
                                        style: {
                                            animationDelay: '0s'
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiChatbot.tsx",
                                        lineNumber: 113,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-pulse",
                                        style: {
                                            animationDelay: '0.2s'
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiChatbot.tsx",
                                        lineNumber: 114,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-pulse",
                                        style: {
                                            animationDelay: '0.4s'
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiChatbot.tsx",
                                        lineNumber: 115,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/AiChatbot.tsx",
                                lineNumber: 112,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/components/AiChatbot.tsx",
                            lineNumber: 111,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/AiChatbot.tsx",
                        lineNumber: 110,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: messagesEndRef
                    }, void 0, false, {
                        fileName: "[project]/components/AiChatbot.tsx",
                        lineNumber: 120,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/AiChatbot.tsx",
                lineNumber: 94,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 border-t border-brand-cream-dark bg-white/50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-end gap-2 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-brand-brown p-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                            ref: textareaRef,
                            value: input,
                            onChange: (e)=>setInput(e.target.value),
                            onKeyDown: handleKeyDown,
                            placeholder: "Спросите что-нибудь...",
                            className: "flex-grow bg-transparent border-none focus:ring-0 resize-none max-h-32 text-brand-charcoal placeholder:text-gray-500",
                            rows: 1,
                            disabled: isLoading
                        }, void 0, false, {
                            fileName: "[project]/components/AiChatbot.tsx",
                            lineNumber: 125,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                            size: "sm",
                            className: "p-2.5 rounded-md aspect-square",
                            onClick: handleSend,
                            disabled: isLoading || !input.trim(),
                            "aria-label": "Отправить сообщение",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["PaperAirplaneIcon"], {
                                className: "w-5 h-5"
                            }, void 0, false, {
                                fileName: "[project]/components/AiChatbot.tsx",
                                lineNumber: 142,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/components/AiChatbot.tsx",
                            lineNumber: 135,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/AiChatbot.tsx",
                    lineNumber: 124,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/components/AiChatbot.tsx",
                lineNumber: 123,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/AiChatbot.tsx",
        lineNumber: 79,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "n84MD7lwjSLFEu82bl4VYBxupG4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useAiChat"]
    ];
})), "n84MD7lwjSLFEu82bl4VYBxupG4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useAiChat"]
    ];
});
_c1 = AiChatbot;
var _c, _c1;
__turbopack_context__.k.register(_c, "AiChatbot$memo");
__turbopack_context__.k.register(_c1, "AiChatbot");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/AiChatbot.tsx [client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/AiChatbot.tsx [client] (ecmascript)"));
}),
]);

//# sourceMappingURL=_6d7a4e9a._.js.map