'use client';

import { useState } from 'react';
import type { ColorVariant } from '@/types';

// Стандартная мебельная палитра (используется если colorVariants не заданы)
export const DEFAULT_FURNITURE_COLORS: ColorVariant[] = [
  { name: 'Белый',        hex: '#FFFFFF' },
  { name: 'Кремовый',     hex: '#F5F0E8' },
  { name: 'Бежевый',      hex: '#D4B896' },
  { name: 'Серо-бежевый', hex: '#B5A899' },
  { name: 'Светло-серый', hex: '#C8C8C8' },
  { name: 'Серый',        hex: '#888888' },
  { name: 'Тёмно-серый',  hex: '#444444' },
  { name: 'Чёрный',       hex: '#1A1A1A' },
  { name: 'Коричневый',   hex: '#7B4F2E' },
  { name: 'Тёмно-синий',  hex: '#1E3A5F' },
  { name: 'Оливковый',    hex: '#5C6B3A' },
  { name: 'Терракота',    hex: '#B5522A' },
];

interface ColorPickerProps {
  variants?: ColorVariant[];
  activeHex: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ variants, activeHex, onChange }: ColorPickerProps) {
  const colors = variants?.length ? variants : DEFAULT_FURNITURE_COLORS;
  const [showLabel, setShowLabel] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Название активного цвета */}
      <span className="text-xs text-white/70 font-medium tracking-wide">
        {showLabel ?? (colors.find(c => c.hex.toLowerCase() === activeHex.toLowerCase())?.name ?? 'Цвет')}
      </span>

      {/* Свотчи */}
      <div className="flex flex-wrap justify-center gap-2 max-w-[220px]">
        {colors.map((color) => {
          const isActive = color.hex.toLowerCase() === activeHex.toLowerCase();
          return (
            <button
              key={color.hex}
              title={color.name}
              onPointerEnter={() => setShowLabel(color.name)}
              onPointerLeave={() => setShowLabel(null)}
              onPointerDown={() => onChange(color.hex)}
              className="relative w-7 h-7 rounded-full border-2 transition-transform active:scale-90"
              style={{
                backgroundColor: color.hex,
                borderColor: isActive ? '#ffffff' : 'rgba(255,255,255,0.25)',
                boxShadow: isActive
                  ? '0 0 0 2px rgba(255,255,255,0.6)'
                  : '0 1px 3px rgba(0,0,0,0.4)',
                transform: isActive ? 'scale(1.2)' : undefined,
              }}
            >
              {/* Checkmark для активного */}
              {isActive && (
                <span
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ color: isLight(color.hex) ? '#333' : '#fff' }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Проверяем светлый ли цвет (для контрастного чекмарка)
function isLight(hex: string): boolean {
  const c = parseInt(hex.replace('#', ''), 16);
  const r = (c >> 16) & 0xff;
  const g = (c >> 8) & 0xff;
  const b = c & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}
