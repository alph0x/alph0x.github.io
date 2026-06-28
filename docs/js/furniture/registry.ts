/**
 * @fileoverview Furniture Registry — OCP: add new items without touching room builder.
 * Stores builder function + optional metadata (category, dimensions, icon).
 */

import * as THREE from 'three';
import type { FurnitureConfig } from '../seed.js';

export type BuilderResult = { mesh: THREE.Mesh | THREE.Group } & Record<string, unknown>;
export type BuilderFn = (config: FurnitureConfig) => BuilderResult;

export interface FurnitureMeta {
  category?: string;
  dimensions?: { w: number; h: number; d: number } | string;
  icon?: string;
}

export interface RegistryEntry {
  builder: BuilderFn;
  meta: FurnitureMeta;
}

export const FurnitureRegistry: Map<string, RegistryEntry> = new Map();

export function register(type: string, builder: BuilderFn, meta: FurnitureMeta = {}): void {
  FurnitureRegistry.set(type, { builder, meta });
}
