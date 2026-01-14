// /share/[id] — Public share page (no auth required)
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';
import { getAdminDb } from '../../lib/firebaseAdmin';
import { toPublicObject } from '../../lib/publicObject';
import { COLLECTIONS } from '../../lib/db/collections';
import type { ShareRecord } from '../../types/share';
import type { ObjectPublic } from '../../types';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Meta } from '../../components/Meta';
import { trackJourneyEvent } from '../../lib/journey/client';

const ARViewer = dynamic(
    () => import('../../components/ARViewer').then((mod) => mod.ARViewer),
    { ssr: false }
);

interface SharePageProps {
    share: ShareRecord | null;
    object: ObjectPublic | null;
    error?: string;
}

export default function SharePage({ share, object, error }: SharePageProps) {
    const router = useRouter();
    const [showAR, setShowAR] = useState(false);
    const arViewerRef = useRef<{ activateAR: () => void } | null>(null);

    if (error || !share || !object) {
        return (
            <>
                <Meta title="Ссылка недоступна — AURA" />
                <Header />
                <main className="flex-grow flex items-center justify-center min-h-[60vh] px-6">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-6">🔗</div>
                        <h1 className="text-2xl font-serif italic text-soft-black mb-4">
                            {error === 'expired' ? 'Ссылка устарела' : 'Ссылка недоступна'}
                        </h1>
                        <p className="text-muted-gray mb-8">
                            {error === 'expired'
                                ? 'Эта ссылка больше не действует. Попросите отправителя создать новую.'
                                : 'Возможно, ссылка была удалена или введена неверно.'}
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-3 bg-soft-black text-white rounded-full font-medium hover:bg-brand-charcoal transition-colors"
                        >
                            На главную
                        </button>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const handleStartAR = () => {
        trackJourneyEvent({
            type: 'START_AR', // From share page
            objectId: object.id,
        });
        setShowAR(true);
        setTimeout(() => {
            arViewerRef.current?.activateAR();
        }, 100);
    };

    const handleCloseAR = () => {
        setShowAR(false);
    };

    const primaryImage = object.imageUrls?.[0];

    return (
        <>
            <Meta
                title={`${object.name} — AURA`}
                description="Посмотрите, как этот предмет смотрится в интерьере. Примерьте в AR."
                image={primaryImage}
            />
            <Header />
            <main className="flex-grow bg-warm-white">
                <div className="container mx-auto px-6 py-12 md:py-20">
                    <div className="max-w-4xl mx-auto">
                        {/* Soft intro */}
                        <div className="text-center mb-12">
                            <p className="text-sm text-muted-gray mb-2">Вам показали вариант</p>
                            <h1 className="text-3xl md:text-4xl font-serif italic text-soft-black">
                                {object.name}
                            </h1>
                        </div>

                        {/* Object Preview */}
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-beige/20 mb-8">
                            {primaryImage ? (
                                <img
                                    src={primaryImage}
                                    alt={object.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-6xl opacity-30">🛋️</div>
                                </div>
                            )}
                        </div>

                        {/* AR CTA */}
                        {object.has3D && (
                            <div className="text-center">
                                <button
                                    onClick={handleStartAR}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-soft-black text-white rounded-full font-medium text-lg hover:bg-brand-charcoal transition-all shadow-xl shadow-soft-black/10 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                                    </svg>
                                    Примерить у себя
                                </button>
                                <p className="text-sm text-muted-gray mt-4">
                                    Откройте AR и посмотрите, как это выглядит в вашем пространстве
                                </p>
                            </div>
                        )}

                        {/* Browse more */}
                        <div className="text-center mt-16 pt-8 border-t border-stone-beige/30">
                            <p className="text-sm text-muted-gray mb-4">Хотите посмотреть другие варианты?</p>
                            <button
                                onClick={() => router.push('/objects')}
                                className="text-soft-black font-medium hover:underline"
                            >
                                Открыть каталог →
                            </button>
                        </div>
                    </div>
                </div>

                {/* AR Viewer (hidden until activated) */}
                <ARViewer
                    ref={arViewerRef}
                    src={object.modelGlbUrl}
                    iosSrc={object.modelUsdzUrl}
                    alt={object.name}
                    poster={primaryImage}
                    objectId={object.id}
                    open={showAR}
                    onClose={handleCloseAR}
                />
            </main>
            <Footer />
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id } = context.params || {};

    if (!id || typeof id !== 'string') {
        return { props: { share: null, object: null, error: 'invalid' } };
    }

    const db = getAdminDb();
    if (!db) {
        return { props: { share: null, object: null, error: 'db' } };
    }

    try {
        // Get share record
        const shareDoc = await db.collection('shares').doc(id).get();
        if (!shareDoc.exists) {
            return { props: { share: null, object: null, error: 'not_found' } };
        }

        const share = shareDoc.data() as ShareRecord;

        // Check expiration
        if (share.expiresAt) {
            const expiresAt = new Date(share.expiresAt);
            if (expiresAt < new Date()) {
                return { props: { share: null, object: null, error: 'expired' } };
            }
        }

        // Get object data
        const objectDoc = await db.collection(COLLECTIONS.objects).doc(share.objectId).get();
        if (!objectDoc.exists) {
            return { props: { share: null, object: null, error: 'object_not_found' } };
        }

        const object = toPublicObject(objectDoc.data(), objectDoc.id);

        // Allow viewing even if object is draft (shared links bypass status)
        return {
            props: {
                share: JSON.parse(JSON.stringify(share)),
                object: JSON.parse(JSON.stringify(object)),
            },
        };
    } catch (error) {
        console.error('Share page error:', error);
        return { props: { share: null, object: null, error: 'server' } };
    }
};
