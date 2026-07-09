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
    expect(result.text).toContain('BSc');
    expect(result.intent).toBe('who');
  });
});
