import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Title } from '@hoqn/collectio-core';
import { collectioClient } from '../lib/client.ts';

export function CatalogPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');

  useEffect(() => {
    collectioClient.fetchCatalog().then(setTitles);
  }, []);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const title of titles) {
      for (const g of title.genres) set.add(g);
    }
    return ['all', ...Array.from(set).sort()];
  }, [titles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return titles.filter((title) => {
      const matchesQuery =
        q === '' ||
        title.titleKo.toLowerCase().includes(q) ||
        title.titleOriginal.toLowerCase().includes(q) ||
        title.director.toLowerCase().includes(q);
      const matchesGenre = genre === 'all' || title.genres.includes(genre);
      return matchesQuery && matchesGenre;
    });
  }, [titles, query, genre]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="search"
          placeholder="제목, 감독으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} style={{ padding: 8 }}>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g === 'all' ? '전체 장르' : g}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {filtered.map((title) => (
          <Link key={title.id} to={`/titles/${title.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src={title.posterUrl} alt={title.titleKo} style={{ width: '100%', borderRadius: 8 }} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>{title.titleKo}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {title.director} · {title.releaseYear}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p>조건에 맞는 작품이 없습니다.</p>}
      </div>
    </div>
  );
}
