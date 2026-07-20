import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Title, WatchlistEntry } from '@hoqn/collectio-core';
import { collectioClient } from '../lib/client.ts';
import { localWatchlistStore } from '../lib/watchlist.ts';

export function WatchlistPage() {
  const [entries, setEntries] = useState<Array<{ entry: WatchlistEntry; title: Title }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [watchlist, catalog] = await Promise.all([localWatchlistStore.list(), collectioClient.fetchCatalog()]);
      const byId = new Map(catalog.map((t) => [t.id, t]));
      const resolved = watchlist
        .map((entry) => {
          const title = byId.get(entry.titleId);
          return title ? { entry, title } : null;
        })
        .filter((x): x is { entry: WatchlistEntry; title: Title } => x !== null);
      if (!cancelled) setEntries(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (entries.length === 0) {
    return (
      <p>
        위시리스트가 비어 있습니다. <Link to="/">카탈로그</Link>에서 작품을 담아보세요.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
      {entries.map(({ entry, title }) => (
        <li key={entry.titleId} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <img src={title.posterUrl} alt={title.titleKo} style={{ width: 56, borderRadius: 4 }} />
          <div style={{ flex: 1 }}>
            <Link to={`/titles/${title.id}`}>{title.titleKo}</Link>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              담은 날짜: {new Date(entry.addedAt).toLocaleDateString('ko-KR')}
              {entry.lastOpenedAt && ` · 마지막으로 열어봄: ${new Date(entry.lastOpenedAt).toLocaleDateString('ko-KR')}`}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
