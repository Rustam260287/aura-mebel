import React, { memo, useEffect, useMemo, useState } from 'react';
import type { AdminView, JournalEntry, ObjectAdmin, View } from '../types';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminHeader } from './admin/AdminHeader';
import { AdminObjects } from './admin/AdminObjects';
import { ObjectEditModal } from './ObjectEditModal';
import { JournalEditModal } from './JournalEditModal';
import { AdminAssets } from './admin/AdminAssets';
import { AdminMedia } from './admin/AdminMedia';
import { AdminHandoff } from './admin/AdminHandoff';
import { AdminJourneyFunnel } from './admin/journey/AdminJourneyFunnel';
import { AdminActiveVisitors } from './admin/journey/AdminActiveVisitors';
import { AdminVisitorJourney } from './admin/journey/AdminVisitorJourney';
import { AdminObjectInterest } from './admin/journey/AdminObjectInterest';
import { AdminSavedInsights } from './admin/journey/AdminSavedInsights';
import { AdminHandoffContacts } from './admin/journey/AdminHandoffContacts';
import { AdminHandoffDetail } from './admin/journey/AdminHandoffDetail';
import { getAuth } from 'firebase/auth';

interface AdminPageProps {
  allObjects: ObjectAdmin[];
  journalEntries: JournalEntry[];
  onNavigate: (view: View) => void;
  onUpdateObject: (updatedObject: ObjectAdmin) => Promise<void>;
  onAddObject: (objectData: Omit<ObjectAdmin, 'id'>) => Promise<void>;
  onDeleteObject: (objectId: string) => Promise<void>;
  onBulkGenerateDescriptions: (ids: string[]) => Promise<void>;
  onUpdateJournalEntry: (updatedEntry: JournalEntry) => Promise<void>;
  onDeleteJournalEntry: (entryId: string) => Promise<void>;
}

const AdminPageComponent: React.FC<AdminPageProps> = ({ 
  allObjects,
  journalEntries,
  onNavigate,
  onUpdateObject,
  onAddObject,
  onDeleteObject,
  onBulkGenerateDescriptions,
  onUpdateJournalEntry,
  onDeleteJournalEntry,
}) => {
  const [adminView, setAdminView] = useState<AdminView>('objects');
  const [adminRole, setAdminRole] = useState<'owner' | 'manager' | null>(null);
  const [autoViewSet, setAutoViewSet] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [visitorJourneyBackView, setVisitorJourneyBackView] = useState<AdminView>('activeVisitors');
  const [editingObject, setEditingObject] = useState<ObjectAdmin | null>(null);
  const [editingJournalEntry, setEditingJournalEntry] = useState<JournalEntry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentJournalEntries, setCurrentJournalEntries] = useState(journalEntries);

  useEffect(() => {
    setCurrentJournalEntries(journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    let isActive = true;
    const loadRole = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as { role?: unknown };
        if (!isActive) return;
        setAdminRole(data.role === 'manager' || data.role === 'owner' ? data.role : 'owner');
      } catch {
        if (isActive) setAdminRole('owner');
      }
    };
    void loadRole();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (autoViewSet) return;
    if (!adminRole) return;
    setAdminView(adminRole === 'manager' ? 'handoffContacts' : 'journey');
    setAutoViewSet(true);
  }, [adminRole, autoViewSet]);

  useEffect(() => {
    if (adminRole !== 'manager') return;
    if (adminView === 'handoffContacts') return;
    setAdminView('handoffContacts');
  }, [adminRole, adminView]);

  const openVisitorJourney = (visitorId: string, backView: AdminView) => {
    setSelectedVisitorId(visitorId);
    setVisitorJourneyBackView(backView);
    setAdminView('visitorJourney');
    setIsSidebarOpen(false);
  };

  const openHandoffDetail = (visitorId: string) => {
    setSelectedVisitorId(visitorId);
    setAdminView('handoffDetail');
    setIsSidebarOpen(false);
  };

  const objectsWith3D = useMemo(
    () => allObjects.filter(o => Boolean(o.modelGlbUrl || o.modelUsdzUrl)),
    [allObjects],
  );
  const objectsWithout3D = useMemo(
    () => allObjects.filter(o => !o.modelGlbUrl && !o.modelUsdzUrl),
    [allObjects],
  );
  const objectsWithoutImages = useMemo(
    () => allObjects.filter(o => !o.imageUrls || o.imageUrls.length === 0),
    [allObjects],
  );

  const renderContent = () => {
    switch (adminView) {
      case 'journey':
        return <AdminJourneyFunnel />;
      case 'activeVisitors':
        return <AdminActiveVisitors onOpenVisitor={(id) => openVisitorJourney(id, 'activeVisitors')} />;
      case 'visitorJourney':
        if (!selectedVisitorId) return <div className="text-sm text-gray-500">Выберите посетителя.</div>;
        return (
          <AdminVisitorJourney
            visitorId={selectedVisitorId}
            onBack={() => setAdminView(visitorJourneyBackView)}
          />
        );
      case 'handoffDetail':
        if (!selectedVisitorId) return <div className="text-sm text-gray-500">Выберите hand-off.</div>;
        return <AdminHandoffDetail visitorId={selectedVisitorId} onBack={() => setAdminView('handoffContacts')} />;
      case 'objectInterest':
        return <AdminObjectInterest />;
      case 'savedInsights':
        return <AdminSavedInsights />;
      case 'handoffContacts':
        return (
          <AdminHandoffContacts
            onOpenVisitor={
              adminRole === 'owner' ? (id) => openVisitorJourney(id, 'handoffContacts') : (id) => openHandoffDetail(id)
            }
          />
        );
      case 'objects':
        return (
          <div className="space-y-8">
            <AdminDashboard
              objects={allObjects}
              onEditObject={setEditingObject}
              onAutoFixProblems={onBulkGenerateDescriptions}
            />
            <AdminObjects
              objects={allObjects}
              onEditObject={setEditingObject}
              onDeleteObject={onDeleteObject}
              onAddObject={() => setIsAddModalOpen(true)}
              onBulkGenerateDescriptions={onBulkGenerateDescriptions}
            />
          </div>
        );
      case 'assets':
        return (
          <AdminAssets
            objectsWith3D={objectsWith3D}
            objectsWithout3D={objectsWithout3D}
            onOpenObject={setEditingObject}
          />
        );
      case 'media':
        return (
          <AdminMedia
            objectsWithoutImages={objectsWithoutImages}
            journalEntries={currentJournalEntries}
            setJournalEntries={setCurrentJournalEntries}
            onOpenObject={setEditingObject}
            onEditJournalEntry={setEditingJournalEntry}
            onDeleteJournalEntry={onDeleteJournalEntry}
            onUpdateJournalEntry={onUpdateJournalEntry}
          />
        );
      case 'handoff':
        return <AdminHandoff />;
      default:
        return null;
    }
  };
  
  const handleSetView = (view: AdminView) => {
    setAdminView(view);
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminSidebar 
        activeView={adminView} 
        setView={handleSetView} 
        onNavigate={onNavigate}
        role={adminRole}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="md:pl-64 flex flex-col flex-1">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
      
      {isAddModalOpen && (
        <ObjectEditModal
          isOpen={isAddModalOpen}
          object={null}
          onClose={() => setIsAddModalOpen(false)}
          onSave={async (objectData) => {
            await onAddObject(objectData as Omit<ObjectAdmin, 'id'>);
            setIsAddModalOpen(false);
          }}
        />
      )}
      {editingObject && (
        <ObjectEditModal
          isOpen={!!editingObject}
          object={editingObject}
          onClose={() => setEditingObject(null)}
          onSave={async (updatedObject) => {
            await onUpdateObject(updatedObject as ObjectAdmin);
            setEditingObject(null);
          }}
        />
      )}
      {editingJournalEntry && (
        <JournalEditModal
          entry={editingJournalEntry}
          onClose={() => setEditingJournalEntry(null)}
          onSave={async (updatedEntry) => {
            await onUpdateJournalEntry(updatedEntry);
            setEditingJournalEntry(null);
          }}
        />
      )}
    </div>
  );
};

export const AdminPage = memo(AdminPageComponent);
