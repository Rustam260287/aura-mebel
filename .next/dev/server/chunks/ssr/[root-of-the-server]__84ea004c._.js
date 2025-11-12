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
    ()=>getAdminDb,
    "getAdminStorage",
    ()=>getAdminStorage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/firebase-admin [external] (firebase-admin, cjs)");
;
// Эта функция будет нашим единственным способом получить доступ к admin SDK
const ensureFirebaseAdminInitialized = ()=>{
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["default"].apps.length) {
        try {
            console.log('Lazy initializing Firebase Admin SDK...');
            const serviceAccount = {
                projectId: ("TURBOPACK compile-time value", "aura-mebel-7ec96"),
                clientEmail: ("TURBOPACK compile-time value", "firebase-adminsdk-fbsvc@aura-mebel-7ec96.iam.gserviceaccount.com"),
                privateKey: (("TURBOPACK compile-time value", "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCb3nS5zZf98FrY\nlEIFBedcrL1bAbdTz3qM/gul+BRusL5YA1YrVJtB7Z5bmJ/TNhyIZYHhPXyPbX3p\nh++RjqygPHhaNG3fDuxMOzJUv/6+R1Y0aondk0kdCxZA8/se3/NNrwDm7MqOFH9Y\nsS3tjr32kGu08Z2qz3RtcCH/gHcwy1Xfvgf5xSKOp2FsOsB94oEamU8afBqpi1XP\nEC/GqJSBuzJWs8/hrBpNQ/Ajhr3GZtJ6r30GGxpLyKrYlgk9XNf+CKdStjz8Zvqd\nsGZLTZPP0fRr1qjPTQxlQ1blSaQCDuLGeXJJNbZKbrOywgeraIsauieNsmLEaJne\ng3R9Z/NFAgMBAAECggEAFEhOSB9It/Ke36/rJ1wtTxHrUfxXLsDA4bftLBusDPtS\nyYElpV3NFjcldCXYJlPUQqtyyyyFGOTWjZzyv64hKHi18IcCBRScCw9o7T5Ol9QQ\nk6GJbxvLV8wpiSo2cz4RGvq601HcycBBEfl8UH1SmtMQMOt/6Mo2DEebJPRCjkaz\nR1kYzVq0nxcizU9m97Zg471gOa1egpzIOpFmMPPVk/QOTeqB9mcXAN/yzEYON7Ys\n65YhciKSebKgoa0QNGpnL5pZcUn1uZfgqmSCgPmtkiFRGybaiizY9JzIT2pEAyxV\naoW6PdVWPwo76U9mmZt9T4cNnq0GiGRDSfha5PvnwQKBgQDSYl0/25QgpyJM9U2Y\nIU5U7Wvfqr9oHTRea5ohSb65AQkbihP7CSEDWnT/A/QamVLaKTsrO7WN8C0LX92Z\nrRcLGlj3wZcXoeclZKIcTt+dZv7qKcBVkYx5JxneWes01RiOzuJW6rY7DHqRJmdZ\nd/5ZWfsbco5S03PurVWP2pQOPwKBgQC9qiefGUh7m0eLcg6md44mluVFcEoj5kwT\nBnllWgfrmWHPp9tkbaUajUGflfDxDT8O1uLgrARjpPDOaWuIA7ThuOS6Q7DyVcSw\nK+6urzdAgGR5UEHck4EU4Uq0Nz0w0ED/On9t37Yc+MaochQUO/9cKz3uor8K+cHi\n9cC4DEolewKBgDnQokOcOhbHF1wCxXIbJQWdwVlT+QnJjMyt0Ut4kpsQt8oDpf4E\nwjfDsgcqtPhiTix5zDLTU89Pw3EuxR0oPf7lHLHpV3Y9HeJex1X0Lut4lHERTDO3\nrdzVa/x4xXRdY0RLglPUaIPNqBkfbqNdoF45phIi5w3H4kIjDDJeJPXNAoGAGkNc\nlzBWFB+taYbStoRpn7hXaSUibxQtxpin6LvtytcDb1DMFX0FVsbmpmWJ5qcx6ykg\nY4IOXYnyenKonD3/Jx6GNbC36OathMOgmnnSydC9mPrfE98tCaokwQ3BIGhGB9Ge\n4aUPv7VHNP4O/7pLIwUt30ST9b4d9gKXvCSfg88CgYEAo1nDiYX0Fcc9f1pyXE5T\nE+3Rnkj6UvxDmbbRiy1tw55TXQC6Jki1A7aIZL631ksLNyZ8/D1nOOoOsx6MS8Tj\n0HocVV+gFPYwue6VA2Ben/koD5hHNlobQjjDRR8E/K1F+O26SoSANZw1TaJb0b3A\nszP+qYYCqpDYHOWZXbsnz30=\n-----END PRIVATE KEY-----\n") || '').replace(/\\n/g, '\n')
            };
            if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
                throw new Error('Firebase Admin SDK credentials are not set in .env.local');
            }
            __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["default"].initializeApp({
                credential: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["default"].credential.cert(serviceAccount),
                storageBucket: ("TURBOPACK compile-time value", "aura-mebel-7ec96.firebasestorage.app")
            });
            console.log('Lazy initialization of Firebase Admin SDK successful.');
        } catch (error) {
            console.error('CRITICAL: Lazy initialization of Firebase Admin SDK failed:', error.message);
            // Если инициализация не удалась, мы не можем продолжить.
            // Возвращаем null или выбрасываем ошибку, чтобы вызывающий код мог это обработать.
            return null;
        }
    }
    return __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin__$5b$external$5d$__$28$firebase$2d$admin$2c$__cjs$29$__["default"];
};
const getAdminDb = ()=>{
    const adminInstance = ensureFirebaseAdminInitialized();
    return adminInstance ? adminInstance.firestore() : null;
};
const getAdminStorage = ()=>{
    const adminInstance = ensureFirebaseAdminInitialized();
    return adminInstance ? adminInstance.storage() : null;
};
}),
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
"[project]/components/Button.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const ButtonComponent = ({ variant = 'primary', size = 'md', children, className = '', ...props })=>{
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    const variantClasses = {
        primary: 'bg-brand-brown text-white hover:bg-brand-charcoal focus:ring-brand-brown',
        outline: 'border border-brand-brown/50 text-brand-brown hover:bg-brand-brown hover:text-white focus:ring-brand-brown',
        ghost: 'text-brand-charcoal hover:bg-brand-cream-dark focus:ring-brand-brown'
    };
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-8 py-3 text-lg'
    };
    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
    ].join(' ');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
        className: classes,
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/Button.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const Button = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(ButtonComponent);
}),
"[project]/components/Icons.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ArrowLeftIcon",
    ()=>ArrowLeftIcon,
    "ArrowPathIcon",
    ()=>ArrowPathIcon,
    "ArrowUpTrayIcon",
    ()=>ArrowUpTrayIcon,
    "Bars3Icon",
    ()=>Bars3Icon,
    "ChatBubbleLeftRightIcon",
    ()=>ChatBubbleLeftRightIcon,
    "CheckCircleIcon",
    ()=>CheckCircleIcon,
    "ChevronLeftIcon",
    ()=>ChevronLeftIcon,
    "ChevronRightIcon",
    ()=>ChevronRightIcon,
    "CubeTransparentIcon",
    ()=>CubeTransparentIcon,
    "HeartIcon",
    ()=>HeartIcon,
    "LoadingIcon",
    ()=>LoadingIcon,
    "MinusIcon",
    ()=>MinusIcon,
    "PaintBrushIcon",
    ()=>PaintBrushIcon,
    "PaperAirplaneIcon",
    ()=>PaperAirplaneIcon,
    "PencilSquareIcon",
    ()=>PencilSquareIcon,
    "PhotoIcon",
    ()=>PhotoIcon,
    "PinterestIcon",
    ()=>PinterestIcon,
    "PlusIcon",
    ()=>PlusIcon,
    "RobotIcon",
    ()=>RobotIcon,
    "ShoppingCartIcon",
    ()=>ShoppingCartIcon,
    "SlidersHorizontalIcon",
    ()=>SlidersHorizontalIcon,
    "SparklesIcon",
    ()=>SparklesIcon,
    "StarIcon",
    ()=>StarIcon,
    "TrashIcon",
    ()=>TrashIcon,
    "XMarkIcon",
    ()=>XMarkIcon
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
const HeartIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 9,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 8,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const CubeTransparentIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9.75l-9-5.25M12 12.75l9 5.25"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 16,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 15,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const ArrowUpTrayIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 22,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const XMarkIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M6 18L18 6M6 6l12 12"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 28,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 27,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const SparklesIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.25l-.648-1.688a2.25 2.25 0 01-1.47-1.47l-1.688-.648 1.688-.648a2.25 2.25 0 011.47-1.47l.648-1.688.648 1.688a2.25 2.25 0 011.47 1.47l1.688.648-1.688.648a2.25 2.25 0 01-1.47 1.47z"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 34,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 33,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const RobotIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        strokeWidth: "1.75",
        stroke: "currentColor",
        fill: "none",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: className,
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                stroke: "none",
                d: "M0 0h24v24H0z",
                fill: "none"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 50,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                d: "M7 7h10a2 2 0 0 1 2 2v1l1 1v3l-1 1v3a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-3l-1 -1v-3l1 -1v-1a2 2 0 0 1 2 -2z"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 51,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                d: "M10 16h4"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 52,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                cx: "8.5",
                cy: "11.5",
                r: ".5",
                fill: "currentColor"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 53,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                cx: "15.5",
                cy: "11.5",
                r: ".5",
                fill: "currentColor"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 54,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                d: "M9 7l-1 -4"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 55,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                d: "M15 7l1 -4"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 56,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 39,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const SlidersHorizontalIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 62,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 61,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const TrashIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 68,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 67,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const PlusIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M12 4.5v15m7.5-7.5h-15"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 74,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 73,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const MinusIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M19.5 12h-15"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 80,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 79,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const ArrowLeftIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 86,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 85,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const PaintBrushIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622-3.385m0 0a3 3 0 10-5.78-1.128 2.25 2.25 0 012.4-2.245 4.5 4.5 0 00-8.4 2.245c0 .399.078.78.22 1.128m0 0V21m3.388-16.121a15.998 15.998 0 00-3.388-1.62m-5.043-.025a15.998 15.998 0 01-1.622-3.385m5.043.025a15.998 15.998 0 00-1.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622-3.385"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 92,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 91,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const ChevronLeftIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M15.75 19.5L8.25 12l7.5-7.5"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 98,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 97,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const ChevronRightIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M8.25 4.5l7.5 7.5-7.5 7.5"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 104,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 103,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const StarIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            fillRule: "evenodd",
            d: "M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z",
            clipRule: "evenodd"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 110,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 109,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const PhotoIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 116,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const ArrowPathIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l3.181 3.183m0 0l-3.181-3.183"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 122,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 121,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const PaperAirplaneIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 128,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 127,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const PencilSquareIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 134,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 133,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const CheckCircleIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 140,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 139,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const ChatBubbleLeftRightIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a1.05 1.05 0 01-1.485 0l-3.72-3.72A2.1 2.1 0 014.5 17.097V12.811c0-.97.616-1.813 1.5-2.097m6.525 0l3.72-3.72a1.05 1.05 0 011.485 0l3.72 3.72a2.1 2.1 0 011.98 2.193v4.286c0 .414-.158.812-.44 1.125l-1.558 1.558a1.05 1.05 0 01-1.485 0l-1.558-1.558c-.282-.282-.44-.68-.44-1.125V12.811a2.1 2.1 0 012.1-2.1h.375m-6.525 0h.375m-6.525 0l-3.72-3.72a1.05 1.05 0 00-1.485 0l-3.72 3.72A2.1 2.1 0 003 12.811v4.286c0 .414.158.812.44 1.125l1.558 1.558a1.05 1.05 0 001.485 0l1.558-1.558c.282-.282-.44-.68.44-1.125V12.81a2.1 2.1 0 00-2.1-2.1h-.375m6.525 0h-.375"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 146,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 145,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const ShoppingCartIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            d: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 152,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 151,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const Bars3Icon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        strokeWidth: 1.75,
        stroke: "currentColor",
        className: className,
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 159,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 158,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const PinterestIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        className: className,
        ...props,
        viewBox: "0 0 24 24",
        fill: "currentColor",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
            d: "M12 0C5.373 0 0 5.373 0 12c0 5.103 3.213 9.422 7.625 11.013.013-.438-.03-.837-.05-1.225-.05-.4-.3-1.625-.3-1.625s-.1-.4-.1-.975c0-.913.538-1.6 1.213-1.6.575 0 .85.438.85.963 0 .587-.375 1.462-.563 2.275-.15 1.35 1.163 2.45 2.513 2.45 2.988 0 5.063-3.15 5.063-6.413 0-3.3-2.363-5.612-5.713-5.612-3.837 0-6.025 2.862-6.025 5.762 0 .688.263 1.425.6 1.825.075.088.088.163.063.263-.025.125-.088.337-.113.437-.025.113-.088.138-.213.088-1.213-.488-2-1.938-2-3.337 0-2.613 2.388-5.337 6.488-5.337 3.537 0 6.263 2.513 6.263 6.013 0 3.662-2.213 6.55-5.3 6.55-1.025 0-2-.525-2.338-1.125 0 0-.513 2.038-.638 2.538-.175.762-.525 1.587-.788 2.112C10.013 23.8 11.013 24 12 24c6.625 0 12-5.375 12-12S18.625 0 12 0z"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 165,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 164,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const LoadingIcon = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
        fill: "none",
        viewBox: "0 0 24 24",
        className: className,
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "2.5"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 171,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                className: "opacity-75",
                d: "M4 12a8 8 0 018-8",
                stroke: "currentColor",
                strokeWidth: "2.5",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/components/Icons.tsx",
                lineNumber: 172,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/Icons.tsx",
        lineNumber: 170,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
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
"[externals]/@google/genai [external] (@google/genai, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("@google/genai");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
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
        const API_KEY = ("TURBOPACK compile-time value", "ВАШ_КЛЮЧ_GEMINI_API");
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
"[project]/components/StarRating.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StarRating",
    ()=>StarRating
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [ssr] (ecmascript)");
;
;
;
const StarRating = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(({ rating, maxRating = 5 })=>{
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "flex items-center",
        children: [
            [
                ...Array(fullStars)
            ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["StarIcon"], {
                    className: "w-5 h-5 text-brand-gold fill-current"
                }, `full-${i}`, false, {
                    fileName: "[project]/components/StarRating.tsx",
                    lineNumber: 17,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))),
            [
                ...Array(emptyStars)
            ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["StarIcon"], {
                    className: "w-5 h-5 text-gray-300"
                }, `empty-${i}`, false, {
                    fileName: "[project]/components/StarRating.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)))
        ]
    }, void 0, true, {
        fileName: "[project]/components/StarRating.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
}),
"[project]/contexts/WishlistContext.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WishlistProvider",
    ()=>WishlistProvider,
    "useWishlist",
    ()=>useWishlist
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
"use client";
;
;
const WishlistContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["createContext"])(undefined);
const WishlistProvider = ({ children })=>{
    const [wishlistItems, setWishlistItems] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(()=>{
        // Эта логика теперь безопасна, так как компонент рендерится только на клиенте
        try {
            const item = window.localStorage.getItem('aura_wishlist');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    });
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        try {
            window.localStorage.setItem('aura_wishlist', JSON.stringify(wishlistItems));
        } catch (error) {
            console.error(error);
        }
    }, [
        wishlistItems
    ]);
    const addToWishlist = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((id)=>{
        setWishlistItems((prev)=>[
                ...new Set([
                    ...prev,
                    id
                ])
            ]);
    }, []);
    const removeFromWishlist = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((id)=>{
        setWishlistItems((prev)=>prev.filter((itemId)=>itemId !== id));
    }, []);
    const isInWishlist = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((id)=>{
        return wishlistItems.includes(id);
    }, [
        wishlistItems
    ]);
    const wishlistCount = wishlistItems.length;
    const contextValue = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>({
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            wishlistCount
        }), [
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(WishlistContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/WishlistContext.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useWishlist = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useContext"])(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
}),
"[project]/components/ProductCard.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProductCard",
    ()=>ProductCard
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Button.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StarRating$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/StarRating.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$WishlistContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/WishlistContext.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$ToastContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/ToastContext.tsx [ssr] (ecmascript)");
;
;
;
;
;
;
;
const ProductCard = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(({ product, onProductSelect, onQuickView, onVirtualStage })=>{
    const { isInWishlist, addToWishlist, removeFromWishlist } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$WishlistContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["useWishlist"])();
    const { addToast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$ToastContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const [isAnimatingHeart, setIsAnimatingHeart] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const isWished = isInWishlist(product.id);
    const discount = product.originalPrice ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100) : 0;
    const handleWishlistToggle = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        e.stopPropagation();
        if (isWished) {
            removeFromWishlist(product.id);
            addToast(`${product.name} удален из избранного`, 'info');
        } else {
            addToWishlist(product.id);
            addToast(`${product.name} добавлен в избранное`, 'success');
            setIsAnimatingHeart(true);
            setTimeout(()=>setIsAnimatingHeart(false), 400);
        }
    }, [
        isWished,
        product.id,
        product.name,
        removeFromWishlist,
        addToWishlist,
        addToast
    ]);
    const handleQuickViewClick = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        e.stopPropagation();
        onQuickView?.(product);
    }, [
        onQuickView,
        product
    ]);
    const handleVirtualStageClick = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        e.stopPropagation();
        onVirtualStage?.(product);
    }, [
        onVirtualStage,
        product
    ]);
    const handleShareClick = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async (e)=>{
        e.stopPropagation();
        const shareData = {
            title: product.name,
            text: `Посмотрите этот товар в Aura Мебель: ${product.name}`,
            url: window.location.href
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share was cancelled or failed', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                addToast('Ссылка на товар скопирована!', 'info');
            } catch (err) {
                addToast('Не удалось скопировать ссылку.', 'error');
            }
        }
    }, [
        product.name,
        addToast
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "group relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        onClick: ()=>onProductSelect(product.id),
        children: [
            discount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute top-3 left-3 z-10 bg-brand-terracotta text-white text-xs font-semibold px-2.5 py-1 rounded-full",
                children: [
                    "-",
                    discount,
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProductCard.tsx",
                lineNumber: 78,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute top-3 right-3 z-10 flex flex-col sm:flex-row gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: handleShareClick,
                        className: "p-2 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 transform sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0",
                        title: "Поделиться",
                        "aria-label": "Поделиться товаром",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["ArrowUpTrayIcon"], {
                            className: "w-6 h-6 text-gray-600 hover:text-brand-brown transition-colors"
                        }, void 0, false, {
                            fileName: "[project]/components/ProductCard.tsx",
                            lineNumber: 89,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/ProductCard.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    onVirtualStage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: handleVirtualStageClick,
                        className: "p-2 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 transform sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0",
                        style: {
                            transitionDelay: '50ms'
                        },
                        title: "Примерить в интерьере",
                        "aria-label": "Примерить в интерьере",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["CubeTransparentIcon"], {
                            className: "w-6 h-6 text-gray-600 hover:text-brand-brown transition-colors"
                        }, void 0, false, {
                            fileName: "[project]/components/ProductCard.tsx",
                            lineNumber: 99,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/ProductCard.tsx",
                        lineNumber: 92,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        onClick: handleWishlistToggle,
                        className: `p-2 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 transform sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0 ${isAnimatingHeart ? 'animate-heart-pop' : ''}`,
                        style: {
                            transitionDelay: '100ms'
                        },
                        "aria-label": isWished ? 'Удалить из избранного' : 'Добавить в избранное',
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["HeartIcon"], {
                            className: `w-6 h-6 transition-colors ${isWished ? 'text-brand-terracotta fill-brand-terracotta' : 'text-gray-500 hover:text-brand-terracotta'}`
                        }, void 0, false, {
                            fileName: "[project]/components/ProductCard.tsx",
                            lineNumber: 108,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/ProductCard.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProductCard.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "relative overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                        src: product.imageUrls[0],
                        alt: product.name,
                        className: "w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105",
                        loading: "lazy"
                    }, void 0, false, {
                        fileName: "[project]/components/ProductCard.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    onQuickView && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 flex items-center justify-center p-4 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "primary",
                            className: "bg-white/90 !text-brand-brown hover:bg-white backdrop-blur-sm shadow-lg",
                            onClick: handleQuickViewClick,
                            children: "Быстрый просмотр"
                        }, void 0, false, {
                            fileName: "[project]/components/ProductCard.tsx",
                            lineNumber: 120,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/ProductCard.tsx",
                        lineNumber: 119,
                        columnNumber: 12
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProductCard.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-brand-charcoal truncate",
                        title: product.name,
                        children: product.name
                    }, void 0, false, {
                        fileName: "[project]/components/ProductCard.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: product.category
                    }, void 0, false, {
                        fileName: "[project]/components/ProductCard.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-center mt-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex items-baseline gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        className: "text-xl font-serif text-brand-brown",
                                        children: [
                                            product.price.toLocaleString('ru-RU'),
                                            " ₽"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProductCard.tsx",
                                        lineNumber: 135,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    product.originalPrice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        className: "text-base text-gray-400 line-through",
                                        children: [
                                            product.originalPrice.toLocaleString('ru-RU'),
                                            " ₽"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProductCard.tsx",
                                        lineNumber: 137,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProductCard.tsx",
                                lineNumber: 134,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StarRating$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["StarRating"], {
                                        rating: product.rating
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProductCard.tsx",
                                        lineNumber: 141,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-400 ml-1",
                                        children: [
                                            "(",
                                            product.reviews.length,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProductCard.tsx",
                                        lineNumber: 142,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProductCard.tsx",
                                lineNumber: 140,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProductCard.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProductCard.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProductCard.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
}),
"[project]/components/BeforeAfterSlider.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BeforeAfterSlider",
    ()=>BeforeAfterSlider
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const BeforeAfterSlider = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(({ beforeImage, afterImage })=>{
    const [sliderPosition, setSliderPosition] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(50);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const isDragging = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(false);
    const handleMove = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((clientX)=>{
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = x / rect.width * 100;
        setSliderPosition(percent);
    }, []);
    const handleMouseDown = (e)=>{
        e.preventDefault();
        isDragging.current = true;
    };
    const handleTouchStart = (e)=>{
        isDragging.current = true;
    };
    const handleMouseUp = ()=>{
        isDragging.current = false;
    };
    const handleTouchEnd = ()=>{
        isDragging.current = false;
    };
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        if (isDragging.current) {
            handleMove(e.clientX);
        }
    }, [
        handleMove
    ]);
    const handleTouchMove = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((e)=>{
        if (isDragging.current) {
            handleMove(e.touches[0].clientX);
        }
    }, [
        handleMove
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const container = containerRef.current;
        if (!container) return;
        const handleMouseMoveTyped = (e)=>handleMouseMove(e);
        const handleTouchMoveTyped = (e)=>handleTouchMove(e);
        const handleMouseUpTyped = ()=>handleMouseUp();
        const handleTouchEndTyped = ()=>handleTouchEnd();
        window.addEventListener('mousemove', handleMouseMoveTyped);
        window.addEventListener('touchmove', handleTouchMoveTyped);
        window.addEventListener('mouseup', handleMouseUpTyped);
        window.addEventListener('touchend', handleTouchEndTyped);
        return ()=>{
            window.removeEventListener('mousemove', handleMouseMoveTyped);
            window.removeEventListener('touchmove', handleTouchMoveTyped);
            window.removeEventListener('mouseup', handleMouseUpTyped);
            window.removeEventListener('touchend', handleTouchEndTyped);
        };
    }, [
        handleMouseMove,
        handleTouchMove
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: "relative w-full aspect-video rounded-lg overflow-hidden select-none cursor-ew-resize shadow-lg",
        onMouseDown: handleMouseDown,
        onTouchStart: handleTouchStart,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                src: afterImage,
                alt: "After",
                className: "absolute top-0 left-0 w-full h-full object-cover"
            }, void 0, false, {
                fileName: "[project]/components/BeforeAfterSlider.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute top-0 left-0 w-full h-full object-cover overflow-hidden",
                style: {
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                    src: beforeImage,
                    alt: "Before",
                    className: "absolute top-0 left-0 w-full h-full object-cover"
                }, void 0, false, {
                    fileName: "[project]/components/BeforeAfterSlider.tsx",
                    lineNumber: 88,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/components/BeforeAfterSlider.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute top-0 left-0 bottom-0 flex items-center justify-center bg-brand-cream-dark/50 text-brand-charcoal text-sm font-semibold px-2 py-1 rounded-r-md",
                children: "До"
            }, void 0, false, {
                fileName: "[project]/components/BeforeAfterSlider.tsx",
                lineNumber: 94,
                columnNumber: 8
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute top-0 right-0 bottom-0 flex items-center justify-center bg-brand-brown/50 text-white text-sm font-semibold px-2 py-1 rounded-l-md",
                children: "После"
            }, void 0, false, {
                fileName: "[project]/components/BeforeAfterSlider.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute top-0 h-full w-1 bg-white cursor-ew-resize",
                style: {
                    left: `calc(${sliderPosition}% - 2px)`
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center pointer-events-none",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                        className: "w-5 h-5 text-brand-brown",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M8 9l4-4 4 4m0 6l-4 4-4-4"
                        }, void 0, false, {
                            fileName: "[project]/components/BeforeAfterSlider.tsx",
                            lineNumber: 106,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/BeforeAfterSlider.tsx",
                        lineNumber: 105,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/components/BeforeAfterSlider.tsx",
                    lineNumber: 104,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/components/BeforeAfterSlider.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/BeforeAfterSlider.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
}),
"[project]/components/AiRoomMakeoverPage.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "AiRoomMakeoverPage",
    ()=>AiRoomMakeoverPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Button.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/services/geminiService.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProductCard$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ProductCard.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$BeforeAfterSlider$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/BeforeAfterSlider.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$ToastContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/ToastContext.tsx [ssr] (ecmascript)");
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
;
;
;
const designStyles = [
    'Скандинавский',
    'Лофт',
    'Мид-сенчури',
    'Минимализм',
    'Бохо',
    'Современный',
    'Современный офис',
    'Эко-офис',
    'Офис в стиле лофт',
    'Индустриальный офис',
    'Биофильный офис',
    'Классический офис'
];
const AiRoomMakeoverPage = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(({ allProducts, onNavigate })=>{
    const [imageFile, setImageFile] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [imagePreview, setImagePreview] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [generatedImage, setGeneratedImage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [isDragOver, setIsDragOver] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [recommendedProducts, setRecommendedProducts] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [selectedStyle, setSelectedStyle] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(designStyles[0]);
    const { addToast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$ToastContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const handleFile = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((file)=>{
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = ()=>{
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError(null);
            setRecommendedProducts([]);
            setGeneratedImage(null);
        } else {
            setError('Пожалуйста, выберите файл изображения (JPEG, PNG, WEBP).');
        }
    }, []);
    const handleSubmit = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async ()=>{
        if (!imageFile) return;
        setIsLoading(true);
        setError(null);
        setRecommendedProducts([]);
        setGeneratedImage(null);
        try {
            const base64Image = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["fileToBase64"])(imageFile);
            const { generatedImage: resultBase64, recommendedProductNames } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$services$2f$geminiService$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["generateRoomMakeover"])(base64Image, imageFile.type, selectedStyle, allProducts);
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);
            if (recommendedProductNames.length > 0) {
                const foundProducts = allProducts.filter((p)=>recommendedProductNames.includes(p.name));
                setRecommendedProducts(foundProducts);
            } else if (resultBase64) {
                addToast("Дизайн создан! К сожалению, не удалось подобрать товары из каталога.", 'info');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка при создании интерьера.');
        } finally{
            setIsLoading(false);
        }
    }, [
        imageFile,
        selectedStyle,
        allProducts,
        addToast
    ]);
    const handleProductSelect = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])((productId)=>{
        onNavigate({
            page: 'product',
            productId
        });
    }, [
        onNavigate
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "container mx-auto px-6 py-12",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "text-center mb-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                        className: "text-5xl font-serif text-brand-brown mb-3",
                        children: "AI Дизайнер интерьеров"
                    }, void 0, false, {
                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                        lineNumber: 80,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        className: "text-lg text-brand-charcoal max-w-3xl mx-auto",
                        children: "Загрузите фото вашей комнаты, выберите стиль, и наш ИИ создаст дизайн-проект с мебелью из нашего магазина."
                    }, void 0, false, {
                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                        lineNumber: 81,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                lineNumber: 79,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 lg:grid-cols-2 gap-8 items-start",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "bg-white p-8 rounded-lg shadow-lg space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-semibold text-brand-charcoal mb-3",
                                        children: "1. Загрузите фото вашей комнаты"
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                        lineNumber: 90,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(UploadBox, {
                                        onFile: handleFile,
                                        isDragOver: isDragOver,
                                        setIsDragOver: setIsDragOver
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                        lineNumber: 91,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                lineNumber: 89,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-semibold text-brand-charcoal mb-3",
                                        children: "2. Выберите стиль"
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                        lineNumber: 94,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap gap-3",
                                        children: designStyles.map((style)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setSelectedStyle(style),
                                                disabled: isLoading,
                                                className: `px-4 py-2 rounded-full font-semibold transition-all duration-200 text-sm ${selectedStyle === style ? 'bg-brand-brown text-white shadow-md' : 'bg-brand-cream-dark text-brand-charcoal hover:bg-brand-cream-dark/80 disabled:opacity-50'}`,
                                                children: style
                                            }, style, false, {
                                                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                                lineNumber: 97,
                                                columnNumber: 33
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    }, void 0, false, {
                                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                        lineNumber: 95,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                lineNumber: 93,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Button$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    size: "lg",
                                    className: "w-full",
                                    onClick: handleSubmit,
                                    disabled: !imageFile || isLoading,
                                    children: isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["LoadingIcon"], {
                                                className: "w-6 h-6 mr-3 animate-spin"
                                            }, void 0, false, {
                                                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                                lineNumber: 116,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            "Создаем дизайн..."
                                        ]
                                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["SparklesIcon"], {
                                                className: "w-6 h-6 mr-3"
                                            }, void 0, false, {
                                                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                                lineNumber: 121,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            "Преобразить интерьер"
                                        ]
                                    }, void 0, true)
                                }, void 0, false, {
                                    fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                    lineNumber: 113,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                lineNumber: 112,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "text-red-600 bg-red-100 p-3 rounded-md",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                lineNumber: 127,
                                columnNumber: 31
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                        lineNumber: 88,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "bg-white p-8 rounded-lg shadow-lg min-h-[400px] flex flex-col items-center justify-center",
                        children: isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(LoadingState, {}, void 0, false, {
                            fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                            lineNumber: 133,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)) : generatedImage && imagePreview ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$BeforeAfterSlider$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["BeforeAfterSlider"], {
                            beforeImage: imagePreview,
                            afterImage: generatedImage
                        }, void 0, false, {
                            fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                            lineNumber: 135,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)) : imagePreview ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                            src: imagePreview,
                            alt: "Предпросмотр комнаты",
                            className: "rounded-lg shadow-md w-full max-w-full object-contain"
                        }, void 0, false, {
                            fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                            lineNumber: 137,
                            columnNumber: 26
                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "text-center text-gray-500",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["SparklesIcon"], {
                                    className: "w-24 h-24 mx-auto text-gray-300"
                                }, void 0, false, {
                                    fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                    lineNumber: 140,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "mt-4 text-lg",
                                    children: "Здесь появится ваш новый интерьер"
                                }, void 0, false, {
                                    fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                    lineNumber: 141,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                            lineNumber: 139,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                        lineNumber: 131,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                lineNumber: 86,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            recommendedProducts.length > 0 && !isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "mt-16 animate-subtle-fade-in",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        className: "text-3xl font-serif text-brand-charcoal mb-8 text-center",
                        children: "Мебель из этого интерьера"
                    }, void 0, false, {
                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                        lineNumber: 149,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8",
                        children: recommendedProducts.map((product)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProductCard$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["ProductCard"], {
                                product: product,
                                onProductSelect: handleProductSelect
                            }, product.id, false, {
                                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                lineNumber: 152,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, void 0, false, {
                        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                        lineNumber: 150,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                lineNumber: 148,
                columnNumber: 18
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
        lineNumber: 78,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
});
const UploadBox = ({ onFile, isDragOver, setIsDragOver })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
        onDragOver: (e)=>{
            e.preventDefault();
            setIsDragOver(true);
        },
        onDragLeave: (e)=>{
            e.preventDefault();
            setIsDragOver(false);
        },
        onDrop: (e)=>{
            e.preventDefault();
            setIsDragOver(false);
            onFile(e.dataTransfer.files[0]);
        },
        className: `flex justify-center w-full h-48 px-6 py-5 border-2 ${isDragOver ? 'border-brand-brown' : 'border-gray-300'} border-dashed rounded-md cursor-pointer transition-colors bg-brand-cream/30 hover:bg-brand-cream/60`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "space-y-1 text-center self-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["PhotoIcon"], {
                    className: "mx-auto h-12 w-12 text-gray-400"
                }, void 0, false, {
                    fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                    lineNumber: 173,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "flex text-sm text-gray-600",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "relative font-medium text-brand-brown hover:text-brand-brown-dark",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                    children: "Загрузите файл"
                                }, void 0, false, {
                                    fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                    lineNumber: 176,
                                    columnNumber: 21
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                    type: "file",
                                    className: "sr-only",
                                    onChange: (e)=>e.target.files && onFile(e.target.files[0]),
                                    accept: "image/png, image/jpeg, image/webp"
                                }, void 0, false, {
                                    fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                                    lineNumber: 177,
                                    columnNumber: 21
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                            lineNumber: 175,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            className: "pl-1",
                            children: "или перетащите его сюда"
                        }, void 0, false, {
                            fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                            lineNumber: 179,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                    lineNumber: 174,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                    className: "text-xs text-gray-500",
                    children: "PNG, JPG, WEBP до 10MB"
                }, void 0, false, {
                    fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                    lineNumber: 181,
                    columnNumber: 13
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/components/AiRoomMakeoverPage.tsx",
            lineNumber: 172,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
        lineNumber: 166,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
const LoadingState = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "text-center text-brand-charcoal p-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["SparklesIcon"], {
                className: "w-24 h-24 mx-auto text-brand-brown animate-pulse"
            }, void 0, false, {
                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                lineNumber: 188,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                className: "text-2xl font-serif mt-6",
                children: "Наш ИИ-дизайнер работает..."
            }, void 0, false, {
                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                lineNumber: 189,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                className: "text-gray-600 mt-2",
                children: "Подбираем мебель, настраиваем освещение. Это может занять до минуты."
            }, void 0, false, {
                fileName: "[project]/components/AiRoomMakeoverPage.tsx",
                lineNumber: 190,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/AiRoomMakeoverPage.tsx",
        lineNumber: 187,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/components/Footer.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Footer",
    ()=>Footer
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [ssr] (ecmascript)");
;
;
;
// onNavigate больше не нужен
const FooterComponent = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("footer", {
        className: "bg-brand-cream-dark mt-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "container mx-auto px-6 py-12",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-4 gap-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                    className: "text-xl font-serif text-brand-brown mb-4",
                                    children: "Aura"
                                }, void 0, false, {
                                    fileName: "[project]/components/Footer.tsx",
                                    lineNumber: 11,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "text-brand-charcoal/80",
                                    children: "Мебель, вдохновленная уютом и людьми."
                                }, void 0, false, {
                                    fileName: "[project]/components/Footer.tsx",
                                    lineNumber: 12,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/Footer.tsx",
                            lineNumber: 10,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h4", {
                                    className: "font-semibold text-brand-charcoal mb-4",
                                    children: "Навигация"
                                }, void 0, false, {
                                    fileName: "[project]/components/Footer.tsx",
                                    lineNumber: 15,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/catalog",
                                                className: "text-brand-charcoal/80 hover:text-brand-brown",
                                                children: "Каталог"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Footer.tsx",
                                                lineNumber: 17,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/components/Footer.tsx",
                                            lineNumber: 17,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/ai-room-makeover",
                                                className: "text-brand-charcoal/80 hover:text-brand-brown",
                                                children: "AI-редизайн"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Footer.tsx",
                                                lineNumber: 18,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/components/Footer.tsx",
                                            lineNumber: 18,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/blog",
                                                className: "text-brand-charcoal/80 hover:text-brand-brown",
                                                children: "Блог"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Footer.tsx",
                                                lineNumber: 19,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/components/Footer.tsx",
                                            lineNumber: 19,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/about",
                                                className: "text-brand-charcoal/80 hover:text-brand-brown",
                                                children: "О нас"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Footer.tsx",
                                                lineNumber: 20,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/components/Footer.tsx",
                                            lineNumber: 20,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/contacts",
                                                className: "text-brand-charcoal/80 hover:text-brand-brown",
                                                children: "Контакты"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Footer.tsx",
                                                lineNumber: 21,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/components/Footer.tsx",
                                            lineNumber: 21,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/admin",
                                                className: "text-brand-charcoal/80 hover:text-brand-brown",
                                                children: "Админ-панель"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Footer.tsx",
                                                lineNumber: 22,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/components/Footer.tsx",
                                            lineNumber: 22,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/Footer.tsx",
                                    lineNumber: 16,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/Footer.tsx",
                            lineNumber: 14,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/Footer.tsx",
                    lineNumber: 9,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "mt-12 border-t border-brand-brown/20 pt-8 text-center text-sm text-brand-charcoal/60",
                    children: [
                        "© ",
                        new Date().getFullYear(),
                        " Aura Мебель. Все права защищены."
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/Footer.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/components/Footer.tsx",
            lineNumber: 8,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/Footer.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const Footer = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(FooterComponent);
}),
"[project]/pages/ai-room-makeover.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// pages/ai-room-makeover.tsx
__turbopack_context__.s([
    "default",
    ()=>AiRoomMakeover,
    "getServerSideProps",
    ()=>getServerSideProps
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseAdmin$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebaseAdmin.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dynamic.js [ssr] (ecmascript)");
// Используем ваш существующий компонент
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AiRoomMakeoverPage$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/AiRoomMakeoverPage.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Footer$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Footer.tsx [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AiRoomMakeoverPage$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AiRoomMakeoverPage$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
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
function AiRoomMakeover({ allProducts }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const handleNavigate = (view)=>{
        if (view.page === 'product') {
            router.push(`/products/${view.productId}`);
        } else {
            router.push('/'); // Возврат на главную
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(Header, {
                onNavigate: handleNavigate,
                onStyleFinderClick: ()=>{}
            }, void 0, false, {
                fileName: "[project]/pages/ai-room-makeover.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AiRoomMakeoverPage$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["AiRoomMakeoverPage"], {
                    allProducts: allProducts,
                    onNavigate: handleNavigate
                }, void 0, false, {
                    fileName: "[project]/pages/ai-room-makeover.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/ai-room-makeover.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Footer$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["Footer"], {
                onNavigate: handleNavigate
            }, void 0, false, {
                fileName: "[project]/pages/ai-room-makeover.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
const getServerSideProps = async ()=>{
    const dbAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseAdmin$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["getAdminDb"])();
    if (!dbAdmin) {
        return {
            props: {
                allProducts: []
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
        console.error("Error fetching products for AI Room Makeover:", error);
        return {
            props: {
                allProducts: []
            }
        };
    }
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__84ea004c._.js.map