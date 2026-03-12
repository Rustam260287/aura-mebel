import React from 'react';

interface Props {
    children: React.ReactNode;
}

// This component is deprecated. Browser checks are now performed on click events before mounting logic.
// See ObjectDetail.tsx / SceneDetail.tsx and lib/browserUtils.ts
export const ArBrowserGuard: React.FC<Props> = ({ children }) => {
    return <>{children}</>;
};
