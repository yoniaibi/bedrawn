import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet } from '../../lib/api';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

interface Notification {
  id: string;
  type: 'win' | 'reminder' | 'promo' | 'draw_won';
  title?: string;
  body?: string;
  drawTitle?: string;
  read: boolean;
  createdAt: string;
}

function notifTitle(n: Notification): string {
  if (n.title) return n.title;
  if (n.type === 'draw_won') return '🎉 You won!';
  return 'Notification';
}

function notifBody(n: Notification): string {
  if (n.body) return n.body;
  if (n.type === 'draw_won' && n.drawTitle) return `You won the draw for: ${n.drawTitle}`;
  return '';
}

const TYPE_CONFIG = {
  win: { icon: '★', color: C.GOLD, bg: 'rgba(252,211,77,0.10)', border: C.GOLD },
  reminder: { icon: '!', color: C.PURPLE, bg: 'rgba(196,181,253,0.10)', border: C.PURPLE },
  promo: { icon: '%', color: C.GREEN, bg: 'rgba(74,222,128,0.10)', border: C.GREEN },
  draw_won: { icon: '★', color: C.GOLD, bg: 'rgba(252,211,77,0.10)', border: C.GOLD },
};

export function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ notifications: Notification[] }>('/notifications')
      .then(d => setNotifications(d.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.PURPLE} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {notifications.map(notif => {
            const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.promo;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  !notif.read && styles.notifCardUnread,
                  { borderLeftColor: config.border },
                ]}
              >
                <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                  <Text style={[styles.notifIconText, { color: config.color }]}>{config.icon}</Text>
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifTitle}>{notifTitle(notif)}</Text>
                  <Text style={styles.notifText}>{notifBody(notif)}</Text>
                  <Text style={styles.notifTime}>{notif.createdAt}</Text>
                </View>
                {!notif.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl },
  emptyText: { color: C.MUTED, fontSize: 15 },
  content: { padding: S.xl },
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
  notifTime: { color: C.MUTED, fontSize: 11, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.PURPLE,
    marginTop: 4,
  },
});
