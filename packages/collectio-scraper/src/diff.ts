import type { NewReleaseDiff, Title } from '@hoqn/collectio-core';

/** Pure diff between two catalog snapshots, keyed by title id. */
export function diffCatalogs(previous: Title[], current: Title[]): NewReleaseDiff {
  const previousIds = new Set(previous.map((t) => t.id));
  const currentIds = new Set(current.map((t) => t.id));

  return {
    added: current.filter((t) => !previousIds.has(t.id)),
    removed: previous.filter((t) => !currentIds.has(t.id)),
  };
}
