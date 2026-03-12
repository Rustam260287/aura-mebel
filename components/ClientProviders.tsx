"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { SavedProvider } from '../contexts/SavedContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastContainer } from './ToastContainer';
import { AssistantProvider } from '../contexts/AssistantContext';
import { AssistantRenderer } from './Assistant/AssistantRenderer';
import { useObjectModals } from '../hooks/useObjectModals';
import { FloatingMenuButton } from './FloatingMenuButton';
import { MobileMenuOverlay } from './MobileMenuOverlay';
import { ImmersiveProvider, useImmersive } from '../contexts/ImmersiveContext';
import { pingVisitor } from '../lib/journey/client';
import { ExperienceProvider } from '../contexts/ExperienceContext';
import { ExperienceStateOrchestrator } from './ExperienceStateOrchestrator';
import { getFirebaseAnalytics, logPageView } from '../lib/firebase/analytics';

const ImageZoomModal = dynamic(() => import('./ImageZoomModal').then(mod => mod.ImageZoomModal), { ssr: false });

const MobileMenuChrome: React.FC = () => {
  const router = useRouter();
  const { isImmersive } = useImmersive();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };
    updateIsMobile();

    mediaQuery.addEventListener('change', updateIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile);
    };
  }, []);

  useEffect(() => {
    if (isImmersive) setOpen(false);
  }, [isImmersive]);

  useEffect(() => {
    const handleRouteChangeStart = () => setOpen(false);
    router.events.on('routeChangeStart', handleRouteChangeStart);
    return () => router.events.off('routeChangeStart', handleRouteChangeStart);
  }, [router.events]);

  const isFullscreenRoute =
    typeof router.asPath === 'string' &&
    (router.asPath.startsWith('/objects/') || router.asPath.startsWith('/scenes/'));

  const isVisible = isMobile && !isImmersive && !isFullscreenRoute;

  if (!isVisible) return null;

  return (
    <>
      {!open && <FloatingMenuButton onClick={() => setOpen(true)} />}
      <MobileMenuOverlay
        open={open}
        onClose={() => setOpen(false)}
        onObjects={() => {
          setOpen(false);
          router.push('/objects');
        }}
        onWizard={() => {
          setOpen(false);
          router.push('/wizard');
        }}
        onRedesign={() => {
          setOpen(false);
          router.push('/redesign');
        }}
        onSaved={() => {
          setOpen(false);
          router.push('/saved');
        }}
      />
    </>
  );
};

export const ClientProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const {
    imageModalState,
    closeImageModal,
  } = useObjectModals();
  const router = useRouter();

  useEffect(() => {
    // This is a workaround for iOS Safari's viewport height issue.
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  useEffect(() => {
    void pingVisitor();
  }, []);

  // Initialize Firebase Analytics on mount
  useEffect(() => {
    void getFirebaseAnalytics();
  }, []);

  // Log page_view on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      void logPageView(url, document.title);
    };

    // Log initial page view
    void logPageView(router.asPath, document.title);

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.asPath, router.events]);

  useEffect(() => {
    // Ensure <model-viewer> is defined early to avoid race conditions when users tap AR/3D quickly.
    import('@google/model-viewer').catch(console.error);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const isObjectDetail = (path: string) => path.startsWith('/objects/');

    const rememberEntry = () => {
      try {
        const current = router.asPath || '';
        if (!current) return;
        if (isObjectDetail(current)) return;
        window.sessionStorage.setItem('label_last_entry_path', current);
      } catch { }
    };

    // Capture the path we are leaving (entrypoint for object detail).
    const handleRouteChangeStart = () => rememberEntry();
    router.events.on('routeChangeStart', handleRouteChangeStart);

    // Also capture on first mount.
    rememberEntry();

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isChunkLoadError = (error: unknown) => {
      if (!error) return false;
      if (error instanceof Error) {
        const message = (error.message || '').toLowerCase();
        const name = (error.name || '').toLowerCase();
        if (name.includes('chunkloaderror')) return true;
        if (message.includes('failed to load chunk')) return true;
        if (message.includes('loading chunk')) return true;
      }
      const raw = String(error).toLowerCase();
      return raw.includes('chunkloaderror') || raw.includes('failed to load chunk') || raw.includes('loading chunk');
    };

    const reloadOnceForUrl = (url: string) => {
      try {
        const key = `label_chunk_reload:${url}`;
        if (window.sessionStorage.getItem(key)) return false;
        window.sessionStorage.setItem(key, '1');
      } catch {
        // If sessionStorage is blocked, still attempt a single reload.
      }
      window.location.href = url;
      return true;
    };

    const handleRouteChangeError = (err: unknown, url: string) => {
      if (!isChunkLoadError(err)) return;
      reloadOnceForUrl(url);
    };

    router.events.on('routeChangeError', handleRouteChangeError);
    return () => {
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router.events]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (typeof window === 'undefined') return;

    const cleanupDevServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
        }
      } catch {
        // ignore
      }

      try {
        if ('caches' in window) {
          const keys = await window.caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.includes('workbox') || key.includes('next-pwa'))
              .map((key) => window.caches.delete(key)),
          );
        }
      } catch {
        // ignore
      }
    };

    void cleanupDevServiceWorker();
  }, []);

  return (
    <ImmersiveProvider>
      <AuthProvider>
        <ToastProvider>
          <ExperienceProvider>
            <SavedProvider>
              <ThemeProvider>
                <AssistantProvider>
                  {children}
                  <ToastContainer />
                  <ExperienceStateOrchestrator />
                  <AssistantRenderer />
                  <MobileMenuChrome />
                  <ImageZoomModal
                    isOpen={imageModalState.isOpen}
                    images={imageModalState.images}
                    initialIndex={imageModalState.initialIndex}
                    objectTitle={imageModalState.objectName}
                    onClose={closeImageModal}
                  />
                </AssistantProvider>
              </ThemeProvider>
            </SavedProvider>
          </ExperienceProvider>
        </ToastProvider>
      </AuthProvider>
    </ImmersiveProvider>
  );
};
