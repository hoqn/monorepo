import { Vector3 } from 'three';
import { combinedCom, computeCom, type ComResult } from '../body/anthropometry';
import { analyzeBalance, type BalanceResult } from '../body/balance';
import { resolvePair, type ResolvedBody } from '../body/rig';
import { duration, sampleTechnique, type TechniqueAnimation } from './timeline';

export interface ActorFrame {
  body: ResolvedBody;
  com: ComResult;
  velocity: Vector3;
  balance: BalanceResult;
}

export interface Frame {
  t: number;
  tori: ActorFrame;
  uke: ActorFrame;
  /** 잡기로 묶인 두 사람의 합성 질량중심 */
  pairCom: Vector3;
}

const VELOCITY_DT = 1 / 60;

function resolveAt(tech: TechniqueAnimation, t: number) {
  const { tori, uke } = sampleTechnique(tech, t);
  return resolvePair([tech.actors.tori, tech.actors.uke], [tori, uke]);
}

export function analyzeFrame(tech: TechniqueAnimation, t: number): Frame {
  const [toriBody, ukeBody] = resolveAt(tech, t);
  // 중앙 차분으로 질량중심 속도 추정 (끝점에서는 한쪽 차분)
  const end = duration(tech);
  const t0 = Math.max(0, t - VELOCITY_DT);
  const t1 = Math.min(end, t + VELOCITY_DT);
  const [toriA, ukeA] = resolveAt(tech, t0);
  const [toriB, ukeB] = resolveAt(tech, t1);
  const span = Math.max(1e-6, t1 - t0);

  const actorFrame = (body: ResolvedBody, a: ResolvedBody, b: ResolvedBody): ActorFrame => {
    const com = computeCom(body.points, body.actor.mass);
    const velocity =
      t1 > t0
        ? new Vector3()
            .subVectors(computeCom(b.points, body.actor.mass).com, computeCom(a.points, body.actor.mass).com)
            .divideScalar(span)
        : new Vector3();
    return { body, com, velocity, balance: analyzeBalance(body.points, com.com, velocity) };
  };

  const tori = actorFrame(toriBody, toriA, toriB);
  const uke = actorFrame(ukeBody, ukeA, ukeB);
  return { t, tori, uke, pairCom: combinedCom([tori.com, uke.com]) };
}

export interface TimelineSample {
  t: number;
  toriMargin: number | null;
  ukeMargin: number | null;
  toriCom: Vector3;
  ukeCom: Vector3;
}

/** 그래프·궤적용으로 전체 기술을 균일 샘플링 */
export function sampleTimeline(tech: TechniqueAnimation, steps = 120): TimelineSample[] {
  const end = duration(tech);
  const out: TimelineSample[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (end * i) / steps;
    const f = analyzeFrame(tech, t);
    const margin = (a: ActorFrame) => {
      const m = a.balance.xcomMargin ?? a.balance.margin;
      return Number.isFinite(m) ? m : null;
    };
    out.push({ t, toriMargin: margin(f.tori), ukeMargin: margin(f.uke), toriCom: f.tori.com.com, ukeCom: f.uke.com.com });
  }
  return out;
}
