import React from 'react';
import { WizardProvider } from '../contexts/WizardContext';
import { WizardLayout } from '../components/wizard/WizardLayout';
import { Meta } from '../components/Meta';

const WizardPage: React.FC = () => {
    return (
        <>
            <Meta
                title="Мастер подбора — AURA"
                description="Спокойное исследование мебели для вашего пространства"
            />
            <WizardProvider objectType="sofa">
                <WizardLayout />
            </WizardProvider>
        </>
    );
};

export default WizardPage;
