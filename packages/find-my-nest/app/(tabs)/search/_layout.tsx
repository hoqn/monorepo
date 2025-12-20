import { Stack } from "expo-router";

export default function SearchLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ 
        title: '검색',
        headerSearchBarOptions: {
          placement: 'automatic',
          placeholder: '검색하기',
        } }} />
    </Stack>
  );
}