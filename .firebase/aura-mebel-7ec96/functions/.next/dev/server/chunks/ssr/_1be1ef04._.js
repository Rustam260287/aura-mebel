module.exports = [
"[project]/services/geminiService.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/utils.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Converts a File object to a base64 encoded string, without the data URI prefix.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string.
 */ __turbopack_context__.s([
    "fileToBase64",
    ()=>fileToBase64,
    "imageUrlToBase64",
    ()=>imageUrlToBase64
]);
const fileToBase64 = (file)=>{
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = ()=>{
            if (typeof reader.result !== 'string') {
                return reject(new Error('Failed to read file as data URL.'));
            }
            // result is "data:image/jpeg;base64,LzlqLzRBQ...""
            // we need to remove the prefix "data:[mime-type];base64,"
            const base64String = reader.result.split(',')[1];
            if (!base64String) {
                return reject(new Error('Failed to extract base64 string from data URL.'));
            }
            resolve(base64String);
        };
        reader.onerror = (error)=>reject(error);
    });
};
const imageUrlToBase64 = (url)=>{
    return new Promise((resolve, reject)=>{
        fetch(url).then((response)=>{
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
        }).then((blob)=>{
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = ()=>{
                if (typeof reader.result !== 'string') {
                    return reject(new Error('Failed to read blob as data URL.'));
                }
                const base64String = reader.result.split(',')[1];
                if (!base64String) {
                    return reject(new Error('Failed to extract base64 string from data URL.'));
                }
                resolve({
                    base64: base64String,
                    mimeType: blob.type
                });
            };
            reader.onerror = (error)=>reject(error);
        }).catch((error)=>reject(`Failed to fetch and convert image: ${error}`));
    });
};
}),
"[project]/components/VirtualStagingModal.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VirtualStagingModal",
    ()=>VirtualStagingModal
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Button.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/geminiService.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [ssr] (ecmascript)");
;
;
;
;
;
;
;
const VirtualStagingModal = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(({ product, onClose })=>{
    const [imageFile, setImageFile] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [imagePreview, setImagePreview] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [generatedImage, setGeneratedImage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [isDragOver, setIsDragOver] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const resetState = ()=>{
        setImageFile(null);
        setImagePreview(null);
        setGeneratedImage(null);
        setIsLoading(false);
        setError(null);
    };
    const handleFile = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((file)=>{
        if (file && file.type.startsWith('image/')) {
            resetState();
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = ()=>{
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setError('Пожалуйста, выберите файл изображения (JPEG, PNG, WEBP).');
        }
    }, []);
    const handleFileChange = (e)=>{
        handleFile(e.target.files?.[0] || null);
    };
    const handleDragOver = (e)=>{
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = (e)=>{
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleDrop = (e)=>{
        e.preventDefault();
        setIsDragOver(false);
        handleFile(e.dataTransfer.files?.[0] || null);
    };
    const handleSubmit = async ()=>{
        if (!imageFile) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const base64Image = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["fileToBase64"])(imageFile);
            const resultBase64 = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["generateConfiguredImage"])(base64Image, imageFile.type, product.name, product.name);
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
        } finally{
            setIsLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in",
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "bg-brand-cream rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
                    className: "flex items-center justify-between p-6 border-b border-brand-cream-dark",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-serif text-brand-brown flex items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["SparklesIcon"], {
                                    className: "w-6 h-6 mr-3"
                                }, void 0, false, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 90,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                "ИИ-стилист: примерка в интерьере"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/VirtualStagingModal.tsx",
                            lineNumber: 89,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "ghost",
                            onClick: onClose,
                            className: "p-2 -mr-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["XMarkIcon"], {
                                className: "w-6 h-6"
                            }, void 0, false, {
                                fileName: "[project]/components/VirtualStagingModal.tsx",
                                lineNumber: 94,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/components/VirtualStagingModal.tsx",
                            lineNumber: 93,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/VirtualStagingModal.tsx",
                    lineNumber: 88,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    children: [
                                        'Загрузите фото вашей комнаты, чтобы "примерить" ',
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                            children: product.name
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 101,
                                            columnNumber: 74
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        "."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 101,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                !imagePreview && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                    onDragOver: handleDragOver,
                                    onDragLeave: handleDragLeave,
                                    onDrop: handleDrop,
                                    className: `flex justify-center w-full h-48 px-4 py-5 border-2 ${isDragOver ? 'border-brand-brown' : 'border-gray-300'} border-dashed rounded-md cursor-pointer transition-colors`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "space-y-1 text-center self-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["PhotoIcon"], {
                                                    className: "mx-auto h-12 w-12 text-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 109,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "relative font-medium text-brand-brown hover:text-brand-brown-dark",
                                                    children: "Загрузите файл"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 110,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " или перетащите"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 108,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                            type: "file",
                                            className: "sr-only",
                                            onChange: handleFileChange,
                                            accept: "image/png, image/jpeg, image/webp"
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 112,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 104,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)),
                                imagePreview && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                            size: "lg",
                                            className: "w-full",
                                            onClick: handleSubmit,
                                            disabled: !imageFile || isLoading,
                                            children: isLoading ? 'Создание...' : 'Сгенерировать'
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 118,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "outline",
                                            size: "sm",
                                            onClick: resetState,
                                            children: "Загрузить другое фото"
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 121,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 117,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "p-3 bg-red-100 text-red-700 rounded-md",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 125,
                                    columnNumber: 23
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/VirtualStagingModal.tsx",
                            lineNumber: 100,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-4",
                            children: [
                                isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "w-full aspect-square bg-white/50 rounded-lg flex flex-col justify-center items-center text-center p-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-brown"
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 132,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "mt-4 font-semibold text-brand-charcoal",
                                            children: "Наш ИИ-дизайнер расставляет мебель..."
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 133,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-600",
                                            children: "Это может занять до 30 секунд."
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 134,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 131,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                !isLoading && (imagePreview || generatedImage) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
                                    children: [
                                        imagePreview && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                    className: "font-semibold text-center mb-2",
                                                    children: "Ваша комната"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 142,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    src: imagePreview,
                                                    alt: "Ваша комната",
                                                    className: "w-full rounded-lg shadow-md aspect-square object-cover",
                                                    width: 500,
                                                    height: 500
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 143,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 141,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        generatedImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                    className: "font-semibold text-center mb-2",
                                                    children: "Результат"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 148,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    src: generatedImage,
                                                    alt: "Сгенерированное изображение",
                                                    className: "w-full rounded-lg shadow-md aspect-square object-cover",
                                                    width: 500,
                                                    height: 500
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 149,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 147,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 139,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                !isLoading && !imagePreview && !generatedImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "w-full aspect-square bg-gray-100 rounded-lg flex justify-center items-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        className: "text-gray-500",
                                        children: "Здесь появится результат"
                                    }, void 0, false, {
                                        fileName: "[project]/components/VirtualStagingModal.tsx",
                                        lineNumber: 157,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 156,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/VirtualStagingModal.tsx",
                            lineNumber: 129,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/VirtualStagingModal.tsx",
                    lineNumber: 98,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/components/VirtualStagingModal.tsx",
            lineNumber: 84,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/VirtualStagingModal.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
VirtualStagingModal.displayName = 'VirtualStagingModal';
}),
"[project]/components/VirtualStagingModal.tsx [ssr] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/VirtualStagingModal.tsx [ssr] (ecmascript)"));
}),
];

//# sourceMappingURL=_1be1ef04._.js.map