/**
 * @fileoverview AlphGPT — client-side conversational assistant for the portfolio.
 *
 * No backend required. Keyword-matching engine with context memory.
 * Bilingual: detects English vs. Spanish from the visitor's message and
 * answers in the same language.
 */

export interface AlphGPTContext {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  localTime?: string;
  furnitureNames?: string[];
  luluNearby?: boolean;
  isMoving?: boolean;
}

type Lang = 'en' | 'es';

interface IntentEntry {
  keywords: string[];
  responses: Record<Lang, string[]>;
}

const KNOWLEDGE_BASE: Record<string, IntentEntry> = {
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'sup', 'yo', 'hola', 'buenas', 'buenos dias', 'buenas tardes', 'que tal'],
    responses: {
      en: [
        "Hey there! I'm AlphGPT, Alfredo's assistant. Ask me anything about him — skills, experience, projects, or how to get in touch. (También hablo español.)",
        "Hello! Welcome to Alfredo's interactive portfolio. What would you like to know?",
      ],
      es: [
        "¡Hola! Soy AlphGPT, el asistente de Alfredo. Pregúntame lo que quieras sobre él: habilidades, experiencia, proyectos o cómo contactarlo.",
        "¡Buenas! Bienvenido al portafolio interactivo de Alfredo. ¿Qué te gustaría saber?",
      ],
    },
  },
  who: {
    keywords: ['who', 'about', 'name', 'alfredo', 'alph0x', 'quien', 'sobre', 'nombre', 'acerca', 'background', 'llama', 'llamas', 'llamar', 'cuentame', 'cuenta', 'robot', 'edad', 'age'],
    responses: {
      en: [
        "I'm AlphGPT — Alfredo Pérez's virtual assistant. Alfredo is a Computer Engineer with 12+ years building iOS products, from fintech startups to Latin America's largest delivery platforms. He's currently iOS Lead & Software Architect at GeoPagos, expanding into React Native for cross-platform payment systems. He believes in clean architecture, clear contracts, and zero tolerance for tech debt.",
      ],
      es: [
        "Soy AlphGPT, el asistente virtual de Alfredo Pérez. Alfredo es Ingeniero en Computación con más de 12 años construyendo productos iOS, desde startups fintech hasta una de las plataformas de delivery más grandes de Latinoamérica. Actualmente es iOS Lead y Arquitecto de Software en GeoPagos, expandiéndose a React Native para sistemas de pago multiplataforma. Cree en la arquitectura limpia, los contratos claros y tolerancia cero a la deuda técnica.",
      ],
    },
  },
  skills: {
    keywords: ['skills', 'tech', 'stack', 'technologies', 'languages', 'swift', 'react native', 'ios', 'framework', 'habilidades', 'tecnologias', 'lenguajes', 'tecnologia', 'coding', 'programming', 'developer', 'code', 'codigo', 'programar'],
    responses: {
      en: [
        "Alfredo's core stack:\n\n• React Native — Expert (cross-platform payment systems)\n• Swift / iOS — Expert (12+ years)\n• SwiftUI — Advanced\n• Objective-C — Advanced\n• Clean Architecture, MVVM, VIPER — Expert\n• Redux, Combine — Advanced\n• REST APIs, GraphQL — Expert\n• Payments / Fintech — Advanced\n• CI/CD (GitHub Actions, Bitrise, Fastlane) — Advanced\n• TDD / BDD — Advanced\n• Vapor (Swift backend) — Mid",
      ],
      es: [
        "El stack principal de Alfredo:\n\n• React Native — Experto (sistemas de pago multiplataforma)\n• Swift / iOS — Experto (más de 12 años)\n• SwiftUI — Avanzado\n• Objective-C — Avanzado\n• Clean Architecture, MVVM, VIPER — Experto\n• Redux, Combine — Avanzado\n• REST APIs, GraphQL — Experto\n• Pagos / Fintech — Avanzado\n• CI/CD (GitHub Actions, Bitrise, Fastlane) — Avanzado\n• TDD / BDD — Avanzado\n• Vapor (backend en Swift) — Intermedio",
      ],
    },
  },
  experience: {
    keywords: ['experience', 'work', 'job', 'career', 'geo', 'company', 'employ', 'experiencia', 'trabajo', 'carrera', 'empresa', 'empleo', 'trayectoria', 'do', 'does', 'doing', 'hace', 'haces', 'hacer', 'geopagos'],
    responses: {
      en: [
        "Alfredo's current role:\n\n▸ Multiplatform Mobile Software Engineer at GeoPagos (Sep 2023 — Present)\n  Building the React Native engine behind GeoPagos' cross-platform acquiring and POS payment products.\n\nPreviously he worked across multiple iOS teams in fintech and delivery, shipping code that processes millions of transactions.",
      ],
      es: [
        "El rol actual de Alfredo:\n\n▸ Multiplatform Mobile Software Engineer en GeoPagos (sept. 2023 — actualidad)\n  Construyendo el motor React Native detrás de los productos de pago multiplataforma y POS de GeoPagos.\n\nAntes trabajó en varios equipos iOS de fintech y delivery, entregando código que procesa millones de transacciones.",
      ],
    },
  },
  projects: {
    keywords: ['projects', 'portfolio', 'this', 'game', '3d', 'room', 'build', 'proyectos', 'portafolio', 'cuarto', 'habitacion', 'juego'],
    responses: {
      en: [
        "This cozy 3D room you're exploring IS one of his projects — built with Three.js, custom shaders, and a seed-based room editor. He also works on production payment systems handling real transactions at GeoPagos. Clean architecture and testability are non-negotiable in everything he ships.",
      ],
      es: [
        "Este acogedor cuarto 3D que estás explorando ES uno de sus proyectos: construido con Three.js, shaders personalizados y un editor de habitaciones basado en seeds. También trabaja en sistemas de pago en producción que manejan transacciones reales en GeoPagos. La arquitectura limpia y la testabilidad no son negociables en nada de lo que entrega.",
      ],
    },
  },
  contact: {
    keywords: ['contact', 'email', 'reach', 'hire', 'phone', 'linkedin', 'message', 'contacto', 'correo', 'contratar', 'telefono', 'mensaje', 'mail', 'touch', 'get in touch', 'hiring', 'github', 'available', 'disponible'],
    responses: {
      en: [
        "You can reach Alfredo at:\n\n📧 alfredop88@me.com\n📱 +54 9 11 2348 7209\n📍 Buenos Aires, Argentina\n💼 Work mode: Remote · Full-time\n\nHe's currently open to senior engineering and architecture roles.",
      ],
      es: [
        "Puedes contactar a Alfredo:\n\n📧 alfredop88@me.com\n📱 +54 9 11 2348 7209\n📍 Buenos Aires, Argentina\n💼 Modalidad: Remoto · Tiempo completo\n\nActualmente está abierto a roles senior de ingeniería y arquitectura.",
      ],
    },
  },
  location: {
    keywords: ['location', 'where', 'city', 'country', 'based', 'from', 'ubicacion', 'donde', 'ciudad', 'pais', 'vive'],
    responses: {
      en: ["Alfredo is based in Buenos Aires, Argentina. He works remotely and collaborates with teams across Latin America."],
      es: ["Alfredo vive en Buenos Aires, Argentina. Trabaja de forma remota y colabora con equipos de toda Latinoamérica."],
    },
  },
  education: {
    keywords: ['education', 'degree', 'study', 'university', 'college', 'bsc', 'engineer', 'educacion', 'titulo', 'estudios', 'universidad', 'ingeniero', 'estudio'],
    responses: {
      en: ["Alfredo holds a BSc in Computer Engineering. His academic foundation plus 12+ years of shipping production code gives him a rare mix of theoretical depth and battle-tested pragmatism."],
      es: ["Alfredo es Ingeniero en Computación. Su base académica, sumada a más de 12 años entregando código en producción, le da una mezcla poco común de profundidad teórica y pragmatismo probado en batalla."],
    },
  },
  lulu: {
    keywords: ['lulu', 'dog', 'pet', 'schnauzer', 'puppy', 'animal', 'perro', 'perra', 'mascota', 'cachorro'],
    responses: {
      en: [
        "That's Lulú — Alfredo's miniature schnauzer, salt & pepper coat. She loves laying near the desk while he codes, and her tail wags faster when you get close. You can pet her virtually by walking near her in the room!",
      ],
      es: [
        "Esa es Lulú, la schnauzer miniatura de Alfredo, color sal y pimienta. Le encanta dormir cerca del escritorio mientras él programa, y su cola se mueve más rápido cuando te acercas. ¡Puedes acariciarla virtualmente caminando cerca de ella!",
      ],
    },
  },
  joke: {
    keywords: ['joke', 'fun', 'funny', 'laugh', 'humor', 'chiste', 'gracioso', 'broma', 'reir'],
    responses: {
      en: [
        "Why do programmers prefer dark mode? Because light attracts bugs. 🪲",
        "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
        "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads.",
      ],
      es: [
        "¿Por qué los programadores confunden Halloween con Navidad? Porque OCT 31 == DEC 25.",
        "Una query SQL entra a un bar, se acerca a dos tablas y pregunta: '¿Puedo unirme?'",
        "Le dije a mi computadora que necesitaba un descanso. Ahora no para de mandarme anuncios de Kit-Kat.",
      ],
    },
  },
  help: {
    keywords: ['help', 'what can', 'topics', 'question', 'ask', 'ayuda', 'temas', 'preguntar', 'opciones', 'sabes', 'saber', 'puedes', 'hacer', 'haces'],
    responses: {
      en: [
        "Here are some things you can ask me:\n\n• who are you / tell me about Alfredo\n• skills / tech stack\n• experience / work history\n• projects / portfolio\n• contact / email / hire\n• location / where is he\n• education / degree\n• lulu / dog\n• time / what time is it\n• room / what is in this room\n• joke / funny\n• ask naturally: 'what do you do?', 'hablas español?', 'i want to hire him'",
      ],
      es: [
        "Estas son algunas cosas que puedes preguntarme:\n\n• quién eres / cuéntame de Alfredo\n• habilidades / stack técnico\n• experiencia / trayectoria\n• proyectos / portafolio\n• contacto / correo / contratar\n• ubicación / dónde vive\n• educación / título\n• lulú / perro\n• hora / qué hora es\n• cuarto / qué hay aquí\n• chiste / algo gracioso\n• pregunta natural: '¿qué sabes hacer?', 'do you speak spanish?', 'estas disponible para trabajar?'",
      ],
    },
  },
  language: {
    keywords: ['hablas', 'habla', 'hablar', 'espanol', 'spanish', 'speak', 'idioma'],
    responses: {
      en: [
        "Yes! I speak English and Spanish. Ask me anything about Alfredo — skills, experience, projects, or how to reach him.",
      ],
      es: [
        "¡Sí! Hablo español e inglés. Pregúntame lo que quieras sobre Alfredo: habilidades, experiencia, proyectos o cómo contactarlo.",
      ],
    },
  },
  time: {
    keywords: ['time', 'hour', 'clock', 'morning', 'afternoon', 'evening', 'night', 'hora', 'reloj', 'tarde', 'noche', 'mañana'],
    responses: { en: ['STATE_TIME'], es: ['STATE_TIME'] },
  },
  room: {
    keywords: ['room', 'furniture', 'what is here', 'what is in', 'objects', 'items', 'cuarto', 'muebles', 'objetos', 'hay', 'contiene'],
    responses: { en: ['STATE_ROOM'], es: ['STATE_ROOM'] },
  },
  moving: {
    keywords: ['moving', 'walking', 'running', 'speed', 'go', 'caminando', 'corriendo', 'mover', 'moviendo', 'velocidad'],
    responses: { en: ['STATE_MOVING'], es: ['STATE_MOVING'] },
  },
};

const FALLBACK_RESPONSES: Record<Lang, string[]> = {
  en: [
    "I didn't quite catch that. Try asking: 'What are his skills?', 'How is his experience?', or 'How can I contact him?'.",
    "Not sure I got that. You can ask me naturally, like 'what do you do?', 'tell me about his experience', or 'do you have a github?'.",
    "Hmm, that's outside my training. I know a lot about Alfredo though — try 'what's his tech stack?', 'where is he based?', or 'hablas español?'.",
  ],
  es: [
    "No entendí bien. Prueba preguntar: '¿qué habilidades tiene?', '¿cuál es su experiencia?' o '¿cómo lo contacto?'.",
    "No estoy seguro de haber entendido. Puedes preguntarme natural, por ejemplo '¿qué sabes hacer?', '¿en qué trabajas?' o '¿hablas español?'.",
    "Mmm, eso está fuera de mi entrenamiento. Sé mucho de Alfredo — prueba '¿qué tecnologías usa?', '¿dónde vive?' o 'do you have a github?'.",
  ],
};

// Spanish surface markers: accented characters, inverted punctuation, and
// high-signal Spanish tokens. English is the default when nothing matches.
const ES_CHARS = /[áéíóúñü¿¡]/i;
const ES_WORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'que', 'quien', 'quienes', 'cual', 'como', 'donde',
  'cuando', 'porque', 'por', 'para', 'con', 'sin', 'sobre', 'hola', 'buenas', 'gracias',
  'trabajo', 'experiencia', 'habilidades', 'contacto', 'correo', 'perro', 'perra', 'mascota',
  'cuarto', 'habitacion', 'chiste', 'ayuda', 'hora', 'donde', 'vive', 'hablas', 'espanol',
  'cuentame', 'dime', 'puedes', 'quiero', 'saber', 'tiene', 'tiene', 'es', 'su', 'sus',
  'te', 'tu', 'tus', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'no', 'si',
  'ya', 'esto', 'eso', 'algo', 'nada', 'tambien', 'tienes', 'eres', 'estas', 'sabes', 'haces',
  'hace', 'hacer', 'llama', 'llamas', 'soy', 'cuanto', 'tengo', 'estoy', 'puedo', 'favor',
  'disponible',
]);

/**
 * Light inflection stemmer. Only words of length >= 5 are touched so short
 * tokens (`yo`, `hi`, `is`, `que`, `es`) never shrink and keep their coverage.
 * Applied to query tokens AND precomputed over keywords/word sets at load time,
 * so both sides always use identical normalization.
 */
function stem(word: string): string {
  if (word.length < 5) return word;
  return word
    .replace(/ando$|iendo$/, '')
    .replace(/ing$/, '')
    .replace(/(me|te|se|le|nos)$/, '')
    .replace(/(ar|er|ir)$/, '')
    .replace(/(es|as|os|is)$/, '')
    .replace(/[aeo]$/, '')
    .replace(/s$/, '');
}

const ES_STEMS = new Set([...ES_WORDS].map(stem));
const KEYWORD_STEMS: Record<string, string[]> = Object.fromEntries(
  Object.entries(KNOWLEDGE_BASE).map(([intent, entry]) => [
    intent,
    entry.keywords.map((kw) => kw.split(/\s+/).map(stem).join(' ')),
  ])
);
const KEYWORD_WEIGHTS: Record<string, number> = {
  hire: 5, hiring: 5, contratar: 5, disponible: 5, available: 5,
};
const KEYWORD_WEIGHT_STEMS: Record<string, number> = Object.fromEntries(
  Object.entries(KEYWORD_WEIGHTS).map(([kw, w]) => [kw.split(/\s+/).map(stem).join(' '), w])
);

export function detectLanguage(userText: string): Lang {
  if (ES_CHARS.test(userText)) return 'es';
  const tokens = tokenize(userText);
  let esHits = 0;
  for (const t of tokens) if (ES_STEMS.has(t)) esHits++;
  // Short messages need a single Spanish signal; longer ones a clear majority.
  return esHits >= 2 || (esHits >= 1 && tokens.length <= 3) ? 'es' : 'en';
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map(stem);
}

const GENERIC_WORDS: Record<string, true> = {
  who: true, is: true, are: true, about: true, me: true, your: true, the: true, a: true, an: true,
  my: true, i: true, you: true, he: true, she: true, it: true, this: true, that: true,
  what: true, how: true, where: true, when: true, why: true, can: true, do: true, does: true,
  did: true, have: true, has: true, had: true, be: true, been: true, being: true, am: true,
  was: true, were: true, will: true, would: true, could: true, should: true, may: true, might: true,
  // Spanish generics — same low weight so 'quien' alone doesn't hijack a query.
  quien: true, es: true, sobre: true, que: true, como: true, donde: true, hay: true,
  su: true, sus: true, el: true, la: true, de: true, del: true, por: true, para: true,
};

const GENERIC_STEMS = new Set([...Object.keys(GENERIC_WORDS)].map(stem));

function scoreIntent(tokens: string[], keywords: string[]): { score: number; matches: number } {
  let score = 0;
  let matches = 0;
  for (const kw of keywords) {
    const kwTokens = kw.split(/\s+/);
    let matched = false;
    if (kwTokens.length > 1) {
      // Contiguous token-sequence match — a phrase must span whole tokens,
      // so 'what is in' never matches "what is interesting" ('in' prefix).
      for (let i = 0; i + kwTokens.length <= tokens.length; i++) {
        let ok = true;
        for (let j = 0; j < kwTokens.length; j++) {
          if (tokens[i + j] !== kwTokens[j]) {
            ok = false;
            break;
          }
        }
        if (ok) {
          score += kwTokens.length * 2;
          matched = true;
          break;
        }
      }
    } else if (tokens.includes(kw)) {
      score += KEYWORD_WEIGHT_STEMS[kw] ?? (GENERIC_STEMS.has(kw) ? 1 : 3);
      matched = true;
    }
    if (matched) matches++;
  }
  return { score, matches };
}

function pickResponse(intent: string, lang: Lang): string {
  const entry = KNOWLEDGE_BASE[intent];
  if (!entry) return pickFallback(lang);
  const pool = entry.responses[lang] ?? entry.responses.en;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

function pickFallback(lang: Lang): string {
  const pool = FALLBACK_RESPONSES[lang];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export function askAlphGPT(
  userText: string,
  lastIntent: string | null = null,
  context: AlphGPTContext | null = null
): { text: string; intent: string | null } {
  const lang = detectLanguage(userText);
  const tokens = tokenize(userText);
  if (tokens.length === 0) return { text: pickFallback(lang), intent: null };

  let bestIntent: string | null = null;
  let bestScore = 0;
  let bestMatches = 0;

  for (const intent of Object.keys(KNOWLEDGE_BASE)) {
    const { score, matches } = scoreIntent(tokens, KEYWORD_STEMS[intent]);
    if (score > bestScore || (score === bestScore && matches > bestMatches)) {
      bestScore = score;
      bestMatches = matches;
      bestIntent = intent;
    }
  }

  // Context follow-up: if current query is vague but we have context
  if (bestScore === 0 && lastIntent && tokens.length <= 3) {
    bestIntent = lastIntent;
    bestScore = 1;
  }

  if (bestScore === 0 || !bestIntent) {
    return { text: pickFallback(lang), intent: null };
  }

  if (context) {
    const dynamic = buildStateResponse(bestIntent, context, lang);
    if (dynamic) return { text: dynamic, intent: bestIntent };
  }

  return { text: pickResponse(bestIntent, lang), intent: bestIntent };
}

function buildStateResponse(intent: string, context: AlphGPTContext, lang: Lang): string | null {
  switch (intent) {
    case 'time': {
      const tod = context.timeOfDay ?? 'now';
      const localTime = context.localTime ?? '';
      const phrases: Record<Lang, Record<string, string>> = {
        en: {
          morning: 'early morning — Alfredo is probably on his first coffee.',
          afternoon: 'afternoon — peak focus hours.',
          evening: 'evening — winding down with a side project.',
          night: 'night — either deep work or dodging low-priority Slack messages.',
        },
        es: {
          morning: 'temprano en la mañana — Alfredo probablemente está en su primer café.',
          afternoon: 'por la tarde — horas pico de concentración.',
          evening: 'por la noche — relajándose con un proyecto personal.',
          night: 'de noche — trabajo profundo o esquivando mensajes de Slack de baja prioridad.',
        },
      };
      const label: Record<Lang, Record<string, string>> = {
        en: { morning: 'morning', afternoon: 'afternoon', evening: 'evening', night: 'night', now: 'now' },
        es: { morning: 'mañana', afternoon: 'tarde', evening: 'atardecer', night: 'noche', now: 'ahora' },
      };
      if (lang === 'es') {
        return `Son las ${localTime} (${label.es[tod] ?? tod}). ${phrases.es[tod] ?? 'Buen momento para explorar.'}`;
      }
      return `It's ${localTime} (${tod}). ${phrases.en[tod] ?? 'Good time to explore.'}`;
    }
    case 'room': {
      const names = context.furnitureNames ?? [];
      if (names.length === 0) {
        return lang === 'es' ? 'El cuarto está vacío ahora mismo.' : 'The room is empty right now.';
      }
      const list = [...new Set(names)].join(', ');
      return lang === 'es' ? `Este cuarto contiene: ${list}.` : `This room contains: ${list}.`;
    }
    case 'lulu': {
      if (context.luluNearby) {
        return lang === 'es'
          ? '¡Lulú está justo aquí! Dale un poco de cariño: es la ingeniera de QA no oficial.'
          : "Lulú is right here! Give her some attention — she's the unofficial QA engineer.";
      }
      return lang === 'es'
        ? 'Lulú está cerca, probablemente durmiendo donde hace calorcito.'
        : "Lulú is nearby, probably napping where it's warm.";
    }
    case 'moving': {
      if (lang === 'es') {
        return context.isMoving
          ? 'Te estás moviendo por el cuarto. ¡Cuidado con la esquina del escritorio!'
          : 'Quieto. Ideal para inspeccionar los detalles.';
      }
      return context.isMoving
        ? "You're moving through the room. Watch the desk corner!"
        : "Standing still. Good for inspecting the details.";
    }
  }
  return null;
}

export type TerminalCommandType = 'response' | 'clear' | 'exit';

let terminalMode = false;
const terminalHistory: string[] = [];
let terminalCursorVisible = true;
let cursorInterval: number | null = null;

export function isTerminalMode(): boolean {
  return terminalMode;
}

export function enterTerminalMode(): void {
  terminalMode = true;
  terminalCursorVisible = true;
  if (cursorInterval !== null) {
    clearInterval(cursorInterval);
  }
  cursorInterval = window.setInterval(() => {
    terminalCursorVisible = !terminalCursorVisible;
  }, 530);
}

export function exitTerminalMode(): void {
  terminalMode = false;
  terminalCursorVisible = true;
  if (cursorInterval !== null) {
    clearInterval(cursorInterval);
    cursorInterval = null;
  }
}

export function isTerminalCursorVisible(): boolean {
  return terminalCursorVisible;
}

export function pushTerminalCommand(command: string): void {
  terminalHistory.push(command);
}

export function getTerminalCommands(): readonly string[] {
  return terminalHistory;
}

export function processTerminalCommand(
  input: string,
  lastIntent: string | null = null,
  context: AlphGPTContext | null = null
): { type: TerminalCommandType; text: string; intent: string | null } {
  const text = input.trim();
  pushTerminalCommand(text);
  const lower = text.toLowerCase();
  if (lower === 'help' || lower === 'ayuda') {
    return {
      type: 'response',
      text: 'Available terminal commands / Comandos disponibles:\n  help / ayuda — show this message\n  clear / limpiar — clear the screen\n  exit / salir — close terminal\nOr ask about Alfredo, the room, or the time.\nO pregunta por Alfredo, el cuarto o la hora.',
      intent: 'help',
    };
  }
  if (lower === 'clear' || lower === 'limpiar') {
    return { type: 'clear', text: '', intent: null };
  }
  if (lower === 'exit' || lower === 'salir') {
    return { type: 'exit', text: '', intent: null };
  }
  const result = askAlphGPT(text, lastIntent, context);
  return { type: 'response', text: result.text, intent: result.intent };
}
