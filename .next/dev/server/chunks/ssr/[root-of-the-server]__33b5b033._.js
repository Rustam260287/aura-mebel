module.exports = [
"[project]/lib/firebaseAdmin.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/firebaseAdmin.ts
// --- РЕЖИМ ДИАГНОСТИКИ ---
// Эта функция не подключается к Firebase, а только читает переменные окружения.
__turbopack_context__.s([
    "getFirebaseAdminEnvForDiagnostics",
    ()=>getFirebaseAdminEnvForDiagnostics
]);
function getFirebaseAdminEnvForDiagnostics() {
    console.log("--- [ADMIN ENV DIAGNOSTICS] Reading server environment variables... ---");
    const env = {
        projectId: process.env.FIREBASE_PROJECT_ID || '!!! MISSING !!!',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '!!! MISSING !!!',
        // Мы не выводим сам ключ в лог, только проверяем его наличие.
        privateKeyBase64Status: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'FOUND' : '!!! MISSING !!!',
        // Проверяем, не осталась ли старая переменная.
        oldPrivateKeyStatus: process.env.FIREBASE_PRIVATE_KEY ? 'FOUND (should be removed)' : 'NOT FOUND (good)'
    };
    console.log(env);
    return env;
}
}),
"[project]/pages/index.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pages/index.tsx
__turbopack_context__.s([
    "default",
    ()=>DiagnosticsPage,
    "getServerSideProps",
    ()=>getServerSideProps
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseAdmin$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebaseAdmin.ts [ssr] (ecmascript)"); // <-- Импортируем диагностическую функцию
;
;
function DiagnosticsPage({ env }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: '2rem',
            fontFamily: 'monospace',
            lineHeight: '1.6'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                children: "Server Environment Diagnostics"
            }, void 0, false, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                children: "This page shows what environment variables the server is actually seeing."
            }, void 0, false, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("hr", {
                style: {
                    margin: '1rem 0'
                }
            }, void 0, false, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                        children: "FIREBASE_PROJECT_ID:"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 23,
                        columnNumber: 9
                    }, this),
                    " ",
                    env.projectId
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                        children: "FIREBASE_CLIENT_EMAIL:"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 26,
                        columnNumber: 9
                    }, this),
                    " ",
                    env.clientEmail
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                        children: "FIREBASE_PRIVATE_KEY_BASE64:"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    " ",
                    env.privateKeyBase64Status
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                        children: "(Old) FIREBASE_PRIVATE_KEY:"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    " ",
                    env.oldPrivateKeyStatus
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("hr", {
                style: {
                    margin: '1rem 0'
                }
            }, void 0, false, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                children: "Next Steps:"
            }, void 0, false, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                children: 'If any of these say "!!! MISSING !!!", please double-check your `.env.local` file. Ensure it is in the root directory and that the variable names match exactly.'
            }, void 0, false, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/index.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
const getServerSideProps = async ()=>{
    const env = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseAdmin$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["getFirebaseAdminEnvForDiagnostics"])();
    return {
        props: {
            env
        }
    };
};
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__33b5b033._.js.map