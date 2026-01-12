import { getAdminDb } from '../firebaseAdmin';
import { CuratorProfile, DEFAULT_CURATOR_PROFILE } from '../../types/curator';

const COLLECTION = 'curators';

export const CuratorService = {
    /**
     * Get all curators (for Admin)
     */
    async getAllCurators(): Promise<CuratorProfile[]> {
        const db = getAdminDb();
        const snap = await db.collection(COLLECTION).get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CuratorProfile));
    },

    /**
     * Get the single "Best Match" active curator for the public API.
     * Logic: Online > Schedule (Current Time) > Offline (Highest Priority)
     */
    async getActiveCurator(): Promise<CuratorProfile | null> {
        const db = getAdminDb();
        // 1. Fetch all enabled curators
        const snap = await db.collection(COLLECTION).where('isEnabled', '==', true).get();
        if (snap.empty) return null;

        const curators = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CuratorProfile));

        // 2. Filter Tiers
        const online = curators.filter(c => c.status === 'online');
        if (online.length > 0) {
            // Return highest priority online
            return online.sort((a, b) => b.priority - a.priority)[0];
        }

        // 3. Check Schedule
        const now = new Date();
        const currentHour = now.getHours();
        // Simplified parsing: "10:00 - 19:00" -> start 10, end 19
        const scheduled = curators.filter(c => {
            if (c.status !== 'schedule' || !c.workingHours) return false;
            const [start, end] = c.workingHours.split('-').map(s => parseInt(s.trim().replace(':', ''), 10)); // e.g. "10:00" -> 1000
            // This is a naive check, improved parsing needed for real world, but okay for MVP
            // Let's assume HH:MM format
            const current = currentHour * 100 + now.getMinutes();
            // Need proper parsing helper
            return checkTimeRange(c.workingHours, current);
        });

        if (scheduled.length > 0) {
            return scheduled.sort((a, b) => b.priority - a.priority)[0];
        }

        // 4. Fallback to offline (highest priority)
        return curators.sort((a, b) => b.priority - a.priority)[0];
    },

    /**
     * Admin: Update or Create Curator
     */
    async saveCurator(data: Partial<CuratorProfile>): Promise<CuratorProfile> {
        const db = getAdminDb();
        const id = data.id || db.collection(COLLECTION).doc().id;

        // Ensure defaults
        const payload: CuratorProfile = {
            ...DEFAULT_CURATOR_PROFILE,
            ...data,
            id,
            updatedAt: new Date().toISOString()
        } as CuratorProfile;

        await db.collection(COLLECTION).doc(id).set(payload, { merge: true });
        return payload;
    },

    async deleteCurator(id: string): Promise<void> {
        const db = getAdminDb();
        await db.collection(COLLECTION).doc(id).delete();
    }
};

// Helper for time range "10:00 - 19:00"
function checkTimeRange(rangeStr: string, currentHHMM: number): boolean {
    try {
        const parts = rangeStr.split('-');
        if (parts.length !== 2) return false;

        const startStr = parts[0].replace(':', '').trim(); // "1000"
        const endStr = parts[1].replace(':', '').trim();   // "1900"

        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end)) return false;

        // Handle midnight crossover if needed (not for now)
        return currentHHMM >= start && currentHHMM < end;
    } catch (e) {
        return false;
    }
}
