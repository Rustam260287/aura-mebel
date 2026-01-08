import React, { useEffect, useRef, useState } from 'react';

/**
 * AuraField - A subtle, atmospheric background effect using Canvas 2D.
 * Creates a "breathing" field of soft light that gently reacts to cursor movement.
 * Optimized for performance: uses requestAnimationFrame and simplifies on mobile.
 */
export const AuraField: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Basic mobile check
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        // Resize handling
        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        // State for animation
        let time = 0;
        const mouse = { x: width / 2, y: height / 2 };
        const targetMouse = { x: width / 2, y: height / 2 };
        let hasInteracted = false;

        // Interaction pulse integration
        let loadProgress = 0; // 0 to 1
        const PULSE_DURATION = 1500; // ms
        let pulseStartTime: number | null = null;

        const handleMouseMove = (e: MouseEvent) => {
            targetMouse.x = e.clientX;
            targetMouse.y = e.clientY;

            if (!hasInteracted) {
                hasInteracted = true;
                pulseStartTime = performance.now();
            }
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Orbs configuration
        // Layer depths: 0 (Far), 1 (Mid), 2 (Near) -> Anchored separately

        const createOrb = (type: 'anchor' | 'far' | 'mid' | 'near', i: number) => {
            const baseRadius = Math.min(width, height);

            if (type === 'anchor') {
                return {
                    type,
                    x: width * 0.7, // Offset from center
                    y: height * 0.4,
                    radius: baseRadius * 1.2,
                    baseRadius: baseRadius * 1.2,
                    color: 'rgba(255, 255, 255, 0.55)', // Key light
                    parallax: 0,
                    driftSpeed: 0.0002,
                    phase: 0,
                };
            }

            // Layered orbs
            const layerProps = {
                far: { radius: 0.9, color: 'rgba(231, 229, 228, 0.35)', parallax: 0.015, drift: 0.1 }, // Stone 200 light
                mid: { radius: 0.7, color: 'rgba(214, 211, 209, 0.25)', parallax: 0.04, drift: 0.2 }, // Stone 300 light
                near: { radius: 0.5, color: 'rgba(255, 255, 255, 0.3)', parallax: 0.08, drift: 0.3 }, // Highlight
            };

            const props = layerProps[type as keyof typeof layerProps] || layerProps.mid;

            return {
                type,
                x: Math.random() * width,
                y: Math.random() * height,
                radius: baseRadius * props.radius,
                baseRadius: baseRadius * props.radius,
                color: props.color,
                parallax: props.parallax,
                driftSpeed: 0.001 * props.drift,
                phase: Math.random() * Math.PI * 2,
            };
        };

        const orbs = isMobile ? [
            createOrb('anchor', 0),
            createOrb('far', 1)
        ] : [
            createOrb('anchor', 0), // Main gentle light
            createOrb('far', 1),    // Deep background
            createOrb('mid', 2),    // Mid layer
            createOrb('near', 3),   // Subtle foreground highlight
        ];

        let animationFrameId: number;

        const render = (now: number) => {
            // Lerp mouse
            mouse.x += (targetMouse.x - mouse.x) * 0.035; // Slower lerp for weight
            mouse.y += (targetMouse.y - mouse.y) * 0.035;

            // Pulse Logic
            let pulseScale = 1;
            let pulseOpacity = 1;

            if (hasInteracted && pulseStartTime) {
                const elapsed = now - pulseStartTime;
                if (elapsed < 300) {
                    // easeOutQuad
                    const t = elapsed / 300;
                    const ease = t * (2 - t);
                    pulseScale = 1 + (0.15 * ease);
                    pulseOpacity = 1 + (0.15 * ease);
                } else if (elapsed < PULSE_DURATION) {
                    // easeOutSine return
                    const t = (elapsed - 300) / (PULSE_DURATION - 300);
                    const ease = Math.cos((t * Math.PI) / 2); // 1 to 0
                    pulseScale = 1 + (0.15 * ease); // Return to 1
                    pulseOpacity = 1 + (0.15 * ease);
                } else {
                    pulseScale = 1;
                    pulseOpacity = 1;
                }
            }

            // Clear
            ctx.fillStyle = '#F5F5F4'; // Warm White Base
            ctx.fillRect(0, 0, width, height);

            time += 0.002; // Slower time

            // Filter for blur - global is faster than per-shape in some browsers, but per-shape gives control
            ctx.filter = 'blur(100px)';

            orbs.forEach((orb) => {
                let x = orb.x;
                let y = orb.y;

                // Drift
                if (orb.type === 'anchor') {
                    // Very slow elliptical path
                    x += Math.sin(time * 0.5) * (width * 0.1);
                    y += Math.cos(time * 0.3) * (height * 0.05);
                } else {
                    // Natural float
                    x += Math.sin(time + orb.phase) * (width * 0.05);
                    y += Math.cos(time + orb.phase + 1) * (height * 0.05);
                }

                // Parallax
                if (orb.parallax > 0) {
                    x += (mouse.x - width / 2) * orb.parallax;
                    y += (mouse.y - height / 2) * orb.parallax;
                }

                // Apply Pulse to Anchor only
                let currentRadius = orb.radius;
                let currentColor = orb.color;

                if (orb.type === 'anchor') {
                    currentRadius *= pulseScale;
                    // Opacity hack using globalAlpha strictly for the pulse feel might be better or string manip
                    // Let's stick to base drawing
                }

                // Draw Gradient
                // We used to do radialGradient, but for pure soft orbs with high blur, simple circles are often cleaner to blend
                // However, gradient preserves the core "light" feel better
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius);

                // Parse alpha for pulse
                // Simplified: All defined colors are rgba.

                gradient.addColorStop(0, orb.color);
                gradient.addColorStop(1, 'rgba(245, 245, 244, 0)');

                ctx.fillStyle = gradient;

                // Interaction Pulse Opacity bump
                const oldAlpha = ctx.globalAlpha;
                if (orb.type === 'anchor') {
                    ctx.globalAlpha = pulseOpacity; // Slight boost > 1 is clamped to 1 usually, need base < 1
                }

                ctx.beginPath();
                ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = oldAlpha;
            });

            ctx.filter = 'none'; // Reset

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isMobile]);

    if (isMobile) {
        return <div className="fixed inset-0 bg-stone-50 z-[-1]" />;
    }

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[-1]"
            style={{ opacity: 1 }}
        />
    );
};
