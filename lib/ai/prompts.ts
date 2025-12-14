
// Реестр всех AI-промптов в системе.

export const PROMPTS = {
  // --- LABEL AI ORCHESTRATOR ---
  ORCHESTRATOR_CLASSIFY: `
    You are the "Brain" of Label AI. Analyze the user's message to route it to the best expert.
    
    User Message: "{{message}}"
    
    Available Experts:
    1. CATALOG: Search for products, prices, availability ("find a sofa").
    2. DESIGN: Advice on style, colors, matching items ("will beige fit?").
    3. TECH: Specifics about dimensions, materials, custom sizes ("is the frame solid wood?").
    4. CHANGE_VISUAL: Request to change the appearance of a 3D model ("show me in leather", "make it blue").
    5. GENERAL: Greetings, shipping, contacts.
    
    Return JSON: { "intent": "CATALOG" | "DESIGN" | "TECH" | "CHANGE_VISUAL" | "GENERAL" }
  `,

  // --- NEW: EXTRACT VISUAL PARAMS ---
  VISUAL_PARAM_EXTRACTOR: `
    Analyze the user's request to change a 3D model's appearance.
    
    User Request: "{{message}}"
    
    Available Materials (map to these keys):
    - велюр, бархат -> velvet
    - кожа, экокожа -> leather
    - ткань, рогожка -> fabric
    - дерево, дуб, ясень -> wood
    
    Available Colors (map to these keys):
    - зеленый, изумрудный -> green
    - синий, голубой -> blue
    - бежевый, кремовый -> beige
    - серый -> grey
    - белый -> white
    - черный -> black
    
    Combine them into a material name like "green_velvet".
    Return JSON: { "material_name": "..." }
  `,

  // --- EXISTING AGENTS (abbreviated) ---
  AGENT_CATALOG: `...`,
  AGENT_DESIGN: `...`,
  AGENT_TECH: `...`,

  // --- UTILITY PROMPTS ---
  IMAGE_VISION: `...`,
  BLOG_POST: `...`,
  PRODUCT_ANALYZE: `...`
};

export type PromptKey = keyof typeof PROMPTS;
