// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

const SPLASH_STORAGE_KEY = 'labelcom:splash:v1';

const splashHeadScript = `(function(){
  try {
    var seen = localStorage.getItem('${SPLASH_STORAGE_KEY}');
    if (seen) document.documentElement.classList.add('pwa-splash-skip');
  } catch (e) {}

  try {
    var prefersReduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2;
    var lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    if (prefersReduced || saveData || lowMemory || lowCpu) document.documentElement.classList.add('pwa-splash-lite');
  } catch (e) {}
})();`;

const splashBodyScript = `(function(){
  var root = document.documentElement;
  var splash = document.getElementById('pwa-splash');
  if (!splash) return;

  if (root.classList.contains('pwa-splash-skip')) {
    splash.remove();
    return;
  }

  try { localStorage.setItem('${SPLASH_STORAGE_KEY}', '1'); } catch (e) {}

  var isLite = root.classList.contains('pwa-splash-lite');
  if (isLite) splash.classList.add('pwa-splash--lite');

  requestAnimationFrame(function(){ splash.classList.add('pwa-splash--play'); });

  var motionMs = isLite ? 460 : 900;
  var fadeMs = 240;

  window.setTimeout(function(){
    splash.classList.add('pwa-splash--hide');
    window.setTimeout(function(){
      splash.remove();
    }, fadeMs + 40);
  }, motionMs);
})();`;

const splashCss = `
/* PWA premium splash (first launch only) */
#pwa-splash {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FBF9F4;
  opacity: 1;
  transition: opacity 240ms ease;
  pointer-events: all;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html.pwa-splash-skip #pwa-splash {
  display: none;
}

#pwa-splash.pwa-splash--hide {
  opacity: 0;
  pointer-events: none;
}

.pwa-splash__stage {
  width: min(62vw, 220px);
  height: min(62vw, 220px);
  display: grid;
  place-items: center;
  perspective: 900px;
}

.pwa-splash__medallion {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  transform-style: preserve-3d;
  will-change: transform;
  filter: drop-shadow(0 18px 28px rgba(93, 64, 55, 0.14));
}

.pwa-splash__img {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: inherit;
}

.pwa-splash__shade {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  transform: translateZ(16px);
  background:
    radial-gradient(circle at 28% 20%, rgba(255, 255, 255, 0.20), rgba(255, 255, 255, 0.00) 40%),
    radial-gradient(circle at 78% 84%, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.00) 46%);
}

.pwa-splash__letter {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translateZ(26px);
  font-family: "Playfair Display", "Times New Roman", serif;
  font-weight: 700;
  font-size: clamp(120px, 34vw, 190px);
  line-height: 1;
  letter-spacing: -0.06em;
  background: linear-gradient(160deg, #FFF2D6 0%, #E6C08C 22%, #C3834E 55%, #7A3F25 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow:
    0 10px 22px rgba(0, 0, 0, 0.18),
    0 1px 0 rgba(255, 255, 255, 0.22);
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.18));
  pointer-events: none;
}

.pwa-splash__letter::after {
  content: "L";
  position: absolute;
  inset: 0;
  transform: translate(0, -1px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.00) 55%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  opacity: 0.55;
}

.pwa-splash__glint {
  position: absolute;
  inset: -10%;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-130%) rotate(10deg) translateZ(30px);
  mix-blend-mode: screen;
  background: linear-gradient(110deg, transparent 42%, rgba(255, 255, 255, 0.75) 49%, transparent 56%);
  -webkit-mask: radial-gradient(circle, transparent 61%, #000 62%, #000 74%, transparent 75%);
  mask: radial-gradient(circle, transparent 61%, #000 62%, #000 74%, transparent 75%);
  filter: blur(0.2px);
}

#pwa-splash.pwa-splash--play .pwa-splash__medallion {
  animation: pwaSplashTilt 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

#pwa-splash.pwa-splash--play .pwa-splash__glint {
  animation: pwaSplashGlint 700ms ease-out both;
  animation-delay: 130ms;
}

#pwa-splash.pwa-splash--lite .pwa-splash__medallion {
  animation: none !important;
  transform: none !important;
}

#pwa-splash.pwa-splash--lite .pwa-splash__glint {
  display: none !important;
}

@keyframes pwaSplashTilt {
  0%   { transform: rotateX(0deg) rotateY(0deg) scale(1); }
  26%  { transform: rotateX(10deg) rotateY(-10deg) scale(1.02); }
  44%  { transform: rotateX(-6deg) rotateY(8deg) scale(1.01); }
  72%  { transform: rotateX(0deg) rotateY(0deg) scale(1); }
  100% { transform: rotateX(0deg) rotateY(0deg) scale(1); }
}

@keyframes pwaSplashGlint {
  0%   { opacity: 0; transform: translateX(-130%) rotate(10deg) translateZ(30px); }
  12%  { opacity: 0.95; }
  55%  { opacity: 0.55; }
  100% { opacity: 0; transform: translateX(130%) rotate(10deg) translateZ(30px); }
}

@media (prefers-reduced-motion: reduce) {
  #pwa-splash {
    transition: none;
  }
  #pwa-splash .pwa-splash__medallion,
  #pwa-splash .pwa-splash__glint {
    animation: none !important;
  }
}
`;

export default function Document() {
  return (
    <Html lang="ru">
      <Head>
        {/* FIX: Добавлен crossOrigin="use-credentials" для исправления CORS ошибки в Cloud Workstations */}
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <meta name="theme-color" content="#5D4037" />
        <meta name="application-name" content="Labelcom Мебель" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Labelcom Мебель" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* NEW SVG Favicon (Priority) */}
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />

        {/* PWA & Mobile Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        
        {/* Browser Favicons (Legacy) */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="icon" href="/favicon.ico" />

        {/* PWA Splash (critical CSS + early decision to avoid flicker) */}
        <script dangerouslySetInnerHTML={{ __html: splashHeadScript }} />
        <style id="pwa-splash-css" dangerouslySetInnerHTML={{ __html: splashCss }} />
        <link rel="preload" as="image" href="/splash/labelcom-medallion.svg" type="image/svg+xml" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        {/* no-js: do not block the app shell */}
        <noscript>
          <style>{`#pwa-splash{display:none !important;}`}</style>
        </noscript>

        <div id="pwa-splash" className="pwa-splash" aria-hidden="true">
          <div className="pwa-splash__stage">
            <div className="pwa-splash__medallion">
              <img
                className="pwa-splash__img"
                src="/splash/labelcom-medallion.svg"
                alt=""
                decoding="async"
                fetchPriority="high"
              />
              <div className="pwa-splash__shade" />
              <div className="pwa-splash__glint" />
              <div className="pwa-splash__letter">L</div>
            </div>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: splashBodyScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
