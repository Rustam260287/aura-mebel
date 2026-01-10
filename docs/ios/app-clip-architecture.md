# Aura iOS App Clip Architecture

> **Philosophy**: Quiet UX. The App Clip is not an app; it is a temporary AR capability for the room.
> **Core Tech**: SwiftUI, RealityKit, Combine.
> **No**: Auth, Onboarding, Analytics, Persistence.

## 1. Overview

The Aura App Clip is a lightweight (<10MB) binary designed to handle exactly one task: rendering a specific USDZ model in the user's physical space immediately upon invocation via URL/QR Code.

## 2. Project Structure

- **AuraClipApp.swift**: Entry point. Handles lifecycle and URL invocation.
- **ARCoordinator.swift**: Logic brain. Handles downloading, security checks, and loading models into RealityKit.
- **ARContainerView.swift**: The RealityKit view wrapper. Contains system coaching overlays.
- **LoadingView.swift**: Minimalist spinner.

## 3. Implementation Code

### Entry Point (`AuraClipApp.swift`)

```swift
import SwiftUI

@main
struct AuraClipApp: App {
    @StateObject private var coordinator = ARCoordinator()

    var body: some Scene {
        WindowGroup {
            ZStack {
                // The AR Experience
                ARContainerView(coordinator: coordinator)
                    .edgesIgnoringSafeArea(.all)
                
                // Silent Loading Indicator
                if coordinator.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(1.2)
                }
            }
            // Handle Invocation URL (e.g., https://aura-room.ru/clip?model=...)
            .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { userActivity in
                guard let incomingURL = userActivity.webpageURL else { return }
                coordinator.handle(url: incomingURL)
            }
        }
    }
}
```

### The Logic Brain (`ARCoordinator.swift`)

```swift
import RealityKit
import Combine
import Foundation

class ARCoordinator: ObservableObject {
    @Published var isLoading = false
    @Published var arView: ARView?
    
    // Store cancellables for async tasks
    private var cancellables = Set<AnyCancellable>()
    
    // Whitelisted domains for security
    private let allowedHosts = [
        "aura-room.ru",
        "firebasestorage.googleapis.com"
    ]
    
    func handle(url: URL) {
        // Parse URL parameters
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
              let queryItems = components.queryItems,
              let modelUrlString = queryItems.first(where: { $0.name == "model" })?.value,
              let modelUrl = URL(string: modelUrlString) 
        else { return }
        
        // Security Check: prevent loading models from untrusted sources
        guard let host = modelUrl.host, 
              allowedHosts.contains(host) || host.hasSuffix(".firebasestorage.app")
        else { 
            print("Security Block: Unauthorized domain \(modelUrl.host ?? "nil")")
            return 
        }
        
        loadModel(from: modelUrl)
    }
    
    private func loadModel(from url: URL) {
        // If already loading or viewing, reset? For now, simple replacement.
        DispatchQueue.main.async { self.isLoading = true }
        
        let task = URLSession.shared.downloadTask(with: url) { [weak self] localURL, _, error in
            guard let self = self else { return }
            guard let localURL = localURL, error == nil else {
                DispatchQueue.main.async { self.isLoading = false }
                return
            }
            
            // Move to temporary location with .usdz extension (required by RealityKit)
            let tempDir = FileManager.default.temporaryDirectory
            let targetURL = tempDir.appendingPathComponent(UUID().uuidString + ".usdz")
            
            do {
                try FileManager.default.moveItem(at: localURL, to: targetURL)
                
                // Load Async
                DispatchQueue.main.async {
                    self.setupAR(with: targetURL)
                }
            } catch {
                print("File error: \(error)")
                DispatchQueue.main.async { self.isLoading = false }
            }
        }
        task.resume()
    }
    
    private func setupAR(with fileURL: URL) {
        // Load Entity
        Entity.loadModelAsync(contentsOf: fileURL)
            .sink(receiveCompletion: { _ in }, receiveValue: { [weak self] modelEntity in
                guard let self = self, let arView = self.arView else { return }
                
                // Clear previous anchors
                arView.scene.anchors.removeAll()
                
                // Create Anchor (Horizontal Plane)
                let anchor = AnchorEntity(plane: .horizontal)
                
                // Physics & Collision for Gestures
                modelEntity.generateCollisionShapes(recursive: true)
                arView.installGestures([.rotation, .scale, .translation], for: modelEntity)
                
                anchor.addChild(modelEntity)
                arView.scene.addAnchor(anchor)
                
                withAnimation { self.isLoading = false }
            })
            .store(in: &cancellables)
    }
}
```

### AR View Wrapper (`ARContainerView.swift`)

```swift
import SwiftUI
import RealityKit
import ARKit

struct ARContainerView: UIViewRepresentable {
    @ObservedObject var coordinator: ARCoordinator
    
    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: true)
        
        // 1. Lighting: Default is usually good, but we verify environment
        arView.environment.lighting.intensityExponent = 1.0 
        
        // 2. Coaching Overlay
        // Essential for Quiet UX: system teaches user how to find a plane without our text.
        let coachingOverlay = ARCoachingOverlayView()
        coachingOverlay.session = arView.session
        coachingOverlay.goal = .horizontalPlane
        coachingOverlay.activatesAutomatically = true
        coachingOverlay.translatesAutoresizingMaskIntoConstraints = false
        arView.addSubview(coachingOverlay)
        
        // Overlay Constraints
        NSLayoutConstraint.activate([
            coachingOverlay.centerXAnchor.constraint(equalTo: arView.centerXAnchor),
            coachingOverlay.centerYAnchor.constraint(equalTo: arView.centerYAnchor),
            coachingOverlay.widthAnchor.constraint(equalTo: arView.widthAnchor),
            coachingOverlay.heightAnchor.constraint(equalTo: arView.heightAnchor)
        ])
        
        coordinator.arView = arView
        return arView
    }
    
    func updateUIView(_ uiView: ARView, context: Context) {}
}
```

## 4. Configuration Requirements

### Apple-App-Site-Association (AASA)
Hosted at `https://aura-room.ru/.well-known/apple-app-site-association`.

```json
{
  "appclips": {
    "apps": ["<TeamID>.com.aura.clip"]
  }
}
```

### Info.plist
- **NSCameraUsageDescription**: "Камера используется для отображения мебели в вашем интерьере."
- **NSUserActivityTypes**: `NSUserActivityTypeBrowsingWeb`

### Entitlements (`.entitlements`)
- `com.apple.developer.associated-domains`: `appclips:aura-room.ru`

## 5. Web Trigger
On the Next.js product page:

```html
<meta name="apple-itunes-app" 
      content="app-id=YOUR_APP_ID, app-clip-bundle-id=com.aura.clip, app-clip-display=card">
```
