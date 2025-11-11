module.exports = [
"[externals]/@google/genai [external] (@google/genai, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("@google/genai");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/contexts/AiChatContext.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "AiChatProvider",
    ()=>AiChatProvider,
    "useAiChat",
    ()=>useAiChat
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$google$2f$genai__$5b$external$5d$__$2840$google$2f$genai$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@google/genai [external] (@google/genai, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$google$2f$genai__$5b$external$5d$__$2840$google$2f$genai$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f40$google$2f$genai__$5b$external$5d$__$2840$google$2f$genai$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
"use client";
;
;
;
const AiChatContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["createContext"])(undefined);
const initialMessage = {
    role: 'model',
    content: 'Здравствуйте! Я — ваш ИИ-помощник Aura. Чем могу помочь в выборе мебели?'
};
const AiChatProvider = ({ children, allProducts, onSessionEnd })=>{
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([
        initialMessage
    ]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const aiRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const chatRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const systemInstruction = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>{
        const productListForContext = allProducts.map((p)=>({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                description: p.description
            })).slice(0, 30);
        return `Вы — 'Aura Assist', дружелюбный и знающий ИИ-ассистент... (ваш системный промпт без изменений)`;
    }, [
        allProducts
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!aiRef.current) {
            const apiKey = ("TURBOPACK compile-time value", "ВАШ_КЛЮЧ_GEMINI_API");
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            else {
                aiRef.current = new __TURBOPACK__imported__module__$5b$externals$5d2f40$google$2f$genai__$5b$external$5d$__$2840$google$2f$genai$2c$__esm_import$29$__["GoogleGenAI"]({
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
    }, [
        systemInstruction
    ]);
    const toggleChat = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
        if (isOpen && messages.length > 1) {
            onSessionEnd(messages);
        }
        setIsOpen((prev)=>!prev);
    }, [
        isOpen,
        messages,
        onSessionEnd
    ]);
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async (message)=>{
        if (!message.trim() || !chatRef.current) return;
        setIsLoading(true);
        setError(null);
        const userMessage = {
            role: 'user',
            content: message
        };
        setMessages((prev)=>[
                ...prev,
                userMessage
            ]);
        try {
            const stream = await chatRef.current.sendMessageStream({
                message
            });
            let modelResponse = '';
            setMessages((prev)=>[
                    ...prev,
                    {
                        role: 'model',
                        content: ''
                    }
                ]);
            for await (const chunk of stream){
                modelResponse += chunk.text;
                setMessages((prev)=>{
                    const newMessages = [
                        ...prev
                    ];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Произошла ошибка. Попробуйте еще раз.';
            setError(errorMessage);
            setMessages((prev)=>[
                    ...prev,
                    {
                        role: 'model',
                        content: `К сожалению, произошла ошибка: ${errorMessage}`
                    }
                ]);
        } finally{
            setIsLoading(false);
        }
    }, []);
    const contextValue = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>({
            isOpen,
            toggleChat,
            messages,
            sendMessage,
            isLoading,
            error
        }), [
        isOpen,
        toggleChat,
        messages,
        sendMessage,
        isLoading,
        error
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(AiChatContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/AiChatContext.tsx",
        lineNumber: 107,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
const useAiChat = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useContext"])(AiChatContext);
    if (context === undefined) {
        throw new Error('useAiChat must be used within an AiChatProvider');
    }
    return context;
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/components/AiChatbot.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "AiChatbot",
    ()=>AiChatbot
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/AiChatContext.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Button.tsx [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
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
const AiChatbot = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(()=>{
    const { isOpen, toggleChat, messages, sendMessage, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AiChatContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["useAiChat"])();
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const textareaRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const scrollToBottom = ()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    };
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        scrollToBottom();
    }, [
        messages,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [
        input
    ]);
    const handleSend = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(()=>{
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    }, [
        input,
        sendMessage
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [
        handleSend
    ]);
    if (!isOpen) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "fixed bottom-24 right-6 w-[calc(100%-3rem)] max-w-md h-[70vh] max-h-[600px] bg-brand-cream rounded-2xl shadow-2xl flex flex-col z-40 animate-subtle-fade-in",
        "aria-modal": "true",
        role: "dialog",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
                className: "flex items-center justify-between p-4 border-b border-brand-cream-dark",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["SparklesIcon"], {
                                className: "w-6 h-6 text-brand-terracotta"
                            }, void 0, false, {
                                fileName: "[project]/components/AiChatbot.tsx",
                                lineNumber: 86,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "ghost",
                        onClick: toggleChat,
                        className: "p-2 -mr-2",
                        "aria-label": "Закрыть чат",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["XMarkIcon"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex-grow p-4 overflow-y-auto space-y-4",
                children: [
                    messages.map((msg, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: `max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-brand-terracotta text-white rounded-br-lg' : 'bg-white text-brand-charcoal rounded-bl-lg shadow-sm'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                    isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex justify-start",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "max-w-[85%] rounded-2xl px-4 py-2.5 bg-white text-brand-charcoal rounded-bl-lg shadow-sm",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-pulse",
                                        style: {
                                            animationDelay: '0s'
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiChatbot.tsx",
                                        lineNumber: 113,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "w-2 h-2 bg-gray-400 rounded-full animate-pulse",
                                        style: {
                                            animationDelay: '0.2s'
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiChatbot.tsx",
                                        lineNumber: 114,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "p-4 border-t border-brand-cream-dark bg-white/50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "flex items-end gap-2 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-brand-brown p-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            size: "sm",
                            className: "p-2.5 rounded-md aspect-square",
                            onClick: handleSend,
                            disabled: isLoading || !input.trim(),
                            "aria-label": "Отправить сообщение",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["PaperAirplaneIcon"], {
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
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/components/AiChatbot.tsx [ssr] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/AiChatbot.tsx [ssr] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bd96a539._.js.map