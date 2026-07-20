import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import type { Title } from '@hoqn/collectio-core';
import { collectioClient } from '../src/lib/client.ts';

export default function CatalogScreen() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    collectioClient.fetchCatalog().then(setTitles);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === '') return titles;
    return titles.filter(
      (title) => title.titleKo.toLowerCase().includes(q) || title.director.toLowerCase().includes(q),
    );
  }, [titles, query]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Link href="/watchlist" style={{ marginBottom: 12, textAlign: 'right' }}>
        위시리스트 보기
      </Link>
      <TextInput
        placeholder="제목, 감독으로 검색"
        value={query}
        onChangeText={setQuery}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16 }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <Link href={`/title/${item.id}`} asChild>
            <Pressable style={{ flex: 1 }}>
              <Image source={{ uri: item.posterUrl }} style={{ width: '100%', aspectRatio: 300 / 420, borderRadius: 8 }} />
              <Text style={{ fontWeight: '600', marginTop: 4 }}>{item.titleKo}</Text>
              <Text style={{ fontSize: 12, opacity: 0.7 }}>
                {item.director} · {item.releaseYear}
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
