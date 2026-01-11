export interface BrandIntegrityIssue {
    area: 'pwa' | 'meta' | 'ui' | 'content';
    severity: 'critical' | 'warning';
    description: string;
    recommendation: string;
}

export class GuardianAgent {
    /**
     * Validates generated content before showing to user.
     * Enforces "Quiet UX" policy: No sales, no discounts, no noise.
     */
    static validateContent(content: string): { safe: boolean; corrected?: string; reason?: string } {
        // 1. Legacy Brand Check
        let corrected = content;
        const legacyTerms = ['labelcom', 'label.com'];
        legacyTerms.forEach(term => {
            const reg = new RegExp(term, 'gi');
            corrected = corrected.replace(reg, 'AURA');
        });

        // 2. Quiet UX Enforcement (No Sales Talk)
        const salesTriggers = [
            { term: 'скидк', replace: '' }, // remove sentences with "discount"
            { term: 'купит', replace: 'посмотреть' }, // buy -> view
            { term: 'заказ', replace: 'выбор' }, // order -> selection
            { term: 'цене', replace: '' }, // price -> remove
            { term: 'руб', replace: '' }, // currency -> remove
            { term: 'акци', replace: '' }, // promotion -> remove
            { term: 'доставк', replace: '' } // delivery -> remove
        ];

        let wasModified = false;

        // Simple heuristic: if sentence contains sales trigger, soften it
        // A robust version would use an LLM for rewriting, but this is a fast static guard.
        salesTriggers.forEach(trigger => {
            if (corrected.toLowerCase().includes(trigger.term)) {
                if (trigger.replace === '') {
                    // Try to remove the surrounding sentence/phrase roughly
                    // (This is aggressive regex, fine for MVP guardrail)
                    const sentenceReg = new RegExp(`[^.?!]*${trigger.term}[^.?!]*[.?!]`, 'gi');
                    corrected = corrected.replace(sentenceReg, '');
                    wasModified = true;
                } else {
                    const reg = new RegExp(trigger.term, 'gi');
                    corrected = corrected.replace(reg, trigger.replace);
                    wasModified = true;
                }
            }
        });

        // 3. Formatting cleanup
        corrected = corrected.replace(/\s+/g, ' ').trim();

        if (wasModified || corrected !== content) {
            return { safe: false, corrected, reason: 'Quiet UX enforcement applied' };
        }

        return { safe: true };
    }

    /**
     * Runtime audit (Client-side usage).
     */
    static async audit(): Promise<{ isClean: boolean; issues: BrandIntegrityIssue[] }> {
        const issues: BrandIntegrityIssue[] = [];
        if (typeof window === 'undefined') return { isClean: true, issues: [] };

        // 1. PWA Manifest
        try {
            const res = await fetch('/manifest.json');
            if (res.ok) {
                const manifest = await res.json();
                if (manifest.name?.toLowerCase().includes('labelcom')) {
                    issues.push({ area: 'pwa', severity: 'critical', description: 'Legacy Name in Manifest', recommendation: 'Rename to AURA' });
                }
            }
        } catch { }

        // 2. Title
        if (document.title.toLowerCase().includes('labelcom')) {
            issues.push({ area: 'meta', severity: 'critical', description: 'Legacy Title', recommendation: 'Update document.title' });
        }

        return { isClean: issues.length === 0, issues };
    }
}
