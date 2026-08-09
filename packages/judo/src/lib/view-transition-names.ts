// 기술 카드 썸네일 ↔ 상세 페이지 영상이 같은 이름을 공유해야 View
// Transitions API가 같은 요소로 인식하고 자리를 모핑해준다.
export function techniqueMediaTransitionName(techniqueId: string) {
  return `technique-media-${techniqueId}`;
}
