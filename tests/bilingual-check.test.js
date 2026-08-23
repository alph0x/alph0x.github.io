import { describe, it, expect } from 'vitest';
import { askAlphGPT, detectLanguage } from '../docs/js/systems/alphgpt.js';

describe('bilingual alphGPT', () => {
  it('detects Spanish', () => {
    expect(detectLanguage('¿Cuáles son sus habilidades?')).toBe('es');
    expect(detectLanguage('hola, quien es alfredo?')).toBe('es');
    expect(detectLanguage('cuéntame de su experiencia')).toBe('es');
    expect(detectLanguage('what are his skills')).toBe('en');
    expect(detectLanguage('where is he based')).toBe('en');
  });
  it('answers skills in Spanish', () => {
    const r = askAlphGPT('¿cuáles son sus habilidades?');
    expect(r.intent).toBe('skills');
    expect(r.text).toContain('Experto');
  });
  it('answers contact in Spanish', () => {
    const r = askAlphGPT('¿cómo lo contacto?');
    expect(r.intent).toBe('contact');
    expect(r.text).toContain('alfredop88@me.com');
  });
  it('answers greeting in Spanish', () => {
    const r = askAlphGPT('hola buenas tardes');
    expect(r.intent).toBe('greeting');
    expect(r.text).toMatch(/Hola|Buenas/);
  });
  it('still answers English', () => {
    const r = askAlphGPT('tell me about his experience');
    expect(r.intent).toBe('experience');
    expect(r.text).toContain('GeoPagos');
  });
  it('fallback in Spanish', () => {
    const r = askAlphGPT('xyzzy plugh qwerty');
    // unknown tokens -> English fallback is fine; Spanish nonsense -> Spanish fallback
    const r2 = askAlphGPT('¿qué opinas del asdfgh?');
    expect(r2.intent).toBeNull();
  });
  it('detects accent-free Spanish (P-01)', () => {
    expect(detectLanguage('como te llamas?')).toBe('es');
    expect(detectLanguage('que sabes hacer?')).toBe('es');
    expect(detectLanguage('eres un robot?')).toBe('es');
    expect(detectLanguage('estas disponible para trabajar?')).toBe('es');
    expect(detectLanguage('en que trabajas?')).toBe('es');
  });
  it('keeps accent-free English English (P-01)', () => {
    expect(detectLanguage('what do you do?')).toBe('en');
    expect(detectLanguage('are you hiring?')).toBe('en');
    expect(detectLanguage('is he a robot')).toBe('en');
    expect(detectLanguage('tell me about')).toBe('en');
  });
});
