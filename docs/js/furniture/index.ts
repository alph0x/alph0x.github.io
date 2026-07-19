/**
 * @fileoverview Furniture barrel — imports all builders to register them.
 *
 * Side-effect imports: each module registers its builders into FurnitureRegistry.
 */

import './builders/bed.js';
import './builders/nightstand.js';
import './builders/bookshelf.js';
import './builders/desk.js';
import './builders/desk-chair.js';
import './builders/coffee-table.js';
import './builders/rug.js';
import './builders/floor-lamp.js';
import './builders/tv.js';
import './builders/box-stack.js';
import './builders/plant.js';
import './builders/terminal.js';
import './builders/monitor.js';
import './builders/gaming-pc.js';
import './builders/controller.js';
import './builders/headset.js';
import './builders/server.js';
import './builders/drone.js';
import './builders/can.js';
import './builders/bottle.js';
import './builders/book-stack.js';
import './builders/shoes.js';
import './builders/clothes.js';
import './builders/gun.js';
import './builders/mug.js';
import './builders/paper.js';
import './builders/ceiling-lamp.js';
import './builders/poster.js';
import './builders/fairy-lights.js';
import './builders/door.js';
import './builders/window.js';
import './builders/mini-schnauzer.js';
import './builders/trash.js';
import './builders/macbook.js';

import './meta.js';

export { FurnitureRegistry, type BuilderResult, type RegistryEntry } from './registry.js';
