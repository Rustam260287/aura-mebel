'use client';

import React from 'react';
import { MenuIcon } from './icons/index';

export const FloatingMenuButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="
        fixed top-4 right-4 z-menuButton pointer-events-auto
        w-11 h-11
        rounded-full
        bg-white/90 backdrop-blur
        shadow-soft
        flex items-center justify-center
        text-soft-black
        active:scale-95
      "
      aria-label="Menu"
      type="button"
    >
      <MenuIcon className="w-5 h-5" />
    </button>
  );
};
