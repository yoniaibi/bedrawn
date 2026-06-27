import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentUser } from '../../data/mockData';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

export function SettingsScreen() {
  const navigation = useNavigation();
  const [handle, setHandle] = useState(currentUser.handle);
  const [email, setEmail] = useState('yoniaibi@gmail.com');
  const [notifications, setNotifications] = useState({
    draws: true,
    wins: true,
    reminders: true,
    promos: false,
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile fields */}
        <Text style={styles.sectionTitle}>Profile</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Handle</Text>
          <TextInput
            style={styles.input}
            value={handle}
            onChangeText={setHandle}
            placeholderTextColor={C.MUTED}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={C.MUTED}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.changePasswordBtn}>
          <Text style={styles.changePasswordText}>Change password →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save changes</Text>
        </TouchableOpacity>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { marginTop: S.xl }]}>Notifications</Text>

        {[
          { key: 'draws', label: 'New draws', desc: 'When a new draw is listed in your categories' },
          { key: 'wins', label: 'Win alerts', desc: 'When you win a draw' },
          { key: 'reminders', label: 'Draw reminders', desc: '1 hour before draws you\'ve entered close' },
          { key: 'promos', label: 'Promotions', desc: 'Special offers and announcements' },
        ].map(item => (
          <View key={item.key} style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>{item.label}</Text>
              <Text style={styles.toggleDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={notifications[item.key as keyof typeof notifications]}
              onValueChange={val => setNotifications(prev => ({ ...prev, [item.key]: val }))}
              trackColor={{ false: C.BORDER, true: C.PURPLE }}
              thumbColor={C.WHITE}
            />
          </View>
        ))}

        {/* Danger zone */}
        <Text style={[styles.sectionTitle, { marginTop: S.xl, color: C.RED }]}>Danger zone</Text>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteBtnText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: S.xl, paddingBottom: S.xxxl },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.GREY, letterSpacing: 0.5, marginBottom: S.md },
  field: { marginBottom: S.lg },
  label: { color: C.GREY, fontSize: 12, fontWeight: '600', marginBottom: S.xs },
  input: {
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.BORDER,
    borderRadius: 10,
    padding: S.lg,
    color: C.TEXT,
    fontSize: 15,
  },
  changePasswordBtn: { marginBottom: S.xl },
  changePasswordText: { color: C.PURPLE, fontSize: 14, fontWeight: '600' },
  saveBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.md,
    alignItems: 'center',
    marginBottom: S.sm,
  },
  saveBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 15 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  toggleInfo: { flex: 1, marginRight: S.lg },
  toggleLabel: { color: C.TEXT, fontSize: 15 },
  toggleDesc: { color: C.GREY, fontSize: 12, marginTop: 2 },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: C.RED,
    borderRadius: 10,
    paddingVertical: S.lg,
    alignItems: 'center',
  },
  deleteBtnText: { color: C.RED, fontWeight: '600', fontSize: 15 },
});
