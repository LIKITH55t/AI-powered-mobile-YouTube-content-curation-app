import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.text}>Page not found</Text>
        <Link href="/" style={styles.link}>
          Go to Feed
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },
  text: { color: '#888', fontSize: 16 },
  link: { color: '#3b82f6', marginTop: 12, fontSize: 14, fontWeight: '600' },
});
