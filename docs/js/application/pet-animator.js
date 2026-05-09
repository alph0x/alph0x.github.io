/**
 * @fileoverview Pet animation use-case — pure logic, no Three.js.
 *
 * SRP: Given a Pet and a Player position, computes the next animation frame.
 *      All functions are deterministic and testable without mocks.
 */

const MAX_HEAD_TURN = 0.5;
const SMOOTH_FACTOR = 0.12;
const EXCITE_DISTANCE = 1.0;
const LOSE_INTEREST_DISTANCE = 2.5;

/**
 * Main entry. Mutates `pet` with new animation state.
 *
 * @param {Pet} pet
 * @param {{x:number,y:number,z:number}} playerPosition
 * @param {number} timeS — elapsed time in seconds
 */
export function updatePetAnimation(pet, playerPosition, timeS) {
  const dx = playerPosition.x - pet.position.x;
  const dz = playerPosition.z - pet.position.z;
  pet.distToPlayer = Math.sqrt(dx * dx + dz * dz);
  pet.isExcited = pet.distToPlayer < EXCITE_DISTANCE;

  updateBreathing(pet, timeS);
  updateTail(pet, timeS);
  updateEars(pet, timeS);
  updateHead(pet, playerPosition);
}

/* ── Breathing ─────────────────────────────────────────────────────── */

function updateBreathing(pet, timeS) {
  const breathAmp = pet.isExcited ? 0.025 : 0.015;
  pet.breathScale = 1 + Math.sin(timeS * 2) * breathAmp;
}

/* ── Tail ──────────────────────────────────────────────────────────── */

function updateTail(pet, timeS) {
  const speed = pet.isExcited ? 12 : 7;
  const ampZ = pet.isExcited ? 0.15 : 0.08;
  const ampY = pet.isExcited ? 0.12 : 0.06;
  pet.tailRotationZ = 0.2 + Math.sin(timeS * speed) * ampZ;
  pet.tailRotationY = Math.sin(timeS * speed * 0.8) * ampY;
}

/* ── Ears ──────────────────────────────────────────────────────────── */

function updateEars(pet, timeS) {
  if (pet.isExcited) {
    pet.earLRotationZ = -0.05 + Math.sin(timeS * 3) * 0.03;
    pet.earRRotationZ = -0.05 - Math.sin(timeS * 3) * 0.03;
  } else {
    const twitch = Math.sin(timeS * 1.3) * 0.05;
    pet.earLRotationZ = -0.2 + twitch;
    pet.earRRotationZ = -0.2 - twitch;
  }
}

/* ── Head look ─────────────────────────────────────────────────────── */

function updateHead(pet, playerPosition) {
  if (pet.distToPlayer > LOSE_INTEREST_DISTANCE) {
    // Return to neutral when player is far away
    pet.headRotation += (0 - pet.headRotation) * SMOOTH_FACTOR;
    return;
  }

  const dx = playerPosition.x - pet.position.x;
  const dz = playerPosition.z - pet.position.z;
  const angleToPlayer = Math.atan2(dx, dz);

  // Three.js uses counter-clockwise rotation.y. Pet local +X is its forward.
  // When bodyRotation=0 the pet looks toward +X; when bodyRotation=π/2 it
  // looks toward -Z (Three.js convention).
  let targetY = angleToPlayer - Math.PI / 2 - pet.bodyRotation;
  while (targetY > Math.PI) targetY -= Math.PI * 2;
  while (targetY < -Math.PI) targetY += Math.PI * 2;

  // When the player is behind the pet (|targetY| near π) we need to know
  // which side (left/right) they are on so the head turns the correct way.
  const rightX = -Math.sin(pet.bodyRotation);
  const rightZ = -Math.cos(pet.bodyRotation);
  const dotRight = dx * rightX + dz * rightZ;

  let clamped;
  if (Math.abs(targetY) > Math.PI - MAX_HEAD_TURN) {
    // Player is behind the pet — pick the side they are actually on
    clamped = dotRight > 0 ? -MAX_HEAD_TURN : MAX_HEAD_TURN;
  } else {
    clamped = Math.max(-MAX_HEAD_TURN, Math.min(MAX_HEAD_TURN, targetY));
  }

  pet.headRotation += (clamped - pet.headRotation) * SMOOTH_FACTOR;
}
