import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Title } from '@hoqn/collectio-core';
import { collectioClient } from '../../src/lib/client.ts';
import { asyncStorageWatchlistStore } from '../../src/lib/watchlist.ts';

export default function TitleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState<Title | null>(null);
  const [watchlisted, setWatchlisted] = useState(false);

  useEffect(() => {
    if (!id) return;
    collectioClient.fetchTitleDetail(id).then(setTitle);
    asyncStorageWatchlistStore.isWatchlisted(id).then(setWatchlisted);
  }, [id]);

  if (!id || !title) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  const handleToggleWatchlist = async () => {
    await asyncStorageWatchlistStore.toggle(id);
    setWatchlisted((prev) => !prev);
  };

  const handleOpenOfficial = () => {
    asyncStorageWatchlistStore.markOpened(id);
    Linking.openURL(title.officialUrl);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Image source={{ uri: title.posterUrl }} style={{ width: 200, aspectRatio: 300 / 420, borderRadius: 8 }} />
      <Text style={{ fontSize: 22, fontWeight: '700', marginTop: 16 }}>{title.titleKo}</Text>
      <Text style={{ opacity: 0.7 }}>{title.titleOriginal}</Text>
      <Text style={{ marginTop: 8 }}>
        {title.director} · {title.releaseYear} · {title.runtimeMin}분
      </Text>
      <Text>{title.genres.join(', ')}</Text>
      <Text style={{ marginTop: 12 }}>{title.synopsis}</Text>

      <Pressable
        onPress={handleOpenOfficial}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, marginTop: 20, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>공식 사이트/앱에서 보기</Text>
      </Pressable>
      <Pressable
        onPress={handleToggleWatchlist}
        style={{ borderWidth: 1, borderColor: '#111', padding: 14, borderRadius: 8, marginTop: 12, alignItems: 'center' }}
      >
        <Text style={{ fontWeight: '600' }}>{watchlisted ? '위시리스트에서 제거' : '위시리스트에 담기'}</Text>
      </Pressable>
    </ScrollView>
  );
}
