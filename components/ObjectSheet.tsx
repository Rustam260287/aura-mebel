'use client';

// ============================================================================
// ObjectSheet v3 — Apple Maps–grade draggable overlay
// ============================================================================
//
// Architecture:
// ─────────────
//   CatalogPage (stays mounted, scroll preserved)
//   └── <ObjectSheet />
//       ├── Backdrop  (motion.div, opacity ↔ drag progress)
//       └── Sheet     (motion.div, y = useMotionValue)
//           ├── HandleZone (48px, touchAction: none, useDrag target)
//           │   └── Pill indicator (40×4px)
//           ├── CloseButton (absolute top-right)
//           └── ContentScroller (overflow-y: auto, overscroll-contain)
//               └── <ObjectDetail />
//
// Gesture pipeline:
// ─────────────────
//  1. useDrag attaches to HandleZone (touch + mouse, filterTaps: true)
//  2. During drag: y follows finger 1:1, clamped with rubberband below 0
//  3. On release:
//     a) velocityY > VELOCITY_DISMISS (0.8 px/ms) → dismiss (spring out)
//     b) offsetY > OFFSET_DISMISS (35% of viewport) → dismiss
//     c) else → snap back to y=0
//  4. Content overscroll transfer:
//     When content.scrollTop ≤ 0 and user drags down → bypass scroll,
//     transfer delta to sheet y (pull-to-dismiss from content).
//
// Spring parameters (tuned to match iOS UIKit):
// ──────────────────────────────────────────────
//   OPEN:      { stiffness: 280, damping: 30 }    — ~300ms settle
//   DISMISS:   { stiffness: 260, damping: 28 }    — ~320ms exit
//   SNAP_BACK: { stiffness: 320, damping: 34 }    — ~250ms snap
//
// Rubberband formula (Apple patent-style):
//   rubberband(offset, dimension, coeff=0.55) =
//     offset * dimension / (dimension + offset * coeff)
//   — Provides diminishing-returns resistance as offset grows
//   — coeff 0.55 matches iOS UIScrollView default
//
// ============================================================================

import React, { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import type { ObjectPublic } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Percentage of viewport height to trigger dismiss */
const OFFSET_DISMISS_RATIO = 0.35;

/** Velocity threshold in px/ms (use-gesture native unit) */
const VELOCITY_DISMISS = 0.8;

/** Spring configs */
const SPRING_OPEN = { type: 'spring' as const, stiffness: 280, damping: 30 };
const SPRING_DISMISS = { type: 'spring' as const, stiffness: 260, damping: 28 };
const SPRING_SNAPBACK = { type: 'spring' as const, stiffness: 320, damping: 34 };

// ---------------------------------------------------------------------------
// Rubberband helper
// ---------------------------------------------------------------------------
// Attempt to replicate iOS UIScrollView rubberband physics.
// Formula: x * d / (d + x * c)
//   x = offset (how far past the edge)
//   d = dimension (container height)
//   c = coefficient (0.55 = iOS default)
// Returns a dampened offset that asymptotically approaches d/c.

function rubberband(offset: number, dimension: number, coeff = 0.55): number {
    if (dimension <= 0) return 0;
    const abs = Math.abs(offset);
    const sign = offset < 0 ? -1 : 1;
    return sign * (abs * dimension) / (dimension + abs * coeff);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ObjectSheetProps {
    object: ObjectPublic | null;
    isOpen: boolean;
    onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ObjectSheet: React.FC<ObjectSheetProps> = ({ object, isOpen, onClose }) => {
    // Motion value driving sheet position. 0 = fully open, >0 = dragged down.
    const y = useMotionValue(0);

    // Refs
    const sheetRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    // Track whether a dismiss animation is in flight to prevent double-fire
    const isDismissing = useRef(false);

    // Remember catalog scroll position for body-lock restore
    const savedScrollY = useRef(0);

    // -----------------------------------------------------------------------
    // Body scroll lock
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (isOpen) {
            savedScrollY.current = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${savedScrollY.current}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
            // Prevent iOS Safari bounce on body
            document.body.style.overscrollBehavior = 'none';

            isDismissing.current = false;

            return () => {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.overflow = '';
                document.body.style.overscrollBehavior = '';
                window.scrollTo(0, savedScrollY.current);
            };
        }
    }, [isOpen]);

    // -----------------------------------------------------------------------
    // History API (shareable URL + back-button closes sheet)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (isOpen && object) {
            window.history.pushState({ sheet: true }, '', `/objects/${object.id}`);
        }
    }, [isOpen, object]);

    useEffect(() => {
        const onPopState = () => {
            if (isOpen) onClose();
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [isOpen, onClose]);

    // -----------------------------------------------------------------------
    // Dismiss / Snap-back animations
    // -----------------------------------------------------------------------
    const dismiss = useCallback(() => {
        if (isDismissing.current) return;
        isDismissing.current = true;

        const vh = window.innerHeight;
        animate(y, vh, {
            ...SPRING_DISMISS,
            onComplete: () => {
                onClose();
                // Reset after unmount completes
                requestAnimationFrame(() => {
                    y.set(0);
                    isDismissing.current = false;
                });
            },
        });
    }, [y, onClose]);

    const snapBack = useCallback(() => {
        animate(y, 0, SPRING_SNAPBACK);
    }, [y]);

    // -----------------------------------------------------------------------
    // useDrag — attached to the HandleZone (48px bar at top)
    // -----------------------------------------------------------------------
    // @use-gesture gives us:
    //   movement[1]  — total Y offset from drag start
    //   velocity[1]  — instantaneous velocity in px/ms
    //   direction[1] — 1 (down) or -1 (up)
    //   last         — true on pointerup
    //   cancel       — abort gesture
    //
    // We only allow downward drag (movement.y > 0). Upward is clamped via
    // rubberband so there's some satisfying resistance but no jarring stop.

    const bindHandleDrag = useDrag(
        ({ movement: [, my], velocity: [, vy], direction: [, dy], last, cancel, event }) => {
            // Prevent default to stop iOS Safari from doing anything weird
            event?.preventDefault();

            if (isDismissing.current) {
                cancel();
                return;
            }

            if (last) {
                // --- Release ---
                const vh = window.innerHeight;
                const shouldDismiss =
                    (vy > VELOCITY_DISMISS && dy > 0) ||    // fast flick down
                    (my > vh * OFFSET_DISMISS_RATIO);       // dragged past 35%

                if (shouldDismiss) {
                    dismiss();
                } else {
                    snapBack();
                }
                return;
            }

            // --- During drag ---
            if (my > 0) {
                // Downward: 1:1 tracking
                y.set(my);
            } else {
                // Upward past origin: rubberband resistance
                const vh = window.innerHeight;
                y.set(rubberband(my, vh, 0.55));
            }
        },
        {
            axis: 'y',
            filterTaps: true,
            pointer: { touch: true },
            // Disable browser gestures on the handle
            eventOptions: { passive: false },
        }
    );

    // -----------------------------------------------------------------------
    // Content overscroll transfer
    // -----------------------------------------------------------------------
    // When the user scrolls the content area to the very top and keeps
    // pulling down, we "transfer" the gesture to the sheet y value,
    // creating a seamless pull-to-dismiss from anywhere in the content.

    const contentTouchStartY = useRef(0);
    const isTransferring = useRef(false);

    const onContentTouchStart = useCallback((e: React.TouchEvent) => {
        contentTouchStartY.current = e.touches[0].clientY;
        isTransferring.current = false;
    }, []);

    const onContentTouchMove = useCallback((e: React.TouchEvent) => {
        const el = contentRef.current;
        if (!el) return;

        const currentY = e.touches[0].clientY;
        const deltaY = currentY - contentTouchStartY.current;
        const isAtTop = el.scrollTop <= 0;

        if (isAtTop && deltaY > 8) {
            // We're past the dead-zone (8px) — begin transfer
            if (!isTransferring.current) {
                isTransferring.current = true;
                // Reset the origin so the sheet doesn't jump
                contentTouchStartY.current = currentY;
            }
        }

        if (isTransferring.current) {
            e.preventDefault();
            const transferDelta = currentY - contentTouchStartY.current;
            // 1:1 tracking
            y.set(Math.max(0, transferDelta));
        }
    }, [y]);

    const onContentTouchEnd = useCallback(() => {
        if (!isTransferring.current) return;
        isTransferring.current = false;

        const currentY = y.get();
        const vh = window.innerHeight;

        if (currentY > vh * OFFSET_DISMISS_RATIO) {
            dismiss();
        } else {
            snapBack();
        }
    }, [y, dismiss, snapBack]);

    // -----------------------------------------------------------------------
    // Derived motion values for backdrop
    // -----------------------------------------------------------------------
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const backdropOpacity = useTransform(y, [0, vh * 0.6], [1, 0]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    if (!object) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        key="sheet-backdrop"
                        className="fixed inset-0 z-[9000]"
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                            opacity: backdropOpacity,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => !isDismissing.current && dismiss()}
                    />

                    {/* ── Sheet ── */}
                    <motion.div
                        key="sheet-container"
                        ref={sheetRef}
                        className="fixed inset-x-0 bottom-0 z-[9001] flex flex-col bg-warm-white dark:bg-aura-dark-base rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
                        style={{
                            height: '95dvh',
                            maxHeight: '95dvh',
                            y,
                            // Prevent iOS over-scroll on the sheet itself
                            overscrollBehavior: 'contain',
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '110%' }}
                        transition={SPRING_OPEN}
                    >
                        {/* ── Handle Zone (48px) ── */}
                        {/* This is the primary drag target. Large enough for comfortable
                            thumb interaction. touchAction: none prevents browser pan. */}
                        <div
                            {...bindHandleDrag()}
                            ref={handleRef}
                            className="flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                            style={{
                                height: 48,
                                touchAction: 'none',
                            }}
                        >
                            {/* Pill indicator */}
                            <div className="w-10 h-1 rounded-full bg-gray-300/80 dark:bg-gray-500/60" />
                        </div>

                        {/* ── Close button ── */}
                        <div className="flex-shrink-0 flex justify-end px-4 -mt-2 pb-1">
                            <button
                                onClick={() => !isDismissing.current && dismiss()}
                                className="p-2.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-colors"
                                aria-label="Закрыть"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* ── Scrollable Content ── */}
                        {/* overscroll-contain prevents iOS Safari from bouncing the
                            entire viewport when the user reaches the end of content.
                            The touch handlers implement overscroll transfer to sheet. */}
                        <div
                            ref={contentRef}
                            className="flex-1 overflow-y-auto"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain',
                            }}
                            onTouchStart={onContentTouchStart}
                            onTouchMove={onContentTouchMove}
                            onTouchEnd={onContentTouchEnd}
                        >
                            <ObjectDetail
                                object={object}
                                onBack={() => !isDismissing.current && dismiss()}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ---------------------------------------------------------------------------
// Lazy import to avoid circular dependencies and preserve code splitting
// ---------------------------------------------------------------------------
import { ObjectDetail } from './ObjectDetail';
