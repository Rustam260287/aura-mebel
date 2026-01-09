import type { BrandIntegrityReport, BrandIntegrityIssue } from '../types';

/**
 * BrandIntegrityAgent: Ensures no legacy branding (Labelcom) remains.
 * Checks PWA manifest, Meta tags, and DOM elements.
 * 
 * NOTE: 
 * This agent performs RUNTIME checks only (DOM, Meta, Manifest).
 * Codebase / filesystem inspection must be handled at BUILD or CI level.
 */
export class BrandIntegrityAgent {
    static async analyze(): Promise<BrandIntegrityReport> {
        const issues: BrandIntegrityIssue[] = [];

        // 1. PWA Manifest Check
        try {
            const res = await fetch('/manifest.json', { cache: 'no-store' });
            if (!res.ok) throw new Error(`Manifest not reachable (Status: ${res.status})`);

            const manifest = await res.json();

            // Check Name
            if (manifest.name?.toLowerCase().includes('labelcom') || manifest.short_name?.toLowerCase().includes('labelcom')) {
                issues.push({
                    area: 'pwa',
                    severity: 'critical',
                    description: 'Manifest contains legacy brand name "Labelcom"',
                    file: '/manifest.json',
                    recommendation: 'Change "name" and "short_name" to "AURA"'
                });
            }

            // Check Theme Color (Critical if wrong)
            const auraColors = ['#F5F5F3', '#1A1A1A']; // Warm White or Dark
            if (!auraColors.includes(manifest.theme_color?.toUpperCase()) && !auraColors.includes(manifest.theme_color)) {
                issues.push({
                    area: 'pwa',
                    severity: 'warning',
                    description: `PWA theme_color ${manifest.theme_color} might not match AURA palette`,
                    file: '/manifest.json',
                    recommendation: 'Set theme_color to #F5F5F3 (Light) or #1A1A1A (Dark)'
                });
            }

            // Check Icons (Heuristic: checking filename)
            const oldIconNames = ['labelcom', 'logo-old'];
            const hasOldIcons = manifest.icons?.some((icon: any) =>
                oldIconNames.some(old => icon.src.includes(old))
            );
            if (hasOldIcons) {
                issues.push({
                    area: 'pwa',
                    severity: 'critical',
                    description: 'Manifest icons reference legacy filenames',
                    file: '/manifest.json',
                    recommendation: 'Rename icons to "aura-icon-*.png" and update manifest'
                });
            }

        } catch (e: any) {
            issues.push({
                area: 'pwa',
                severity: 'critical',
                description: `PWA manifest.json is missing or unreachable: ${e.message}`,
                file: '/manifest.json',
                recommendation: 'Ensure manifest.json exists and is publicly accessible'
            });
        }

        // 2. Meta Tags Check (DOM)
        if (typeof document !== 'undefined') {
            const title = document.title;
            if (title.toLowerCase().includes('labelcom')) {
                issues.push({
                    area: 'meta',
                    severity: 'critical',
                    description: 'Page title contains "Labelcom"',
                    recommendation: 'Update <title> tag in layout or head'
                });
            }

            const metaApp = document.querySelector('meta[name="application-name"]');
            if (metaApp && metaApp.getAttribute('content')?.toLowerCase().includes('labelcom')) {
                issues.push({
                    area: 'meta',
                    severity: 'critical',
                    description: 'Meta application-name contains "Labelcom"',
                    recommendation: 'Change application-name to "AURA"'
                });
            }

            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc && metaDesc.getAttribute('content')?.toLowerCase().includes('labelcom')) {
                issues.push({
                    area: 'meta',
                    severity: 'critical',
                    description: 'Meta description contains "Labelcom"',
                    recommendation: 'Rewrite description to focus on AURA brand'
                });
            }
        }

        // 3. Codebase/UI String Check (Runtime Heuristic - Optimized)
        if (typeof document !== 'undefined') {
            // Avoid scanning full body. Scan high-probability areas.
            const nodesToCheck = [
                document.querySelector('header'),
                document.querySelector('nav'),
                document.querySelector('h1'),
                document.querySelector('footer'),
                document.querySelector('[data-brand]') // Custom data attribute if present anywhere
            ];

            const foundInUI = nodesToCheck.some(node =>
                node && (node as HTMLElement).innerText && (node as HTMLElement).innerText.toLowerCase().includes('labelcom')
            );

            if (foundInUI) {
                issues.push({
                    area: 'ui',
                    severity: 'critical',
                    description: 'Visible UI text (Header/Footer/Heading) contains "Labelcom"',
                    recommendation: 'Search and replace "Labelcom" in UI components'
                });
            }
        }

        return {
            isClean: issues.length === 0,
            issues
        };
    }
}
