import React from 'react';

export const PeriodSelect: React.FC<{
  days: number;
  onChange: (nextDays: number) => void;
}> = ({ days, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">Период</span>
      <select
        value={days}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
      >
        <option value={7}>7 дней</option>
        <option value={30}>30 дней</option>
        <option value={90}>90 дней</option>
      </select>
    </div>
  );
};

