/**
 * @fileoverview Tests for AlphGPT keyword-matching engine.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  askAlphGPT,
  enterTerminalMode,
  exitTerminalMode,
  isTerminalMode,
  getTerminalCommands,
  processTerminalCommand,
} from '../docs/js/systems/alphgpt.js';

describe('askAlphGPT', () => {
  it('returns a greeting response for hello', () => {
    const result = askAlphGPT('hello');
    expect(result.intent).toBe('greeting');
    expect(result.text.length).toBeGreaterThan(10);
  });

  it('returns skills for tech stack query', () => {
    const result = askAlphGPT('what is your tech stack?');
    expect(result.intent).toBe('skills');
    // Skills response is a bullet list of technologies
    expect(result.text.match(/•/g).length).toBeGreaterThanOrEqual(5);
  });

  it('returns contact info for email query', () => {
    const result = askAlphGPT('how can I contact you?');
    expect(result.intent).toBe('contact');
    // Structural marker: an email-shaped address
    expect(result.text).toMatch(/[\w.]+@[\w-]+\.[a-z]{2,}/);
  });

  it('returns experience for work query', () => {
    const result = askAlphGPT('tell me about your work experience');
    expect(result.intent).toBe('experience');
    // Structural marker: work history references a year
    expect(result.text).toMatch(/\b(19|20)\d{2}\b/);
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
    expect(result.intent).toBe('who');
    expect(result.text.length).toBeGreaterThan(40);
  });

  it('returns location info', () => {
    const result = askAlphGPT('where are you based?');
    expect(result.intent).toBe('location');
    expect(result.text.length).toBeGreaterThan(10);
  });

  it('returns lulu info for dog query', () => {
    const result = askAlphGPT('who is lulu?');
    expect(result.intent).toBe('lulu');
    expect(result.text.length).toBeGreaterThan(10);
  });

  it('returns help for help query', () => {
    const result = askAlphGPT('help');
    expect(result.intent).toBe('help');
    // Help response lists available topics as bullets
    expect(result.text.match(/•/g).length).toBeGreaterThanOrEqual(5);
  });

  it('returns dynamic time response with context', () => {
    const result = askAlphGPT('what time is it', null, {
      timeOfDay: 'afternoon',
      localTime: '3:42 PM',
    });
    expect(result.text).toContain('3:42 PM');
    expect(result.text).toContain('afternoon');
    expect(result.intent).toBe('time');
  });

  it('returns dynamic room response with context', () => {
    const result = askAlphGPT('what is in this room', null, {
      furnitureNames: ['Bed', 'Desk', 'Lulú'],
    });
    expect(result.text).toContain('Bed');
    expect(result.text).toContain('Desk');
    expect(result.text).toContain('Lulú');
    expect(result.intent).toBe('room');
  });

  it('returns nearby-aware lulu response with context', () => {
    const result = askAlphGPT('where is lulu', null, { luluNearby: true });
    expect(result.text).toContain('right here');
    expect(result.intent).toBe('lulu');
  });

  it('returns movement state response with context', () => {
    const result = askAlphGPT('are we moving', null, { isMoving: true });
    expect(result.text).toContain('moving');
    expect(result.intent).toBe('moving');
  });
});

describe('natural-language robustness', () => {
  it('routes what do you do to experience', () => {
    expect(askAlphGPT('what do you do?').intent).toBe('experience');
  });

  it('routes get in touch to contact', () => {
    expect(askAlphGPT('how do I get in touch?').intent).toBe('contact');
  });

  it('routes hiring to contact', () => {
    expect(askAlphGPT('are you hiring?').intent).toBe('contact');
  });

  it('routes github to contact', () => {
    expect(askAlphGPT('do you have a github?').intent).toBe('contact');
  });

  it('routes hire alfredo to contact over who', () => {
    expect(askAlphGPT('i want to hire alfredo').intent).toBe('contact');
  });

  it('routes como te llamas to who in Spanish', () => {
    const r = askAlphGPT('como te llamas?');
    expect(r.intent).toBe('who');
    expect(r.text).toMatch(/Soy AlphGPT|asistente/);
  });

  it('routes que sabes hacer to help', () => {
    expect(askAlphGPT('que sabes hacer?').intent).toBe('help');
  });

  it('routes en que trabajas to experience', () => {
    expect(askAlphGPT('en que trabajas?').intent).toBe('experience');
  });

  it('routes estas disponible to contact', () => {
    expect(askAlphGPT('estas disponible para trabajar?').intent).toBe('contact');
  });

  it('routes hablas español to language', () => {
    const r = askAlphGPT('hablas español?');
    expect(r.intent).toBe('language');
    expect(r.text).toMatch(/español|Hablo/i);
  });

  it('routes eres un robot to who', () => {
    expect(askAlphGPT('eres un robot?').intent).toBe('who');
  });

  it('does not misroute what is interesting to room', () => {
    expect(askAlphGPT('what is interesting?').intent).not.toBe('room');
  });

  it('never leaks STATE_* placeholders without game context', () => {
    const result = askAlphGPT('what is in this room');
    expect(result.intent).toBe('room');
    expect(result.text).not.toContain('STATE_ROOM');
    expect(result.text).toMatch(/game loaded|juego esté cargado/i);
  });
});

describe('terminal mode', () => {
  beforeEach(() => {
    exitTerminalMode();
  });

  it('enters and exits terminal mode', () => {
    expect(isTerminalMode()).toBe(false);
    enterTerminalMode();
    expect(isTerminalMode()).toBe(true);
    exitTerminalMode();
    expect(isTerminalMode()).toBe(false);
  });

  it('records command history', () => {
    processTerminalCommand('hello');
    processTerminalCommand('help');
    expect(getTerminalCommands()).toEqual(['hello', 'help']);
  });

  it('returns help for help command', () => {
    const result = processTerminalCommand('help');
    expect(result.type).toBe('response');
    expect(result.text).toContain('help');
    expect(result.text).toContain('clear');
    expect(result.text).toContain('exit');
  });

  it('returns clear action for clear command', () => {
    const result = processTerminalCommand('clear');
    expect(result.type).toBe('clear');
  });

  it('returns exit action for exit command', () => {
    const result = processTerminalCommand('exit');
    expect(result.type).toBe('exit');
  });

  it('delegates unknown commands to askAlphGPT', () => {
    const result = processTerminalCommand('who is alfredo?');
    expect(result.type).toBe('response');
    expect(result.intent).toBe('who');
  });
});
