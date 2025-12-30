import React, { useEffect } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatWidget } from './ChatWidget';
import { ToastProvider } from '../contexts/ToastContext';
import { ExperienceProvider, useExperience, type ExperienceState } from '../contexts/ExperienceContext';
import { SavedProvider } from '../contexts/SavedContext';

jest.mock('../lib/journey/client', () => ({
  trackJourneyEvent: jest.fn(),
  pingVisitor: jest.fn(),
}));

const SetState: React.FC<{ state: ExperienceState }> = ({ state }) => {
  const { emitEvent } = useExperience();
  const ranRef = React.useRef(false);
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    emitEvent({ type: 'SET_STATE', state });
  }, [emitEvent, state]);
  return null;
};

const renderWithState = (state: ExperienceState) => {
  return render(
    <ToastProvider>
      <ExperienceProvider>
        <SavedProvider>
          <SetState state={state} />
          <ChatWidget />
        </SavedProvider>
      </ExperienceProvider>
    </ToastProvider>,
  );
};

describe('ChatWidget (assistant gating)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('does not render during AR_ACTIVE', () => {
    renderWithState('AR_ACTIVE');
    expect(screen.queryByText('Помощник')).toBeNull();
  });

  it('does not render during THREE_D_ACTIVE', () => {
    renderWithState('THREE_D_ACTIVE');
    expect(screen.queryByText('Помощник')).toBeNull();
  });

  it('renders only when ASSISTANT_OPEN', () => {
    renderWithState('ASSISTANT_OPEN');
    expect(screen.getByText('Помощник')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Задать вопрос…')).toBeInTheDocument();
  });

  it('pricing question triggers handoff and disables input', async () => {
    renderWithState('ASSISTANT_OPEN');
    const input = screen.getByPlaceholderText('Задать вопрос…') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Сколько стоит?' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText(/Я передал ваш вопрос менеджеру/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Задать вопрос…')).toBeDisabled();
  });
});
