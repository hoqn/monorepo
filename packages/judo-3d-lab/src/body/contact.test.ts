import { describe, expect, it } from 'vitest';
import { resolveContacts } from './contact';
import { resolveSolo, type ActorDef, type PoseSpec } from './rig';

const actor: ActorDef = { id: 'a', name: 'a', height: 1.75, mass: 70, color: '#fff' };

function standingAt(z: number, yaw: number): PoseSpec {
  const dir = yaw === 0 ? 1 : -1;
  return {
    root: { pos: [0, 0.89, z], yaw, pitch: 0, roll: 0 },
    torso: { flex: 0, side: 0, twist: 0 },
    head: { flex: 0, twist: 0 },
    feet: { L: { at: [0.12 * dir, 0.07, z] }, R: { at: [-0.12 * dir, 0.07, z] } },
    hands: { L: { local: [0.25, 0.05, 0.05] }, R: { local: [-0.25, 0.05, 0.05] } },
  };
}

describe('contact', () => {
  it('pushes overlapping bodies apart, keeps bone lengths and planted feet', () => {
    // 몸통 중심 사이 10cm: 크게 겹친 상태
    const a = resolveSolo(actor, standingAt(-0.05, 0)).points;
    const b = resolveSolo(actor, standingAt(0.05, 180)).points;
    const thigh = a.hipL.distanceTo(a.kneeL);
    const ankle = a.ankleL.clone();

    const r = resolveContacts(a, b);

    expect(r.maxPenetrationBefore).toBeGreaterThan(0.1);
    expect(r.maxPenetrationAfter).toBeLessThan(0.01);
    expect(a.pelvis.distanceTo(b.pelvis)).toBeGreaterThan(0.2);
    expect(a.hipL.distanceTo(a.kneeL)).toBeCloseTo(thigh, 2);
    expect(a.ankleL.distanceTo(ankle)).toBeLessThan(1e-9);
    expect(r.contacts.length).toBeGreaterThan(0);
  });

  it('leaves separated bodies untouched', () => {
    const a = resolveSolo(actor, standingAt(-0.6, 0)).points;
    const b = resolveSolo(actor, standingAt(0.6, 180)).points;
    const before = a.pelvis.clone();
    const r = resolveContacts(a, b);
    expect(r.maxPenetrationBefore).toBe(0);
    expect(r.contacts).toHaveLength(0);
    expect(a.pelvis.distanceTo(before)).toBe(0);
  });
});
