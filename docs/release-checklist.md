# Aura Release Checklist

## 1. Security
- Rotate Firebase / GCP credentials if any private key was previously exposed.
- Confirm no service account JSON files are required inside the repo root on the release machine.
- Run `npm run scan:secrets`.

## 2. Build Gate
- Run `npm run verify:release`.
- Confirm `npm run build` completes without page crashes.
- Confirm `.next/standalone` contains Draco wasm after build.

## 3. Catalog Readiness
- Run `npm run audit:catalog`.
- Confirm public object count is acceptable for launch.
- Confirm public scenes count is acceptable for launch.
- Spot-check that no placeholder-only or non-3D objects appear in `/objects`.

## 4. Core Flows
- `Home -> Objects -> Object -> 3D -> AR`
- `Home -> Wizard -> Result -> Object -> AR`
- `Home -> AI redesign -> Result -> Object -> AR`
- `Saved -> objects / configs / redesigns`

## 5. Device QA

### iPhone Safari
- Object page loads.
- Quick Look opens from object page.
- Returning from Quick Look does not break page state.
- Scene page clearly redirects user to object-level try-on instead of broken scene AR.

### Android Chrome
- Object WebXR AR starts and closes cleanly.
- Scene AR starts, places scene, and closes cleanly.
- External browser fallback is not triggered in normal Chrome.

### In-App Browser
- Object flow shows external browser guidance instead of silent failure.
- Scene flow shows external browser guidance instead of silent failure.

### Desktop
- Object page 3D preview works.
- Wizard live 3D preview works.
- AI redesign result page works without mobile-only assumptions.

## 6. Final Smoke
- Open `/objects`, `/wizard`, `/redesign`, `/saved`, and one `/scenes/:id`.
- Confirm no prices or purchase pressure appear before AR.
- Confirm primary CTA language stays consistent with `Посмотреть в интерьере`.
