import { O_UCHI_GARI } from './o-uchi-gari';
import { OSOTO_GARI } from './osoto-gari';
import { SEOI_NAGE } from './seoi-nage';
import type { TechniqueAnimation } from './timeline';

/** 기술 목록. id는 packages/judo의 기술 id와 맞춘다 */
export const TECHNIQUES: TechniqueAnimation[] = [OSOTO_GARI, SEOI_NAGE, O_UCHI_GARI];
