import './amplify';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function App() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    getCurrentUser().then(u => setEmail(u.signInDetails?.loginId ?? ''));
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString() ?? '';
      const res = await fetch(`${API_URL}/items`, { headers: { Authorization: token } });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      // silently fail on network error
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BeDrawn</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>
      {email ? <Text style={styles.email}>{email}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={fetchItems} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading…' : 'Refresh'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id ?? item.PK}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{JSON.stringify(item)}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No items yet.</Text> : null}
      />
      <StatusBar style="auto" />
    </View>
  );
}

export default withAuthenticator(App);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700' },
  signOut: { fontSize: 14, color: '#666' },
  email: { fontSize: 13, color: '#999', marginBottom: 16 },
  button: { backgroundColor: '#000', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#999', marginTop: 24, textAlign: 'center' },
  item: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginTop: 8 },
  itemText: { fontFamily: 'monospace', fontSize: 12 },
});
