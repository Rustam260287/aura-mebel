
import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SavedPage as SavedPageComponent } from '../components/SavedPage';
import { useRouter } from 'next/router';
import type { ObjectPublic, View } from '../types';
import { useSaved } from '../contexts/SavedContext';
import type { SavedRedesign, SavedWizardConfig } from '../lib/saved/types';
import { trackJourneyEvent } from '../lib/journey/client';
import { useExperience } from '../contexts/ExperienceContext';

export default function Saved() {
  const router = useRouter();
  const { savedObjectIds, savedWizardConfigs, savedRedesigns, removeWizardConfig, removeRedesign } = useSaved();
  const { emitEvent } = useExperience();
  const [objects, setObjects] = useState<ObjectPublic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackJourneyEvent({ type: 'OPEN_SAVED' });
  }, []);

  useEffect(() => {
    emitEvent({ type: 'ENTER_GALLERY' });
  }, [emitEvent]);

  useEffect(() => {
    let isActive = true;
    const fetchObjects = async () => {
      if (savedObjectIds.length === 0) {
        setObjects([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const idsParam = encodeURIComponent(savedObjectIds.join(','));
        const res = await fetch(`/api/objects/saved?ids=${idsParam}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json().catch(() => null)) as any;
        if (isActive) setObjects((data && Array.isArray(data.objects) ? data.objects : []) as ObjectPublic[]);
      } catch (e) {
        console.error('Failed to load saved objects', e);
        if (isActive) setObjects([]);
      } finally {
        if (isActive) setLoading(false);
      }
    };
    fetchObjects();
    return () => { isActive = false; };
  }, [savedObjectIds]);

  return (
    <>
      <Header />
      <main className="flex-grow">
        <SavedPageComponent 
            objects={objects}
            wizardConfigs={savedWizardConfigs}
            redesigns={savedRedesigns}
            isLoading={loading}
            onNavigate={(view: View) => {
                 if (view.page === 'object' && 'objectId' in view) {
                     router.push(`/objects/${view.objectId}`);
                 }
                 if (view.page === 'objects') {
                     router.push('/objects');
                 }
            }}
            onOpenWizardConfig={(config: SavedWizardConfig) => {
              const scale = Number.isFinite(config.scale) ? config.scale.toFixed(2) : '1.00';
              router.push(`/objects/${config.objectId}?source=saved&wizardScale=${encodeURIComponent(scale)}`);
            }}
            onRemoveWizardConfig={removeWizardConfig}
            onOpenRedesign={(redesign: SavedRedesign) => {
              if (redesign.objectId) {
                router.push(`/objects/${redesign.objectId}?source=saved`);
                return;
              }
              router.push('/objects');
            }}
            onRemoveRedesign={removeRedesign}
            onQuickView={() => {}} // Пустая функция, т.к. не используется на этой странице
            onVirtualStage={() => {}} // Пустая функция
        />
      </main>
      <Footer />
    </>
  );
}
