import React from 'react';
import { RedesignProvider } from '../contexts/RedesignContext';
import { RedesignLayout } from '../components/redesign/RedesignLayout';
import { Meta } from '../components/Meta';

const RedesignPage: React.FC = () => {
    return (
        <>
            <Meta
                title="AI Визуализация — AURA"
                description="Визуализируйте мебель в вашем интерьере с помощью AI"
            />
            <RedesignProvider>
                <RedesignLayout />
            </RedesignProvider>
        </>
    );
};

export default RedesignPage;
