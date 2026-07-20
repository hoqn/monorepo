import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '카탈로그' }} />
      <Stack.Screen name="title/[id]" options={{ title: '작품 정보' }} />
      <Stack.Screen name="watchlist" options={{ title: '위시리스트' }} />
    </Stack>
  );
}
