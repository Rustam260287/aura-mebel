import React from 'react';
import { useAssistant } from '../../../contexts/AssistantContext';
import { getWhatsAppLink, getTelegramLink, getMaxLink } from '../../../lib/config/contacts';

export const CuratorCard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { curatorProfile } = useAssistant();
    // Cast to any or Partial to avoid "Property does not exist on type {}"
    const profile = curatorProfile || ({} as any);

    const handleContact = (type: 'whatsapp' | 'telegram' | 'max' | 'phone') => {
        let url = '';
        if (type === 'whatsapp' && profile.contacts?.whatsapp) {
            url = getWhatsAppLink(profile.contacts.whatsapp!);
        } else if (type === 'telegram' && profile.contacts?.telegram) {
            url = getTelegramLink(profile.contacts.telegram!);
        } else if (type === 'max' && profile.contacts?.max) {
            const maxVal = profile.contacts.max;
            url = maxVal.startsWith('http') ? maxVal : getMaxLink(maxVal);
        } else if (type === 'phone' && profile.contacts?.phone) {
            url = `tel:${profile.contacts.phone.replace(/[^\d+]/g, '')}`;
        }

        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const isOnline = profile.availabilityStatus === 'online';

    return (
        <div className="fixed bottom-24 right-4 md:right-8 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20 animate-fade-in-up z-[9995]">
            <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-brand-warmbeige text-brand-charcoal font-bold text-xl">
                                    {(profile.displayName || 'A')[0]}
                                </div>
                            )}
                        </div>

                    </div>
                    <div>
                        <h3 className="font-serif text-lg text-brand-charcoal leading-tight">
                            {profile.displayName || 'Куратор Aura'}
                        </h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
                            {profile.roleLabel || 'Персональный куратор'}
                        </p>
                        {profile.workingHours && (
                            <p className="text-[10px] text-gray-400 mt-1">
                                {profile.workingHours}
                            </p>
                        )}
                    </div>
                </div>

                {/* Body Message */}
                <div className="text-sm text-gray-600 mb-5 leading-relaxed bg-brand-lightbeige/30 p-3 rounded-lg border border-brand-warmbeige/20">
                    {'Если у вас возникли вопросы по размерам, материалам или доставке — напишите мне, я помогу.'}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    {profile.contacts?.whatsapp && (
                        <button
                            onClick={() => handleContact('whatsapp')}
                            className="w-full py-3 px-4 bg-green-50 hover:bg-green-100 text-green-800 rounded-xl flex items-center justify-between transition-colors border border-green-100"
                        >
                            <span className="font-medium">Написать в WhatsApp</span>
                            <span>→</span>
                        </button>
                    )}
                    {profile.contacts?.telegram && (
                        <button
                            onClick={() => handleContact('telegram')}
                            className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl flex items-center justify-between transition-colors border border-blue-100"
                        >
                            <span className="font-medium">Написать в Telegram</span>
                            <span>→</span>
                        </button>
                    )}
                    {profile.contacts?.max && (
                        <button
                            onClick={() => handleContact('max')}
                            className="w-full py-3 px-4 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl flex items-center justify-between transition-colors border border-purple-100"
                        >
                            <span className="font-medium">Написать в MAX</span>
                            <span>→</span>
                        </button>
                    )}

                </div>
            </div>

            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                ✕
            </button>
        </div>
    );
};
