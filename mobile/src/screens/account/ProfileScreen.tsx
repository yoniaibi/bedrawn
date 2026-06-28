import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet, apiPut } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface Profile {
  handle: string;
  name: string;
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    apiGet<Profile>('/profile')
      .then(p => {
        setHandle(p.handle ?? '');
        setName(p.name ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!handle.trim()) {
      setMessage({ text: 'Handle cannot be empty', isError: true });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await apiPut('/profile', { handle: handle.trim(), name: name.trim() });
      setMessage({ text: 'Profile saved!', isError: false });
    } catch {
      setMessage({ text: 'Failed to save. Try again.', isError: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.PURPLE} />
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Handle</Text>
          <TextInput
            style={styles.input}
            value={handle}
            onChangeText={setHandle}
            autoCapitalize="none"
            placeholder="@yourhandle"
            placeholderTextColor={C.MUTED}
          />
          <Text style={styles.hint}>Letters, numbers, and underscores only</Text>

          <Text style={[styles.label, { marginTop: S.lg }]}>Display name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={C.MUTED}
          />

          {message && (
            <Text style={[styles.message, message.isError ? styles.error : styles.success]}>
              {message.text}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={C.WHITE} />
            ) : (
              <Text style={styles.saveBtnText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.xl,
    paddingVertical: S.lg,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  back: { color: C.GREY, fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700', color: C.TEXT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  form: { padding: S.xl, gap: S.xs },
  label: { color: C.GREY, fontSize: 13, fontWeight: '600', marginBottom: S.xs },
  input: {
    backgroundColor: C.CARD2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.BORDER,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    color: C.TEXT,
    fontSize: 15,
  },
  hint: { color: C.MUTED, fontSize: 12, marginTop: 4 },
  message: { marginTop: S.md, fontSize: 14, fontWeight: '600' },
  error: { color: C.RED },
  success: { color: C.GREEN },
  saveBtn: {
    marginTop: S.xl,
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
});
