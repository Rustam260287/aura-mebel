import React, { useEffect, useState } from 'react';
import { getBrowserEnvironment, openInChromeAndroid, openInSafari } from '../lib/browserUtils';
import { trackJourneyEvent } from '../lib/journey/client';

interface Props {
    children: React.ReactNode;
    onClose?: () => void;
}

// This component is deprecated. Browser checks are now performed on click events before mounting logic.
// See ObjectDetail.tsx / SceneDetail.tsx and lib/browserUtils.ts
export const ArBrowserGuard: React.FC<Props> = ({ children }) => {
    return <>{children}</>;
};
