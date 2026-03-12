import React from 'react';
import { useWizard } from '../../contexts/WizardContext';
import type { ObjectType } from '../../lib/antigravity/types';

const OPTIONS: Array<{ value: ObjectType; label: string; description: string }> = [
  { value: 'sofa', label: 'Диван', description: 'Для зоны отдыха и мягкого центра комнаты' },
  { value: 'armchair', label: 'Кресло', description: 'Для акцента и личного места' },
  { value: 'bed', label: 'Кровать', description: 'Для спальни и спокойной композиции' },
  { value: 'table', label: 'Стол', description: 'Для dining или рабочей поверхности' },
  { value: 'chair', label: 'Стул', description: 'Для посадки и лёгких акцентов' },
  { value: 'shelf', label: 'Стеллаж', description: 'Для хранения и вертикального ритма' },
];

export const StepObjectType: React.FC = () => {
  const { nextStep, selections, setSelection } = useWizard();

  const handleSelect = (value: ObjectType) => {
    setSelection('object_type', value);
    window.setTimeout(() => nextStep(), 220);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-medium text-soft-black">Что вы хотите примерить?</h2>
          <p className="text-sm text-muted-gray">Выберите тип мебели. Дальше мы уточним ощущение и характер.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={[
                'w-full rounded-2xl border p-5 text-left transition-all duration-300',
                'active:scale-[0.98] hover:border-soft-black/30',
                selections.object_type === option.value
                  ? 'border-soft-black/50 bg-soft-black/5'
                  : 'border-stone-beige/50 bg-white/50',
              ].join(' ')}
            >
              <div className="text-base font-medium text-soft-black">{option.label}</div>
              <div className="mt-1 text-sm text-muted-gray">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
