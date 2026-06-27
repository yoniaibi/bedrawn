import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notifications } from '../../data/mockData';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

const TYPE_CONFIG = {
  win: { icon: '★', color: C.GOLD, bg: 'rgba(245,158,11,0.1)', border: C.GOLD },
  reminder: { icon: '!', color: C.PURPLE, bg: 'rgba(139,92,246,0.1)', border: C.PURPLE },
  promo: { icon: '%', color: C.GREEN, bg: 'rgba(16,185,129,0.1)', border: C.GREEN },
};

export function NotificationsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.dateGroup}>Today</Text>
        {notifications.filter(n => n.date === 'Today').map(notif => {
          const config = TYPE_CONFIG[notif.type];
          return (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.read && styles.notifCardUnread, { borderLeftColor: config.border }]}
            >
              <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                <Text style={[styles.notifIconText, { color: config.color }]}>{config.icon}</Text>
              </View>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifText}>{notif.body}</Text>
              </View>
              {!notif.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.dateGroup, { marginTop: S.xl }]}>Yesterday</Text>
        {notifications.filter(n => n.date === 'Yesterday').map(notif => {
          const config = TYPE_CONFIG[notif.type];
          return (
            <TouchableOpacity key={notif.id} style={[styles.notifCard, { borderLeftColor: config.border }]}>
              <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                <Text style={[styles.notifIconText, { color: config.color }]}>{config.icon}</Text>
              </View>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifText}>{notif.body}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
  content: { padding: S.xl },
  dateGroup: { color: C.MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: S.md },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
    backgroundColor: C.CARD,
    borderRadius: 12,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.BORDER,
    borderLeftWidth: 3,
  },
  notifCardUnread: { borderColor: C.PURPLE },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconText: { fontSize: 18, fontWeight: '700' },
  notifBody: { flex: 1 },
  notifTitle: { color: C.TEXT, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  notifText: { color: C.GREY, fontSize: 13, lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.PURPLE,
    marginTop: 4,
  },
});
