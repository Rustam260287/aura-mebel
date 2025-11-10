module.exports = [
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
}),
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
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseAdmin$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebaseAdmin.ts [ssr] (ecmascript)");
;
;
;
function HomePage({ allProducts, error }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    // ... (ваш JSX остается без изменений, но теперь он может отобразить ошибку)
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                color: 'red'
            },
            children: [
                "Error: ",
                error
            ]
        }, void 0, true, {
            fileName: "[project]/pages/index.tsx",
            lineNumber: 25,
            columnNumber: 12
        }, this);
    }
// ...
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
        const productsSnapshot = await dbAdmin.collection('products').get();
        const allProducts = productsSnapshot.docs.map((doc)=>doc.data());
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

//# sourceMappingURL=%5Broot-of-the-server%5D__64631c28._.js.map