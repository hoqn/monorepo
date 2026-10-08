import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { SEGMENTS, computeCom } from './anthropometry';
import { analyzeBalance, convexHull, signedDistanceToHull } from './balance';
import { resolveSolo, solveTwoBone, type ActorDef, type PoseSpec } from './rig';

const actor: ActorDef = { id: 'a', name: 'a', height: 1.75, mass: 70, color: '#fff' };

const standing: PoseSpec = {
  root: { pos: [0, 0.89, 0], yaw: 0, pitch: 0, roll: 0 },
  torso: { flex: 0, side: 0, twist: 0 },
  head: { flex: 0, twist: 0 },
  feet: { L: { at: [0.12, 0.07, 0] }, R: { at: [-0.12, 0.07, 0] } },
  hands: { L: { local: [0.25, 0.05, 0.05] }, R: { local: [-0.25, 0.05, 0.05] } },
};

describe('anthropometry', () => {
  it('segment mass fractions sum to ~1', () => {
    const sum = SEGMENTS.reduce((s, d) => s + d.massFraction, 0);
    expect(sum).toBeCloseTo(1, 2);
  });

  it('standing CoM sits around 55-58% of body height, centered between the feet', () => {
    const body = resolveSolo(actor, standing);
    const { com } = computeCom(body.points, actor.mass);
    expect(com.y / actor.height).toBeGreaterThan(0.53);
    expect(com.y / actor.height).toBeLessThan(0.6);
    expect(Math.abs(com.x)).toBeLessThan(0.01);
  });
});

describe('rig', () => {
  it('two-bone IK reaches a reachable target and keeps bone lengths', () => {
    const root = new Vector3(0, 1, 0);
    const target = new Vector3(0.3, 0.4, 0.2);
    const { mid, end, error } = solveTwoBone(root, target, 0.43, 0.42, new Vector3(0, 0, 1));
    expect(error).toBe(0);
    expect(end.distanceTo(target)).toBeLessThan(1e-6);
    expect(mid.distanceTo(root)).toBeCloseTo(0.43, 6);
    expect(mid.distanceTo(end)).toBeCloseTo(0.42, 6);
  });

  it('feet land on the requested spots with the head at body height', () => {
    const body = resolveSolo(actor, standing);
    expect(body.points.ankleL.distanceTo(new Vector3(0.12, 0.07, 0))).toBeLessThan(1e-6);
    // 골반→정수리 0.83m (키 1.75m 기준 골격 치수의 합)
    expect(body.points.headTop.y - body.points.pelvis.y).toBeCloseTo(0.83, 3);
    expect(body.points.heelL.y).toBeGreaterThan(0);
    expect(body.points.heelL.y).toBeLessThan(0.05);
  });
});

describe('balance', () => {
  const square = convexHull([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: 0.5, y: 0.5 },
  ]);

  it('convex hull drops interior points', () => {
    expect(square).toHaveLength(4);
  });

  it('signed distance is positive inside, negative outside', () => {
    expect(signedDistanceToHull({ x: 0.5, y: 0.5 }, square)).toBeCloseTo(0.5);
    expect(signedDistanceToHull({ x: 1.5, y: 0.5 }, square)).toBeCloseTo(-0.5);
  });

  it('upright stance is stable; leaning the whole body far forward is not', () => {
    const body = resolveSolo(actor, standing);
    const { com } = computeCom(body.points, actor.mass);
    expect(analyzeBalance(body.points, com, null).state).toBe('stable');

    const shifted = com.clone().add(new Vector3(0, 0, 0.4));
    expect(analyzeBalance(body.points, shifted, null).margin).toBeLessThan(0);
  });

  it('XCoM accounts for velocity', () => {
    const body = resolveSolo(actor, standing);
    const { com } = computeCom(body.points, actor.mass);
    const still = analyzeBalance(body.points, com, new Vector3());
    const moving = analyzeBalance(body.points, com, new Vector3(0, 0, -1.5));
    expect(still.state).toBe('stable');
    expect(moving.state).toBe('unstable');
  });
});
