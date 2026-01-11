# Implementation Plan - Aura Assistant State Machine

## User Review Required
> [!IMPORTANT]
> This refactor introduces a strict State Machine for the Assistant. The Assistant will no longer maintain its own message history or decision logic; it will purely render the `ActionPlan` provided by the `MetaAgent`.

## Proposed Changes

### 1. Type Definitions
**File:** `[NEW] lib/agents/meta/types.ts`
- Define `AssistantState` (Enum: IDLE, BROWSING, SELECTING, AR_PREPARING, AR_ACTIVE, SNAPSHOT_TAKEN, SHARING, POST_AR_REFLECTION).
- Define `ActionPlan` interface.
- Define `MetaEvent` types (`USER_SELECT_OBJECT`, `AR_STARTED`, etc.).

### 2. Meta Agent Logic (The "Brain")
**File:** `[NEW] lib/agents/meta/agent.ts`
- Implement `MetaAgent` class.
- **State**: Holds `currentSession`.
- **Method**: `processEvent(event: MetaEvent): ActionPlan`.
- **Logic**: Pure switch-case logic mapping Events + Current State -> New State + Action Plan.
  - *Example*: `AR_STARTED` -> state: `AR_ACTIVE`, assistant: { tone: 'silent' }.

### 3. Assistant Context (The "Binder")
**File:** `[NEW] contexts/AssistantContext.tsx`
- Holds the single source of truth: `ActionPlan`.
- Instantiates `MetaAgent`.
- Listens to app events (via `ExperienceContext` or direct calls) and feeds them to `MetaAgent`.
- Exposes `actionPlan` and `emitMetaEvent`.

### 4. Assistant Renderer (The "Face")
**File:** `[NEW] components/Assistant/AssistantRenderer.tsx`
- strictly functional component: `({ actionPlan }) => JSX`.
- Switch case on `actionPlan.session.state`.
- Renders `Toast`, `Chat`, or `null` (for AR).

### 5. Chat Component Refactor
**File:** `components/ChatWidget.tsx`
- Rename/Refactor to `components/Assistant/ChatBubble.tsx` (state-less).
- Remove internal message history state (passed via props from `ActionPlan` or Context).
- Remove internal API calls (delegated to Context/Agent).

### 6. Integration
**File:** `pages/_app.tsx` or `layout`
- Wrap app in `AssistantProvider`.
- Remove old `ChatWidget`.
- Add `AssistantRenderer`.

**File:** `contexts/ExperienceContext.tsx`
- Trigger `MetaAgent` events when appropriate (e.g., `ENTER_AR` -> `emitMetaEvent('AR_STARTED')`).

## Verification Plan

### Automated Tests
- **Unit Test `MetaAgent` logic**:
  - Test state transitions: `IDLE` + `USER_SELECT` -> `SELECTING`.
  - Test constraints: `AR_ACTIVE` -> Plan should have no text/chat.
  - Create `lib/agents/meta/agent.test.ts`.

### Manual Verification
1. **Browsing**: Open app -> Assistant is IDLE.
2. **Selection**: Click a furniture item -> Assistant enters SELECTING (shows CTA/Text).
3. **AR Flow**:
   - Click "View in Room" -> Assistant shows PREPARING text.
   - Camera opens -> Assistant becomes SILENT (hidden).
4. **Snapshot**:
   - Take snapshot -> Assistant stays hidden, shows Toast "Saved".
5. **Post-AR**:
   - Close AR -> Assistant enters POST_AR_REFLECTION ("How was it?").

### Browser Tool Verification
- I will use the browser tool to click through the flow (Select Object -> View in Room -> Exit) and verify the UI state at each step by checking DOM elements (presence of Chat, presence of Toast, absence during AR).
