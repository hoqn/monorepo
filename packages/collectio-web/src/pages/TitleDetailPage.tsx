import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Title } from '@hoqn/collectio-core';
import { collectioClient } from '../lib/client.ts';
import { localWatchlistStore } from '../lib/watchlist.ts';

export function TitleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState<Title | null>(null);
  const [watchlisted, setWatchlisted] = useState(false);

  useEffect(() => {
    if (!id) return;
    collectioClient.fetchTitleDetail(id).then(setTitle);
    localWatchlistStore.isWatchlisted(id).then(setWatchlisted);
  }, [id]);

  if (!id || !title) return <p>불러오는 중...</p>;

  const handleToggleWatchlist = async () => {
    await localWatchlistStore.toggle(id);
    setWatchlisted((prev) => !prev);
  };

  const handleOpenOfficial = () => {
    localWatchlistStore.markOpened(id);
  };

  return (
    <div>
      <Link to="/">← 카탈로그로</Link>
      <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
        <img src={title.posterUrl} alt={title.titleKo} style={{ width: 240, borderRadius: 8 }} />
        <div>
          <h1 style={{ marginBottom: 4 }}>{title.titleKo}</h1>
          <p style={{ opacity: 0.7, marginTop: 0 }}>{title.titleOriginal}</p>
          <p>
            {title.director} · {title.releaseYear} · {title.runtimeMin}분
          </p>
          <p>{title.genres.join(', ')}</p>
          <p style={{ maxWidth: 480 }}>{title.synopsis}</p>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <a
              href={title.officialUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleOpenOfficial}
              style={{ padding: '8px 16px', background: '#111', color: '#fff', borderRadius: 6 }}
            >
              공식 사이트에서 보기
            </a>
            <button onClick={handleToggleWatchlist} style={{ padding: '8px 16px', borderRadius: 6 }}>
              {watchlisted ? '위시리스트에서 제거' : '위시리스트에 담기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
