import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function App() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!API_URL) { setError('EXPO_PUBLIC_API_URL not set'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/items`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      setError('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BeDrawn</Text>
      <TouchableOpacity style={styles.button} onPress={fetchItems}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id ?? item.PK}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{JSON.stringify(item)}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No items yet.</Text> : null}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  button: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: 'red', marginTop: 12 },
  empty: { color: '#999', marginTop: 24, textAlign: 'center' },
  item: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginTop: 8 },
});
