# 🏗️ Antigravity Agent Architecture

## Обзор

Antigravity — это агентная система для интеллектуального подбора мебели.
Каждый агент выполняет одну специфическую задачу и передаёт результат следующему.

## Структура

```
lib/antigravity/
├── types.ts              # Все типы данных
├── orchestrator.ts       # Координатор агентов
└── agents/
    ├── context.ts        # ContextAgent - анализ комнаты
    ├── intent.ts         # IntentAgent - понимание намерений
    ├── selector.ts       # FurnitureSelector - выбор мебели
    ├── fitter.ts         # ScaleAndFitAgent - масштабирование
    └── judge.ts          # VisualJudge - валидация
```

## Поток данных

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AGENT WORKFLOW                                   │
│                                                                         │
│  [Photo/Description]                                                    │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────┐                                                    │
│  │  ContextAgent   │ ──▶ Анализ комнаты (тип, освещение, зоны)         │
│  └─────────────────┘                                                    │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────┐                                                    │
│  │  IntentAgent    │ ──▶ Интерпретация намерений пользователя          │
│  └─────────────────┘                                                    │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────┐                                                    │
│  │ FurnitureSelect │ ──▶ Выбор мебели из каталога (Firestore)          │
│  └─────────────────┘                                                    │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────┐                                                    │
│  │ ScaleAndFitAgent│ ──▶ Расчёт масштаба (±10%)                        │
│  └─────────────────┘                                                    │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────┐                                                    │
│  │  VisualJudge    │ ──▶ Валидация (retry если score < 0.8)            │
│  └─────────────────┘                                                    │
│         │                                                               │
│         ▼                                                               │
│     [Result]                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Принципы проектирования

### 1. Single Responsibility (Единственная ответственность)

Каждый агент делает ОДНУ вещь хорошо:

```typescript
// ❌ Плохо: агент делает всё
class SuperAgent {
  analyzeRoom() {}
  interpretIntent() {}
  selectFurniture() {}
  calculateScale() {}
  validate() {}
}

// ✅ Хорошо: один агент = одна задача
class ContextAgent { analyze() {} }
class IntentAgent { interpret() {} }
class FurnitureSelector { select() {} }
class ScaleAndFitAgent { calculateScale() {} }
class VisualJudge { evaluate() {} }
```

### 2. Типизированные контракты

Каждый агент имеет чёткий Input и Output:

```typescript
// types.ts
interface RoomContext {
    imageUrl?: string;
    userDescription?: string;
}

interface RoomAnalysis {
    room_type: RoomType;
    lighting: LightingCondition;
    confidence: number;  // 0.0 - 1.0
}
```

### 3. Confidence Score

Каждый агент возвращает уверенность в результате:

```typescript
{
    result: ...,
    confidence: 0.85  // 85% уверенности
}
```

Это позволяет оркестратору:
- Делать retry при низкой уверенности
- Комбинировать результаты нескольких агентов
- Логировать качество работы системы

### 4. Retry Logic

Оркестратор может повторить шаг с упрощёнными параметрами:

```typescript
if (judgement.score < 0.8) {
    // Упрощаем параметры и пробуем снова
    const simplifiedInput = { ...input, presence: 'balanced' };
    const retryResult = await agent.process(simplifiedInput);
}
```

### 5. Чистые функции

Агенты не имеют побочных эффектов:

```typescript
// ❌ Плохо: побочные эффекты
class BadAgent {
    private cache = {};  // Изменяемое состояние
    
    process(input) {
        this.cache[input.id] = result;  // Мутация
        saveToDatabase(result);          // Побочный эффект
        return result;
    }
}

// ✅ Хорошо: чистая функция
class GoodAgent {
    static process(input): Output {
        // Только вычисления, без побочных эффектов
        return {
            result: compute(input),
            confidence: 0.9
        };
    }
}
```

## Создание нового агента

### Шаблон

```typescript
// agents/my-agent.ts
import type { MyInput, MyOutput } from '../types';

/**
 * MyAgent: Краткое описание задачи агента.
 * 
 * Ответственность:
 * - Пункт 1
 * - Пункт 2
 */
export class MyAgent {
    
    /**
     * Основной метод агента
     */
    static async process(input: MyInput): Promise<MyOutput> {
        // 1. Валидация входных данных
        if (!input.requiredField) {
            return this.getDefaultOutput();
        }
        
        // 2. Основная логика
        const result = await this.doWork(input);
        
        // 3. Возврат результата с confidence
        return {
            ...result,
            confidence: this.calculateConfidence(result)
        };
    }
    
    private static async doWork(input: MyInput) {
        // Реализация
    }
    
    private static calculateConfidence(result): number {
        // Вычисление уверенности
        return 0.9;
    }
    
    private static getDefaultOutput(): MyOutput {
        return {
            // Дефолтные значения
            confidence: 0.3
        };
    }
}
```

### Шаги создания

1. **Определить типы** в `types.ts`
2. **Создать файл агента** в `agents/`
3. **Импортировать в оркестратор**
4. **Добавить в workflow**
5. **Написать тесты**

## Примеры использования

### Базовый вызов

```typescript
import { runWizardIntent } from '@/lib/antigravity/orchestrator';

const result = await runWizardIntent({
    object_type: 'sofa',
    presence: 'balanced',
    mood: 'calm'
});
```

### С анализом комнаты

```typescript
import { runWizardWithContext } from '@/lib/antigravity/orchestrator';

const result = await runWizardWithContext(
    { object_type: 'sofa', presence: 'balanced', mood: 'calm' },
    { imageUrl: 'https://...', userDescription: 'Светлая гостиная' }
);

console.log(result.room_analysis.room_type);  // 'living_room'
console.log(result.room_analysis.confidence); // 0.85
```

## Тестирование

```typescript
// __tests__/agents/context.test.ts
import { ContextAgent } from '@/lib/antigravity/agents/context';

describe('ContextAgent', () => {
    it('should analyze room from description', async () => {
        const result = await ContextAgent.analyze({
            userDescription: 'Светлая гостиная с большими окнами'
        });
        
        expect(result.room_type).toBe('living_room');
        expect(result.lighting).toBe('natural');
        expect(result.confidence).toBeGreaterThan(0.5);
    });
});
```

## Расширение

### Добавление Vision API

В `ContextAgent` можно добавить реальный анализ изображений:

```typescript
private static async analyzeFromImage(input: RoomContext): Promise<RoomAnalysis> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const result = await model.generateContent([
        'Analyze this room image. Return JSON with room_type, lighting, dominant_colors.',
        { inlineData: { mimeType: 'image/jpeg', data: input.imageBase64! } }
    ]);
    
    return JSON.parse(result.response.text());
}
```
