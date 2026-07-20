import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import type { Title, WatchlistEntry } from '@hoqn/collectio-core';
import { collectioClient } from '../src/lib/client.ts';
import { asyncStorageWatchlistStore } from '../src/lib/watchlist.ts';

export default function WatchlistScreen() {
  const [entries, setEntries] = useState<Array<{ entry: WatchlistEntry; title: Title }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [watchlist, catalog] = await Promise.all([
        asyncStorageWatchlistStore.list(),
        collectioClient.fetchCatalog(),
      ]);
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text>위시리스트가 비어 있습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={({ entry }) => entry.titleId}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item: { entry, title } }) => (
        <Link href={`/title/${title.id}`} asChild>
          <Pressable style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Image source={{ uri: title.posterUrl }} style={{ width: 56, aspectRatio: 300 / 420, borderRadius: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{title.titleKo}</Text>
              <Text style={{ fontSize: 12, opacity: 0.7 }}>
                담은 날짜: {new Date(entry.addedAt).toLocaleDateString('ko-KR')}
              </Text>
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}
