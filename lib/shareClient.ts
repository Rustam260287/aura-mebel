// Client-side share utilities
import type { CreateShareRequest, CreateShareResponse } from '../types/share';

/**
 * Create a share link for an object
 * Returns the share URL that can be sent to others
 */
export async function createShareLink(params: CreateShareRequest): Promise<string | null> {
    try {
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            console.error('Failed to create share:', await response.text());
            return null;
        }

        const data: CreateShareResponse = await response.json();
        return data.shareUrl;
    } catch (error) {
        console.error('Share creation error:', error);
        return null;
    }
}

/**
 * Share a link using Web Share API or fallback to clipboard
 */
export async function shareLink(url: string, text?: string): Promise<boolean> {
    // Try Web Share API first
    if (typeof navigator !== 'undefined' && navigator.share) {
        try {
            await navigator.share({
                text: text || 'Посмотри, как этот предмет смотрится в интерьере ✨',
                url,
            });
            return true;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                // User cancelled - not an error
                return false;
            }
            console.warn('Web Share failed, falling back to clipboard:', error);
        }
    }

    // Fallback: copy to clipboard
    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch (error) {
        console.error('Clipboard copy failed:', error);
        return false;
    }
}

/**
 * Combined: Create share link and open share dialog
 */
export async function createAndShare(params: CreateShareRequest): Promise<{ success: boolean; url?: string }> {
    const url = await createShareLink(params);
    if (!url) {
        return { success: false };
    }

    const shared = await shareLink(url);
    return { success: shared, url };
}
