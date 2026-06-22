/**
 * @fileoverview AlphGPT — client-side conversational assistant for the portfolio.
 *
 * No backend required. Keyword-matching engine with context memory.
 * Designed to feel like a retro terminal AI.
 */

interface IntentEntry {
  keywords: string[];
  responses: string[];
}

const KNOWLEDGE_BASE: Record<string, IntentEntry> = {
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'hola', 'sup', 'yo'],
    responses: [
      "Hey there! I'm AlphGPT, Alfredo's digital assistant. Ask me anything about him — skills, experience, projects, or how to get in touch.",
      "Hello! Welcome to Alfredo's interactive portfolio. What would you like to know?",
    ],
  },
  who: {
    keywords: ['who', 'about', 'name', 'alfredo', 'alph0x'],
    responses: [
      "I'm AlphGPT — Alfredo Pérez's virtual assistant. Alfredo is a BSc Computer Engineer with 12+ years building iOS products, from fintech startups to Latin America's largest delivery platforms. He's currently iOS Lead & Software Architect at GeoPagos, expanding into React Native for cross-platform payment systems. He believes in clean architecture, clear contracts, and zero tolerance for tech debt.",
    ],
  },
  skills: {
    keywords: ['skills', 'tech', 'stack', 'technologies', 'languages', 'swift', 'react native', 'ios', 'framework'],
    responses: [
      "Alfredo's core stack:\n\n• React Native — Expert (cross-platform payment systems)\n• Swift / iOS — Expert (12+ years)\n• SwiftUI — Advanced\n• Objective-C — Advanced\n• Clean Architecture, MVVM, VIPER — Expert\n• Redux, Combine — Advanced\n• REST APIs, GraphQL — Expert\n• Payments / Fintech — Advanced\n• CI/CD (GitHub Actions, Bitrise, Fastlane) — Advanced\n• TDD / BDD — Advanced\n• Vapor (Swift backend) — Mid",
    ],
  },
  experience: {
    keywords: ['experience', 'work', 'job', 'career', 'geo', 'company', 'employ'],
    responses: [
      "Alfredo's current role:\n\n▸ Multiplatform Mobile Software Engineer at GeoPagos (Sep 2023 — Present)\n  Building the React Native engine behind GeoPagos' cross-platform acquiring and POS payment products.\n\nPreviously he worked across multiple iOS teams in fintech and delivery, shipping code that processes millions of transactions.",
    ],
  },
  projects: {
    keywords: ['projects', 'portfolio', 'this', 'game', '3d', 'room', 'build'],
    responses: [
      "This interactive 3D room you're exploring IS one of his projects — built with Three.js, custom shaders, and a seed-based room editor. He also works on production payment systems handling real transactions at GeoPagos. Clean architecture and testability are non-negotiable in everything he ships.",
    ],
  },
  contact: {
    keywords: ['contact', 'email', 'reach', 'hire', 'phone', 'linkedin', 'message'],
    responses: [
      "You can reach Alfredo at:\n\n📧 alfredop88@me.com\n📱 +54 9 11 2348 7209\n📍 Buenos Aires, Argentina\n💼 Work mode: Remote · Full-time\n\nHe's currently open to senior engineering and architecture roles.",
    ],
  },
  location: {
    keywords: ['location', 'where', 'city', 'country', 'based', 'from'],
    responses: ["Alfredo is based in Buenos Aires, Argentina. He works remotely and collaborates with teams across Latin America."],
  },
  education: {
    keywords: ['education', 'degree', 'study', 'university', 'college', 'bsc', 'engineer'],
    responses: ["Alfredo holds a BSc in Computer Engineering. His academic foundation plus 12+ years of shipping production code gives him a rare mix of theoretical depth and battle-tested pragmatism."],
  },
  lulu: {
    keywords: ['lulu', 'dog', 'pet', 'schnauzer', 'puppy', 'animal'],
    responses: [
      "That's Lulú — Alfredo's miniature schnauzer, salt & pepper coat. She loves laying near the desk while he codes, and her tail wags faster when you get close. You can pet her virtually by walking near her in the room!",
    ],
  },
  joke: {
    keywords: ['joke', 'fun', 'funny', 'laugh', 'humor'],
    responses: [
      "Why do programmers prefer dark mode? Because light attracts bugs. 🪲",
      "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
      "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads.",
    ],
  },
  help: {
    keywords: ['help', 'what can', 'topics', 'question', 'ask'],
    responses: [
      "Here are some things you can ask me:\n\n• who are you / tell me about Alfredo\n• skills / tech stack\n• experience / work history\n• projects / portfolio\n• contact / email / hire\n• location / where is he\n• education / degree\n• lulu / dog\n• joke / funny",
    ],
  },
};

const FALLBACK_RESPONSES: string[] = [
  "I'm not sure I understood that. Try asking about Alfredo's skills, experience, projects, or how to contact him.",
  "Hmm, my neural nets are still training on that topic. Ask me about his tech stack, work history, or say 'help' for options.",
  "That's beyond my current dataset. I know a lot about Alfredo's engineering career though — want to hear about it?",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

const GENERIC_WORDS: Record<string, true> = {
  who: true, is: true, are: true, about: true, me: true, your: true, the: true, a: true, an: true,
  my: true, i: true, you: true, he: true, she: true, it: true, this: true, that: true,
  what: true, how: true, where: true, when: true, why: true, can: true, do: true, does: true,
  did: true, have: true, has: true, had: true, be: true, been: true, being: true, am: true,
  was: true, were: true, will: true, would: true, could: true, should: true, may: true, might: true,
};

function scoreIntent(tokens: string[], keywords: string[]): { score: number; matches: number } {
  const text = tokens.join('');
  let score = 0;
  let matches = 0;
  for (const kw of keywords) {
    const kwTokens = kw.split(/\s+/);
    let matched = false;
    if (kwTokens.length > 1) {
      const kwJoined = kw.replace(/\s+/g, '');
      if (text.includes(kwJoined) || text.includes(kw)) {
        score += kwTokens.length * 2;
        matched = true;
      }
    } else if (tokens.includes(kw)) {
      score += GENERIC_WORDS[kw] ? 1 : 3;
      matched = true;
    }
    if (matched) matches++;
  }
  return { score, matches };
}

function pickResponse(intent: string): string {
  const entry = KNOWLEDGE_BASE[intent];
  if (!entry) return pickFallback();
  const idx = Math.floor(Math.random() * entry.responses.length);
  return entry.responses[idx];
}

function pickFallback(): string {
  const idx = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
  return FALLBACK_RESPONSES[idx];
}

export function askAlphGPT(
  userText: string,
  lastIntent: string | null = null
): { text: string; intent: string | null } {
  const tokens = tokenize(userText);
  if (tokens.length === 0) return { text: pickFallback(), intent: null };

  let bestIntent: string | null = null;
  let bestScore = 0;
  let bestMatches = 0;

  for (const [intent, data] of Object.entries(KNOWLEDGE_BASE)) {
    const { score, matches } = scoreIntent(tokens, data.keywords);
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
    return { text: pickFallback(), intent: null };
  }

  return { text: pickResponse(bestIntent), intent: bestIntent };
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
  lastIntent: string | null = null
): { type: TerminalCommandType; text: string; intent: string | null } {
  const text = input.trim();
  pushTerminalCommand(text);
  const lower = text.toLowerCase();
  if (lower === 'help') {
    return {
      type: 'response',
      text: 'Available terminal commands:\n  help  — show this message\n  clear — clear the screen\n  exit  — close terminal\nOr ask about Alfredo.',
      intent: 'help',
    };
  }
  if (lower === 'clear') {
    return { type: 'clear', text: '', intent: null };
  }
  if (lower === 'exit') {
    return { type: 'exit', text: '', intent: null };
  }
  const result = askAlphGPT(text, lastIntent);
  return { type: 'response', text: result.text, intent: result.intent };
}
