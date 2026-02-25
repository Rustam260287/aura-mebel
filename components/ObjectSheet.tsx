'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import type { ObjectPublic } from '../types';

// ============================================================================
// ARCHITECTURE — ObjectSheet v2
// ============================================================================
// Drag-to-dismiss ONLY from the handle area (pill bar at top).
// Content area scrolls with one finger as normal.
// When content is scrolled to top AND user pulls down → sheet drags down.
// ============================================================================

interface ObjectSheetProps {
    object: ObjectPublic | null;
    isOpen: boolean;
    onClose: () => void;
}

// --- Thresholds ---
const DISMISS_DISTANCE = 120;
const VELOCITY_THRESHOLD = 500;

// --- Spring configs ---
const SPRING_OPEN = { type: 'spring' as const, stiffness: 300, damping: 30 };

export const ObjectSheet: React.FC<ObjectSheetProps> = ({ object, isOpen, onClose }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);

    // Track touch on content area for pull-to-dismiss when scrolled to top
    const touchStartY = useRef(0);
    const isContentDragging = useRef(false);

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

    // --- Dismiss animation ---
    const dismiss = useCallback(() => {
        animate(y, window.innerHeight, {
            type: 'spring',
            stiffness: 200,
            damping: 25,
            onComplete: onClose,
        });
    }, [y, onClose]);

    const snapBack = useCallback(() => {
        animate(y, 0, {
            type: 'spring',
            stiffness: 400,
            damping: 35,
        });
    }, [y]);

    // --- Content area: pull-to-dismiss when scrolled to top ---
    const handleContentTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        isContentDragging.current = false;
    }, []);

    const handleContentTouchMove = useCallback((e: React.TouchEvent) => {
        const el = contentRef.current;
        if (!el) return;

        const deltaY = e.touches[0].clientY - touchStartY.current;
        const isAtTop = el.scrollTop <= 0;

        // If scrolled to top and pulling DOWN → drag sheet
        if (isAtTop && deltaY > 0) {
            e.preventDefault();
            isContentDragging.current = true;
            setIsDragging(true);
            // Apply elastic resistance
            const dampened = deltaY * 0.5;
            y.set(dampened);
        }
    }, [y]);

    const handleContentTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!isContentDragging.current) return;

        isContentDragging.current = false;
        setIsDragging(false);

        const currentY = y.get();
        if (currentY > DISMISS_DISTANCE) {
            dismiss();
        } else {
            snapBack();
        }
    }, [y, dismiss, snapBack]);

    // --- Handle bar (pill) drag ---
    const handleBarRef = useRef<HTMLDivElement>(null);
    const handleTouchStartY = useRef(0);

    const handleBarTouchStart = useCallback((e: React.TouchEvent) => {
        handleTouchStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    }, []);

    const handleBarTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        const deltaY = e.touches[0].clientY - handleTouchStartY.current;
        if (deltaY > 0) {
            y.set(deltaY);
        }
    }, [y]);

    const handleBarTouchEnd = useCallback(() => {
        setIsDragging(false);
        const currentY = y.get();
        if (currentY > DISMISS_DISTANCE) {
            dismiss();
        } else {
            snapBack();
        }
    }, [y, dismiss, snapBack]);

    // Mouse drag on handle
    const isMouseDragging = useRef(false);
    const mouseStartY = useRef(0);

    const handleBarMouseDown = useCallback((e: React.MouseEvent) => {
        isMouseDragging.current = true;
        mouseStartY.current = e.clientY;
        setIsDragging(true);

        const handleMouseMove = (ev: MouseEvent) => {
            if (!isMouseDragging.current) return;
            const deltaY = ev.clientY - mouseStartY.current;
            if (deltaY > 0) {
                y.set(deltaY);
            }
        };

        const handleMouseUp = () => {
            if (!isMouseDragging.current) return;
            isMouseDragging.current = false;
            setIsDragging(false);
            const currentY = y.get();
            if (currentY > DISMISS_DISTANCE) {
                dismiss();
            } else {
                snapBack();
            }
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [y, dismiss, snapBack]);

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
                        className="fixed inset-x-0 bottom-0 z-[9001] flex flex-col bg-warm-white dark:bg-aura-dark-base rounded-t-3xl shadow-2xl"
                        style={{
                            height: '95dvh',
                            maxHeight: '95dvh',
                            y,
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={SPRING_OPEN}
                    >
                        {/* Drag Handle — ONLY this area is draggable */}
                        <div
                            ref={handleBarRef}
                            className="flex-shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
                            style={{ touchAction: 'none' }}
                            onTouchStart={handleBarTouchStart}
                            onTouchMove={handleBarTouchMove}
                            onTouchEnd={handleBarTouchEnd}
                            onMouseDown={handleBarMouseDown}
                        >
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

                        {/* Scrollable Content — normal one-finger scroll */}
                        <div
                            ref={contentRef}
                            className="flex-1 overflow-y-auto overscroll-contain"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                            onTouchStart={handleContentTouchStart}
                            onTouchMove={handleContentTouchMove}
                            onTouchEnd={handleContentTouchEnd}
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

import { ObjectDetail } from './ObjectDetail';
