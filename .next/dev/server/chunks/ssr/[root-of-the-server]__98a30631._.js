module.exports = [
"[externals]/@google/genai [external] (@google/genai, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("@google/genai");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
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
"[project]/services/geminiService.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "generateBlogPost",
    ()=>generateBlogPost,
    "generateRoomMakeover",
    ()=>generateRoomMakeover,
    "generateStagedImage",
    ()=>generateStagedImage,
    "getVisualRecommendations",
    ()=>getVisualRecommendations
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$google$2f$genai__$5b$external$5d$__$2840$google$2f$genai$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@google/genai [external] (@google/genai, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils.ts [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$google$2f$genai__$5b$external$5d$__$2840$google$2f$genai$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f40$google$2f$genai__$5b$external$5d$__$2840$google$2f$genai$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
let ai = null;
function getAiInstance() {
    if (!ai) {
        const API_KEY = ("TURBOPACK compile-time value", "YOUR_GEMINI_API_KEY_HERE");
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        ai = new __TURBOPACK__imported__module__$5b$externals$5d2f40$google$2f$genai__$5b$external$5d$__$2840$google$2f$genai$2c$__esm_import$29$__["GoogleGenAI"](API_KEY);
    }
    return ai;
}
const textModel = 'gemini-1.5-pro-latest';
const imageModel = 'gemini-1.5-flash-latest';
const safeJsonParse = (jsonString)=>{
    const cleanedString = jsonString.trim().replace(/^```json/, '').replace(/```$/, '').trim();
    try {
        if (typeof cleanedString === 'object') return cleanedString;
        return JSON.parse(cleanedString);
    } catch (e) {
        console.error("Failed to parse JSON:", e, "String was:", cleanedString);
        return null;
    }
};
const generateStagedImage = async (product, roomImageBase64, roomImageMimeType)=>{
    const ai = getAiInstance();
    if (!ai) throw new Error("AI Service not initialized.");
    const model = ai.getGenerativeModel({
        model: imageModel
    });
    // 1. Get the product image as base64
    const { base64: productImageBase64, mimeType: productImageMimeType } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["imageUrlToBase64"])(product.imageUrl);
    // 2. Prepare the prompt with both images
    const roomImagePart = {
        inlineData: {
            data: roomImageBase64,
            mimeType: roomImageMimeType
        }
    };
    const productImagePart = {
        inlineData: {
            data: productImageBase64,
            mimeType: productImageMimeType
        }
    };
    const textPart = {
        text: `Вставь этот предмет мебели (${product.name}) в изображение комнаты. Сохраняй стиль и освещение комнаты. Мебель должна выглядеть естественно вписанной в интерьер.`
    };
    // 3. Call the model
    const result = await model.generateContent({
        contents: [
            {
                parts: [
                    textPart,
                    productImagePart,
                    roomImagePart
                ]
            }
        ]
    });
    // 4. Extract and return the generated image data
    const imagePart = result.response.candidates?.[0]?.content?.parts?.find((p)=>p.inlineData);
    if (!imagePart?.inlineData?.data) {
        throw new Error("Не удалось сгенерировать изображение. Попробуйте другое фото.");
    }
    return imagePart.inlineData.data;
};
const getVisualRecommendations = async (base64Image, mimeType, products)=>{
    const ai = getAiInstance();
    if (!ai) return [];
    const model = ai.getGenerativeModel({
        model: textModel
    });
    const productList = products.map((p, index)=>`${index}: ${p.name}`).join('\n');
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType
        }
    };
    const textPart = {
        text: `Проанализируй фото. Вот нумерованный список товаров:\n${productList}\n\nВыбери 3-5 подходящих. Верни ТОЛЬКО JSON-массив с числами (индексами).`
    };
    const result = await model.generateContent({
        contents: [
            {
                parts: [
                    imagePart,
                    textPart
                ]
            }
        ]
    });
    return safeJsonParse(result.response.text()) || [];
};
const generateRoomMakeover = async (base64Image, mimeType, style, products)=>{
    const ai = getAiInstance();
    if (!ai) throw new Error("AI Service not initialized.");
    const model = ai.getGenerativeModel({
        model: imageModel
    });
    const imageGenResult = await model.generateContent({
        contents: [
            {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType
                        }
                    },
                    {
                        text: `Переделай комнату в стиле "${style}".`
                    }
                ]
            }
        ]
    });
    const imagePart = imageGenResult.response.candidates?.[0]?.content?.parts?.find((p)=>p.inlineData);
    if (!imagePart?.inlineData) throw new Error("AI не смог сгенерировать изображение.");
    const generatedImage = imagePart.inlineData.data;
    const textModelInstance = ai.getGenerativeModel({
        model: textModel
    });
    const productList = products.map((p)=>`- ${p.name}`).join('\n');
    const textPart = {
        text: `Это дизайн. Вот список мебели:\n${productList}\n\nОпредели 3-5 товаров. Верни JSON-массив с названиями.`
    };
    const productRecResult = await textModelInstance.generateContent({
        contents: [
            {
                parts: [
                    {
                        inlineData: {
                            data: generatedImage,
                            mimeType: 'image/png'
                        }
                    },
                    textPart
                ]
            }
        ]
    });
    const recommendedProductNames = safeJsonParse(productRecResult.response.text()) || [];
    return {
        generatedImage,
        recommendedProductNames
    };
};
const generateBlogPost = async (allProducts)=>{
    const ai = getAiInstance();
    if (!ai) throw new Error("AI Service not initialized.");
    const model = ai.getGenerativeModel({
        model: textModel
    });
    const productSample = allProducts.slice(0, 15).map((p)=>({
            name: p.name,
            id: p.id
        }));
    const blogPrompt = `Ты — AI-копирайтер... (промпт без изменений)`;
    const blogResult = await model.generateContent(blogPrompt);
    const blogData = safeJsonParse(blogResult.response.text());
    if (!blogData?.imagePrompt) throw new Error("AI не смог сгенерировать данные статьи.");
    const imageModelInstance = ai.getGenerativeModel({
        model: imageModel
    });
    const imageResult = await imageModelInstance.generateContent(blogData.imagePrompt);
    const imagePart = imageResult.response.candidates?.[0]?.content?.parts?.find((p)=>p.inlineData);
    if (!imagePart?.inlineData) throw new Error("AI не смог сгенерировать изображение.");
    return {
        ...blogData,
        imageBase64: imagePart.inlineData.data
    };
}; // ... и так далее для всех функций
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/components/VirtualStagingModal.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

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
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
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
            const resultBase64 = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["generateStagedImage"])(product, base64Image, imageFile.type);
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
                                    lineNumber: 89,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                "ИИ-стилист: примерка в интерьере"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/VirtualStagingModal.tsx",
                            lineNumber: 88,
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
                                lineNumber: 93,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/components/VirtualStagingModal.tsx",
                            lineNumber: 92,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/VirtualStagingModal.tsx",
                    lineNumber: 87,
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
                                            lineNumber: 100,
                                            columnNumber: 64
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        "."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 100,
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
                                                    lineNumber: 108,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "relative font-medium text-brand-brown hover:text-brand-brown-dark",
                                                    children: "Загрузите файл"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 109,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " или перетащите"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 107,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                            type: "file",
                                            className: "sr-only",
                                            onChange: handleFileChange,
                                            accept: "image/png, image/jpeg, image/webp"
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 111,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 103,
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
                                            lineNumber: 117,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "outline",
                                            size: "sm",
                                            onClick: resetState,
                                            children: "Загрузить другое фото"
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 120,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 116,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "p-3 bg-red-100 text-red-700 rounded-md",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 124,
                                    columnNumber: 23
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/VirtualStagingModal.tsx",
                            lineNumber: 99,
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
                                            lineNumber: 131,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "mt-4 font-semibold text-brand-charcoal",
                                            children: "Наш ИИ-дизайнер расставляет мебель..."
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 132,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-600",
                                            children: "Это может занять до 30 секунд."
                                        }, void 0, false, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 133,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 130,
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
                                                    lineNumber: 141,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                                    src: imagePreview,
                                                    alt: "Ваша комната",
                                                    className: "w-full rounded-lg shadow-md aspect-square object-cover"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 142,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 140,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        generatedImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                    className: "font-semibold text-center mb-2",
                                                    children: "Результат"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 147,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                                    src: generatedImage,
                                                    alt: "Сгенерированное изображение",
                                                    className: "w-full rounded-lg shadow-md aspect-square object-cover"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                                    lineNumber: 148,
                                                    columnNumber: 25
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/VirtualStagingModal.tsx",
                                            lineNumber: 146,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 138,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                !isLoading && !imagePreview && !generatedImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "w-full aspect-square bg-gray-100 rounded-lg flex justify-center items-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        className: "text-gray-500",
                                        children: "Здесь появится результат"
                                    }, void 0, false, {
                                        fileName: "[project]/components/VirtualStagingModal.tsx",
                                        lineNumber: 156,
                                        columnNumber: 21
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/components/VirtualStagingModal.tsx",
                                    lineNumber: 155,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/VirtualStagingModal.tsx",
                            lineNumber: 128,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/VirtualStagingModal.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/components/VirtualStagingModal.tsx",
            lineNumber: 83,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/VirtualStagingModal.tsx",
        lineNumber: 82,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/components/VirtualStagingModal.tsx [ssr] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/VirtualStagingModal.tsx [ssr] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__98a30631._.js.map