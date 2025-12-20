
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { Badge, Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name='index'>
        <Label>홈</Label>
        <Icon sf={{ default: "house", selected: "house.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='explore'>
        <Label>지도</Label>
        <Icon sf={{ default: "map", selected: "map.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='notification'>
        <Label>알림</Label>
        <Icon sf={{ default: "bell", selected: "bell.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='search' role="search">
        <Label>검색</Label>
        <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
