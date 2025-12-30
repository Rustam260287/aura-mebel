
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { JournalEntry, View } from '../../types';
import { JournalListPage } from '../../components/JournalListPage';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { JournalListSkeleton } from '../../components/JournalListSkeleton';

const JOURNAL_CACHE_TTL = 45_000;
let journalListCache: { entries: JournalEntry[]; timestamp: number } | null = null;

export default function JournalIndex() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let isActive = true;
    if (journalListCache && Date.now() - journalListCache.timestamp < JOURNAL_CACHE_TTL) {
      setEntries(journalListCache.entries);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    const controller = new AbortController();
    setError(null);

    const fetchList = async () => {
      try {
        const res = await fetch('/api/journal/list', { signal: controller.signal });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Не удалось загрузить статьи');
        }
        const data = await res.json().catch(() => ({}));
        if (!isActive) return;
        const freshEntries = (data.posts ?? []) as JournalEntry[];
        setEntries(freshEntries);
        journalListCache = {
          entries: freshEntries,
          timestamp: Date.now(),
        };
      } catch (err) {
        if (!isActive) return;
        console.error('Journal list fetch failed', err);
        setError(err instanceof Error ? err.message : 'Не удалось загрузить статьи журнала.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchList();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const handleNavigate = (view: View) => {
    if (view.page === 'journal-entry') return router.push(`/journal/${view.entryId}`);
    if (view.page === 'journal-list' || view.page === 'journal') return router.push('/journal');
    return router.push(`/${view.page}`);
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-6 py-12 text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">Ошибка</h1>
          <p>{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow">
        {loading ? (
          <JournalListSkeleton />
        ) : (
          <JournalListPage entries={entries} onNavigate={handleNavigate} />
        )}
      </main>
      <Footer />
    </>
  );
}
