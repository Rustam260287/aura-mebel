module.exports = [
"[externals]/firebase-admin [external] (firebase-admin, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("firebase-admin", () => require("firebase-admin"));

module.exports = mod;
}),
"[project]/lib/firebaseAdmin.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/firebaseAdmin.ts
__turbopack_context__.s([
    "getAdminDb",
    ()=>getAdminDb
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/firebase-admin [external] (firebase-admin, cjs)");
;
function getAdminDb() {
    // Если приложение уже инициализировано, просто возвращаем инстанс БД.
    if (__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["apps"].length > 0) {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["firestore"]();
    }
    // Если нет - проводим инициализацию.
    try {
        const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
        if (!privateKeyBase64) {
            throw new Error('FIREBASE_PRIVATE_KEY_BASE64 is not defined.');
        }
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('ascii');
        __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["initializeApp"]({
            credential: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["credential"].cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            })
        });
        console.log('[ADMIN SDK] Lazy initialization successful.');
        return __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["firestore"]();
    } catch (error) {
        console.error('[ADMIN SDK] CRITICAL: Lazy initialization failed:', error);
        // Возвращаем null в случае критической ошибки.
        return null;
    }
}
}),
"[project]/pages/index.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pages/index.tsx
__turbopack_context__.s([
    "default",
    ()=>HomePage,
    "getServerSideProps",
    ()=>getServerSideProps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dynamic.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseAdmin$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebaseAdmin.ts [ssr] (ecmascript)"); // <-- Импортируем нашу новую функцию
;
;
;
;
;
;
;
;
const Header = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/components/Header.tsx [ssr] (ecmascript, next/dynamic entry, async loader)").then((mod)=>mod.Header), {
    loadableGenerated: {
        modules: [
            "[project]/components/Header.tsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
const CartSidebar = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/components/CartSidebar.tsx [ssr] (ecmascript, next/dynamic entry, async loader)").then((mod)=>mod.CartSidebar), {
    loadableGenerated: {
        modules: [
            "[project]/components/CartSidebar.tsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
const AiChatbot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/components/AiChatbot.tsx [ssr] (ecmascript, next/dynamic entry, async loader)").then((mod)=>mod.AiChatbot), {
    loadableGenerated: {
        modules: [
            "[project]/components/AiChatbot.tsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
const FloatingChatButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/components/FloatingChatButton.tsx [ssr] (ecmascript, next/dynamic entry, async loader)").then((mod)=>mod.FloatingChatButton), {
    loadableGenerated: {
        modules: [
            "[project]/components/FloatingChatButton.tsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
const QuickViewModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/components/QuickViewModal.tsx [ssr] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/components/QuickViewModal.tsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
const VirtualStagingModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/components/VirtualStagingModal.tsx [ssr] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/components/VirtualStagingModal.tsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
function HomePage({ allProducts, error }) {
// ... ваш JSX ...
}
const getServerSideProps = async ()=>{
    // --- ИСПРАВЛЕНИЕ: Вызываем функцию для получения dbAdmin ---
    const dbAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseAdmin$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["getAdminDb"])();
    if (!dbAdmin) {
        return {
            props: {
                allProducts: [],
                error: "Firebase Admin SDK initialization failed on server. Check server logs."
            }
        };
    }
    try {
        console.log("Fetching products with Admin SDK...");
        const productsSnapshot = await dbAdmin.collection('products').get();
        const allProducts = productsSnapshot.docs.map((doc)=>doc.data());
        console.log(`Successfully fetched ${allProducts.length} products.`);
        return {
            props: {
                allProducts: JSON.parse(JSON.stringify(allProducts))
            }
        };
    } catch (error) {
        console.error("Error fetching data in getServerSideProps:", error);
        return {
            props: {
                allProducts: [],
                error: error.message
            }
        };
    }
};
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2ace42bf._.js.map