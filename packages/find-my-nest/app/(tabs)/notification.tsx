import { ScrollView, Text, View } from "react-native";

export default function NotificationScreen() {
  return (
    <ScrollView>
        <View style={{ display: 'flex', flexDirection: 'column' }}>
          {Array.from({ length: 100 }).map((_, index) => (
            <View key={index} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text>Search {index}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
  );
}