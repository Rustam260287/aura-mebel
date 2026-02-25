'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { ObjectPublic } from '../types';

// ============================================================================
// ARCHITECTURE
// ============================================================================
//
// ┌─────────────────────────────────────────────────────┐
// │  CatalogPage (pages/objects/index.tsx)               │
// │  ┌───────────────────────────────────────────────┐   │
// │  │  <Catalog />                                  │   │  ← stays in DOM, scroll preserved
// │  │  grid of ObjectCards                          │   │
// │  └───────────────────────────────────────────────┘   │
// │                                                     │
// │  ┌───────────────────────────────────────────────┐   │
// │  │  <ObjectSheet />  (portal to body)            │   │  ← overlay, no route change
// │  │  ┌─────────────────────────────────────────┐  │   │
// │  │  │  Backdrop (animated opacity)            │  │   │
// │  │  │  ┌──────────────────────────────────┐   │  │   │
// │  │  │  │  Sheet Container (motion.div)    │   │  │   │
// │  │  │  │  ┌──────────────────────────┐    │   │  │   │
// │  │  │  │  │  DragHandle (pill)       │    │   │  │   │
// │  │  │  │  ├──────────────────────────┤    │   │  │   │
// │  │  │  │  │  <ObjectDetail />        │    │   │  │   │
// │  │  │  │  │  (scrollable content)    │    │   │  │   │
// │  │  │  │  └──────────────────────────┘    │   │  │   │
// │  │  │  └──────────────────────────────────┘   │  │   │
// │  │  └─────────────────────────────────────────┘  │   │
// │  └───────────────────────────────────────────────┘   │
// └─────────────────────────────────────────────────────┘
//
// GESTURE LOGIC:
// ─────────────
// 1. Drag starts on the sheet container (vertical axis only)
// 2. If content is scrolled to top (scrollTop === 0), allow drag-down
// 3. If drag distance > DISMISS_THRESHOLD (120px) → close
// 4. If drag velocity > VELOCITY_THRESHOLD (500px/s) → close (flick)
// 5. Otherwise → spring back to origin
//
// ANIMATION PARAMS:
// ─────────────────
// open:   y: 0,       opacity: 1, spring { stiffness: 300, damping: 30 }
// close:  y: '100vh', opacity: 0, spring { stiffness: 200, damping: 25, duration: 0.3 }
// drag:   y follows finger, backdrop opacity = 1 - (y / screenHeight)
//
// ============================================================================

interface ObjectSheetProps {
    object: ObjectPublic | null;
    isOpen: boolean;
    onClose: () => void;
}

// --- Thresholds ---
const DISMISS_DISTANCE = 120;   // px — swipe distance to trigger close
const VELOCITY_THRESHOLD = 500; // px/s — flick velocity to trigger close

// --- Spring configs ---
const SPRING_OPEN = { type: 'spring' as const, stiffness: 300, damping: 30 };
const SPRING_CLOSE = { type: 'spring' as const, stiffness: 200, damping: 25, duration: 0.3 };
const SPRING_SNAP = { type: 'spring' as const, stiffness: 400, damping: 35 };

export const ObjectSheet: React.FC<ObjectSheetProps> = ({ object, isOpen, onClose }) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);

    // Lock body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    // Update browser URL without navigation (for shareability)
    useEffect(() => {
        if (isOpen && object) {
            window.history.pushState({ sheet: true }, '', `/objects/${object.id}`);
        }
    }, [isOpen, object]);

    // Handle browser back button
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (isOpen) {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, onClose]);

    // --- Drag logic ---
    const canDragDown = useCallback((): boolean => {
        const el = contentRef.current;
        if (!el) return true;
        return el.scrollTop <= 0;
    }, []);

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleDrag = useCallback((_: any, info: PanInfo) => {
        // Only allow dragging down when content is at top
        if (!canDragDown() && info.offset.y > 0) {
            y.set(0);
            return;
        }
        // Prevent dragging up beyond origin
        if (info.offset.y < 0) {
            y.set(0);
            return;
        }
    }, [canDragDown, y]);

    const handleDragEnd = useCallback((_: any, info: PanInfo) => {
        setIsDragging(false);

        const shouldDismiss =
            info.offset.y > DISMISS_DISTANCE ||
            info.velocity.y > VELOCITY_THRESHOLD;

        if (shouldDismiss) {
            onClose();
        }
        // If not dismissed, Framer Motion's dragConstraints will snap back
    }, [onClose]);

    // Backdrop opacity tied to drag position
    const backdropOpacity = useTransform(y, [0, 400], [1, 0]);

    if (!object) return null;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="sheet-backdrop"
                        className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ opacity: isDragging ? backdropOpacity : undefined }}
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        key="sheet-container"
                        ref={sheetRef}
                        className="fixed inset-x-0 bottom-0 z-[9001] flex flex-col bg-warm-white dark:bg-aura-dark-base rounded-t-3xl shadow-2xl"
                        style={{
                            height: '95dvh',
                            maxHeight: '95dvh',
                            y,
                            touchAction: 'none',
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={SPRING_OPEN}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.6 }}
                        dragMomentum={false}
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                    >
                        {/* Drag Handle */}
                        <div className="flex-shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>

                        {/* Close Button (minimal) */}
                        <div className="flex-shrink-0 flex justify-end px-4 pb-2">
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Закрыть"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div
                            ref={contentRef}
                            className="flex-1 overflow-y-auto overscroll-contain"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            <ObjectDetail
                                object={object}
                                onBack={onClose}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Lazy import ObjectDetail to avoid circular deps and keep bundle split
import { ObjectDetail } from './ObjectDetail';
