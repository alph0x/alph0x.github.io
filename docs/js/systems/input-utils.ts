/**
 * @fileoverview Shared input helpers for game and editor: typing-target detection,
 * legend-overlay gating, and pointer → NDC conversion.
 */

import * as THREE from 'three';

const LEGEND_PASS_KEYS = ['Escape', 'KeyH', 'Slash'];

/** True when the keyboard event originates from a text-entry element. */
export function isTypingTarget(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement | null;
  if (!target) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

/** True when the legend overlay is open. */
export function isLegendOpen(): boolean {
  return !!document.getElementById('legend')?.classList.contains('active');
}

/** True when the legend overlay is open and this key should be swallowed. */
export function isLegendBlocking(e: KeyboardEvent): boolean {
  return isLegendOpen() && !LEGEND_PASS_KEYS.includes(e.code);
}

/** Toggle the legend overlay. */
export function toggleLegend(): void {
  document.getElementById('legend')?.classList.toggle('active');
}

/** Close the legend overlay. */
export function closeLegend(): void {
  document.getElementById('legend')?.classList.remove('active');
}

/** Convert a pointer event to NDC coordinates relative to the given element's bounds. */
export function pointerNDC(e: PointerEvent, el: HTMLElement): THREE.Vector2 {
  const rect = el.getBoundingClientRect();
  return new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
}
