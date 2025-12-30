
// pages/admin.tsx
import { GetServerSideProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { ObjectAdmin, JournalEntry, ScenePresetAdmin } from '../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { AuthGuard } from '../components/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { getAuth } from 'firebase/auth';
import { toAdminObject } from '../lib/adminObject';
import { COLLECTIONS } from '../lib/db/collections';
import { toScenePresetAdmin } from '../lib/scenePreset';

const AdminPage = dynamic(() => import('../components/AdminPage').then(mod => mod.AdminPage), { ssr: false });

interface AdminContainerProps {
  initialObjects: ObjectAdmin[];
  initialScenes: ScenePresetAdmin[];
  initialJournalEntries: JournalEntry[];
}

function AdminContainer({ initialObjects, initialScenes, initialJournalEntries }: AdminContainerProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { addToast } = useToast();
  const [objects, setObjects] = useState<ObjectAdmin[]>(initialObjects);
  const [scenes, setScenes] = useState<ScenePresetAdmin[]>(initialScenes);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error("User not authenticated");
  };

  const handleNavigate = () => {
    router.push('/');
  };

  const handleUpdateObject = useCallback(async (updatedObject: ObjectAdmin) => {
    try {
      const token = await getAuthToken();
      const { modelGlbUrl, modelUsdzUrl, ...rest } = updatedObject as any;
      const payload: Partial<ObjectAdmin> = {
        ...rest,
        ...(modelGlbUrl ? { modelGlbUrl } : {}),
        ...(modelUsdzUrl ? { modelUsdzUrl } : {}),
      };
      console.info('[admin] update object payload', {
        id: updatedObject.id,
        modelGlbUrl: payload.modelGlbUrl,
        modelUsdzUrl: payload.modelUsdzUrl,
      });
      const res = await fetch(`/api/objects/${updatedObject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData?.error || 'Failed to update object');
      }
      
      const normalizedObject = toAdminObject(responseData, updatedObject.id);
      setObjects(prev => prev.map(o => o.id === normalizedObject.id ? normalizedObject : o));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Ошибка обновления объекта';
      throw new Error(message);
    }
  }, [addToast]);

  const handleAddObject = useCallback(async (objectData: Omit<ObjectAdmin, 'id'>) => {
    try {
      const token = await getAuthToken();
      const { modelGlbUrl, modelUsdzUrl, ...rest } = objectData as any;
      const payload: Partial<Omit<ObjectAdmin, 'id'>> = {
        ...rest,
        ...(modelGlbUrl ? { modelGlbUrl } : {}),
        ...(modelUsdzUrl ? { modelUsdzUrl } : {}),
      };
      console.info('[admin] add object payload', {
        modelGlbUrl: payload.modelGlbUrl,
        modelUsdzUrl: payload.modelUsdzUrl,
      });
      const res = await fetch('/api/objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const responseData = await res.json().catch(() => null);
        throw new Error(responseData?.error || 'Failed to add object');
      }
      
      const responseData = await res.json();
      const id = typeof responseData?.id === 'string' ? responseData.id : '';
      const normalizedObject = toAdminObject(responseData, id);
      setObjects(prev => [...prev, normalizedObject]);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Ошибка добавления объекта';
      throw new Error(message);
    }
  }, [addToast]);

  const handleDeleteObject = useCallback(async (objectId: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/objects/${objectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete object');
      
      setObjects(prev => prev.filter(p => p.id !== objectId));
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const handleAddScene = useCallback(
    async (sceneData: Omit<ScenePresetAdmin, 'id'>) => {
      try {
        const token = await getAuthToken();
        const res = await fetch('/api/admin/scenes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(sceneData),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to create scene');
        }
        const created = toScenePresetAdmin(data, typeof data?.id === 'string' ? data.id : '');
        setScenes((prev) => [created, ...prev]);
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Ошибка добавления сцены';
        throw new Error(message);
      }
    },
    [],
  );

  const handleUpdateScene = useCallback(
    async (updatedScene: ScenePresetAdmin) => {
      try {
        const token = await getAuthToken();
        const res = await fetch(`/api/admin/scenes/${updatedScene.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedScene),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to update scene');
        }
        const normalized = toScenePresetAdmin(data, updatedScene.id);
        setScenes((prev) => prev.map((s) => (s.id === normalized.id ? normalized : s)));
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Ошибка обновления сцены';
        throw new Error(message);
      }
    },
    [],
  );

  const handleDeleteScene = useCallback(async (sceneId: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/scenes/${sceneId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete scene');
      }
      setScenes((prev) => prev.filter((s) => s.id !== sceneId));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Ошибка удаления сцены';
      throw new Error(message);
    }
  }, []);

  const handleBulkGenerateDescriptions = useCallback(
    async (objectIds: string[]) => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/objects/bulk-generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ objectIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Bulk description error:', data);
        throw new Error(data?.error || 'Failed to bulk-generate descriptions');
      }
    },
    [],
  );

  const handleUpdateJournalEntry = useCallback(async (updatedEntry: JournalEntry) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/journal/${updatedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedEntry),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to update journal entry');
      }
      
      setJournalEntries(prev => {
        const idx = prev.findIndex(p => p.id === updatedEntry.id);
        if (idx === -1) return [updatedEntry, ...prev];
        const next = [...prev];
        next[idx] = updatedEntry;
        return next;
      });
    } catch (error) {
      console.error(error);
      addToast('Ошибка обновления записи', 'error');
    }
  }, [addToast]);

  const handleDeleteJournalEntry = useCallback(async (entryId: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/journal/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete journal entry');
      }
      
      setJournalEntries(prev => prev.filter(p => p.id !== entryId));
    } catch (error) {
      console.error(error);
      addToast('Ошибка удаления записи', 'error');
    }
  }, [addToast]);

  return (
    <>
      <div className="absolute top-4 right-4 z-20">
        <Button onClick={logout} variant="outline">Выйти</Button>
      </div>
      <AdminPage 
        allObjects={objects}
        allScenes={scenes}
        journalEntries={journalEntries}
        onNavigate={handleNavigate}
        onUpdateObject={handleUpdateObject}
        onAddObject={handleAddObject}
        onDeleteObject={handleDeleteObject}
        onAddScene={handleAddScene}
        onUpdateScene={handleUpdateScene}
        onDeleteScene={handleDeleteScene}
        onBulkGenerateDescriptions={handleBulkGenerateDescriptions}
        onUpdateJournalEntry={handleUpdateJournalEntry}
        onDeleteJournalEntry={handleDeleteJournalEntry}
      />
    </>
  );
}

export default function AdminPageContainer(props: AdminContainerProps) {
  return (
    <AuthGuard>
      <ToastProvider>
        <AdminContainer {...props} />
      </ToastProvider>
    </AuthGuard>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const dbAdmin = getAdminDb();
  if (!dbAdmin) {
    return { props: { initialObjects: [], initialScenes: [], initialJournalEntries: [], error: "Admin DB not initialized" } };
  }
  try {
    const objectsSnapshot = await dbAdmin.collection(COLLECTIONS.objects).orderBy('name').get();
    // IMPORTANT: some legacy imports contain an `id` field in document data (slug),
    // so ensure the Firestore document ID always wins for editing/saving.
    const initialObjects = objectsSnapshot.docs.map(doc => toAdminObject(doc.data(), doc.id)) as ObjectAdmin[];
    
    // ИСПРАВЛЕНИЕ: Убираем orderBy('date'), так как поле может отсутствовать
    const journalSnapshot = await dbAdmin.collection('blog').get();
    const allJournalEntries = journalSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as JournalEntry[];
    
    // Сортировка в памяти (по createdAt или id)
    const initialJournalEntries = allJournalEntries.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.id).getTime();
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.id).getTime();
        return dateB - dateA;
    });

    const scenesSnapshot = await dbAdmin.collection(COLLECTIONS.scenePresets).get();
    const initialScenes = scenesSnapshot.docs
      .map((doc) => toScenePresetAdmin(doc.data(), doc.id))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    return {
      props: { 
        initialObjects: JSON.parse(JSON.stringify(initialObjects)),
        initialScenes: JSON.parse(JSON.stringify(initialScenes)),
        initialJournalEntries: JSON.parse(JSON.stringify(initialJournalEntries)),
      },
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { props: { initialObjects: [], initialScenes: [], initialJournalEntries: [], error: errorMessage } };
  }
};
