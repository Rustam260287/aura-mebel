self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/blog": [
    "static/chunks/pages/blog.js"
  ],
  "/products": [
    "static/chunks/pages/products.js"
  ],
  "__rewrites": {
    "afterFiles": [],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/admin",
    "/api/blog",
    "/api/blog/generate",
    "/api/blog/[id]",
    "/api/products",
    "/api/products/[id]",
    "/blog",
    "/blog/[id]",
    "/login",
    "/products",
    "/products/[id]"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()