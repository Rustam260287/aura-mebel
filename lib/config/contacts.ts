export interface ContactConfig {
    whatsappNumber: string; // Raw digits, e.g. 79990000000
    telegramUsername: string; // Without @, e.g. aura_support
    managerName?: string;
    managerRole?: string;
    email?: string;
}

// Default fallback config
export const DEFAULT_CONTACTS: ContactConfig = {
    whatsappNumber: '',
    telegramUsername: '',
    managerName: 'Куратор Aura',
    managerRole: 'Консультант по пространству',
};

// Start chat link generators
export const getWhatsAppLink = (phone: string): string => {
    const clean = phone.replace(/[^\d]/g, '');
    if (!clean) return '';
    return `https://wa.me/${clean}`;
};

export const getTelegramLink = (username: string): string => {
    const clean = username.replace('@', '').replace('https://t.me/', '').trim();
    if (!clean) return '';
    return `https://t.me/${clean}`;
};

export const getMaxLink = (phone: string): string => {
    const clean = phone.replace(/[^\d]/g, '');
    if (!clean) return '';
    return `https://max.ru/call?phone=${clean}`;
};

// Helper to determine active channels
export const getActiveChannels = (config?: ContactConfig) => {
    const effective = config || DEFAULT_CONTACTS;
    return {
        whatsapp: !!effective.whatsappNumber,
        telegram: !!effective.telegramUsername,
    };
};
