/**
 * @fileoverview Tests for AlphGPT keyword-matching engine.
 */

import { describe, it, expect } from 'vitest';
import { askAlphGPT } from '../docs/js/systems/alphgpt.js';

describe('askAlphGPT', () => {
  it('returns a greeting response for hello', () => {
    const result = askAlphGPT('hello');
    expect(result.text).toContain("Alfredo");
    expect(result.intent).toBe('greeting');
  });

  it('returns skills for tech stack query', () => {
    const result = askAlphGPT('what is your tech stack?');
    expect(result.text).toContain('React Native');
    expect(result.intent).toBe('skills');
  });

  it('returns contact info for email query', () => {
    const result = askAlphGPT('how can I contact you?');
    expect(result.text).toContain('alfredop88@me.com');
    expect(result.intent).toBe('contact');
  });

  it('returns experience for work query', () => {
    const result = askAlphGPT('tell me about your work experience');
    expect(result.text).toContain('GeoPagos');
    expect(result.intent).toBe('experience');
  });

  it('returns fallback for unknown query', () => {
    const result = askAlphGPT('xyz random gibberish 123');
    expect(result.intent).toBeNull();
    expect(result.text.length).toBeGreaterThan(10);
  });

  it('uses context follow-up when query is vague', () => {
    const first = askAlphGPT('what are your skills?');
    expect(first.intent).toBe('skills');
    const followUp = askAlphGPT('tell me more', first.intent);
    expect(followUp.intent).toBe('skills');
  });

  it('returns who info for identity query', () => {
    const result = askAlphGPT('who is alfredo?');
    expect(result.text).toContain('BSc');
    expect(result.intent).toBe('who');
  });

  it('returns location info', () => {
    const result = askAlphGPT('where are you based?');
    expect(result.text).toContain('Buenos Aires');
    expect(result.intent).toBe('location');
  });

  it('returns lulu info for dog query', () => {
    const result = askAlphGPT('who is lulu?');
    expect(result.text).toContain('schnauzer');
    expect(result.intent).toBe('lulu');
  });

  it('returns help for help query', () => {
    const result = askAlphGPT('help');
    expect(result.text).toContain('skills');
    expect(result.intent).toBe('help');
  });
});
