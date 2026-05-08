/**
 * @fileoverview Poster builder — registered as furniture for editor selectability.
 */

import { register } from '../registry.js';
import { buildPoster as makePoster } from '../../level/decorations/poster.js';

function buildPoster(cfg) {
  const mesh = makePoster({
    position: cfg.position,
    text: cfg.text || 'POSTER',
    color: cfg.color ?? 0x7c3aed,
  });
  return { mesh };
}

register('poster', buildPoster);
