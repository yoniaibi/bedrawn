import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CountdownTimer } from '../../components/CountdownTimer';
import { LiveDot } from '../../components/LiveDot';
import { ProgressBar } from '../../components/ProgressBar';
import { chatMessages, draws, ticketHoldings, tonightDraws } from '../../data/mockData';
import { LiveStackParamList } from '../../navigation/TabNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<LiveStackParamList>;

const REACTIONS = ['HOT', 'WIN', 'YES!', 'LOVE', 'HYPE', 'WOW'];

type FloatingEmoji = {
  id: number;
  emoji: string;
  x: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
};

export function LiveScreen() {
  const navigation = useNavigation<Nav>();
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const [messages, setMessages] = useState(chatMessages);
  const [inputText, setInputText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const emojiIdRef = useRef(0);

  // Slow continuous rotation
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(wheelRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [wheelRotation]);

  const rotate = wheelRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: `m${Date.now()}`,
      handle: '@yoniaibi',
      emoji: '🦋',
      message: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const addFloatingEmoji = (emoji: string) => {
    const id = emojiIdRef.current++;
    const opacity = new Animated.Value(1);
    const translateY = new Animated.Value(0);
    const x = Math.random() * 200 + 80;

    setFloatingEmojis(prev => [...prev, { id, emoji, x, opacity, translateY }]);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    });
  };

  const WHEEL_COLORS = ['#C4B5FD', '#F472B6', '#FCD34D', '#4ADE80', '#3B82F6', '#F87171', '#A78BFA', '#F97316'];
  const SEGMENTS = ['@sarah_j', '@sneaker_d', '@luxe_fan', '@yoniaibi', '@watch_n', '@stylerae', '@hype_co', '@vintagev'];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LiveDot />
            <Text style={styles.liveLabel}>LIVE</Text>
            <Text style={styles.headerTitle}>The 9pm Draw</Text>
          </View>
          <View style={styles.watching}>
            <Text style={styles.watchingText}>247 watching</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Prize Wheel */}
          <View style={styles.wheelContainer}>
            <Animated.View style={[styles.wheel, { transform: [{ rotate }] }]}>
              {SEGMENTS.map((seg, i) => (
                <View
                  key={seg}
                  style={[
                    styles.wheelSegment,
                    {
                      backgroundColor: WHEEL_COLORS[i % WHEEL_COLORS.length],
                      transform: [{ rotate: `${i * 45}deg` }],
                    },
                  ]}
                >
                  <Text style={styles.segmentText} numberOfLines={1}>{seg}</Text>
                </View>
              ))}
              {/* Center overlay */}
              <View style={styles.wheelCenter}>
                <Text style={styles.wheelCenterText}>bedrawn</Text>
              </View>
            </Animated.View>

            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownLabel}>Draw starts in</Text>
              <CountdownTimer style={styles.countdownTime} />
            </View>
          </View>

          {/* Reactions */}
          <View style={styles.reactionRow}>
            {REACTIONS.map(reaction => (
              <TouchableOpacity
                key={reaction}
                style={styles.reactionBtn}
                onPress={() => addFloatingEmoji(reaction)}
              >
                <Text style={styles.reactionEmoji}>{reaction}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Floating reactions */}
          {floatingEmojis.map(fe => (
            <Animated.Text
              key={fe.id}
              style={[
                styles.floatingEmoji,
                {
                  left: fe.x,
                  opacity: fe.opacity,
                  transform: [{ translateY: fe.translateY }],
                },
              ]}
            >
              {fe.emoji}
            </Animated.Text>
          ))}

          {/* Chat */}
          <View style={styles.chatContainer}>
            <Text style={styles.sectionTitle}>Live chat</Text>
            {messages.map(msg => (
              <View key={msg.id} style={styles.chatBubble}>
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>{msg.handle.slice(1, 3).toUpperCase()}</Text>
                </View>
                <View style={styles.chatTextCol}>
                  <Text style={styles.chatHandle}>{msg.handle}</Text>
                  <Text style={styles.chatMessage}>{msg.message}</Text>
                </View>
                <Text style={styles.chatTime}>{msg.timestamp}</Text>
              </View>
            ))}
          </View>

          {/* Tonight's draws */}
          <View style={styles.tonightSection}>
            <Text style={styles.sectionTitle}>Tonight's draws</Text>
            {draws.filter(d => d.isClosingTonight).map((draw, i) => {
              const holding = ticketHoldings.find(t => t.drawId === draw.id);
              const pct = Math.round((draw.soldTickets / draw.totalTickets) * 100);
              return (
                <TouchableOpacity
                  key={draw.id}
                  style={styles.drawItem}
                  onPress={() => navigation.navigate('DrawDetail', { draw })}
                >
                  <Text style={styles.drawNum}>{i + 1}</Text>
                  <View style={[styles.drawThumb, { backgroundColor: draw.imageColor }]} />
                  <View style={styles.drawInfo}>
                    <Text style={styles.drawTitle} numberOfLines={1}>{draw.title}</Text>
                    <Text style={styles.drawPrice}>{draw.ticketPrice}p · {draw.retailValue.toLocaleString()} RRP</Text>
                    <ProgressBar percent={pct} height={3} />
                  </View>
                  {holding && (
                    <View style={styles.yourTickets}>
                      <Text style={styles.yourTicketsText}>You: {holding.ticketCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Chat input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Say something…"
            placeholderTextColor={C.MUTED}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  liveLabel: { color: C.PINK, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  headerTitle: { color: C.TEXT, fontWeight: '700', fontSize: 15 },
  watching: {
    backgroundColor: C.CARD,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 4,
  },
  watchingText: { color: C.GREY, fontSize: 12 },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: S.xl,
    position: 'relative',
  },
  wheel: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.CARD2,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: C.BORDER,
  },
  wheelSegment: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: 0,
    left: '25%',
    transformOrigin: 'bottom center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  segmentText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },
  wheelCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.BG,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 10,
    borderWidth: 2,
    borderColor: C.BORDER,
  },
  wheelCenterText: { color: C.PURPLE, fontSize: 11, fontWeight: '800', fontFamily: 'serif' },
  countdownOverlay: { alignItems: 'center', marginTop: S.lg },
  countdownLabel: { color: C.GREY, fontSize: 13, marginBottom: S.xs },
  countdownTime: { fontSize: 28, color: C.TEXT, fontFamily: 'serif', fontWeight: '800' },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: S.md,
    paddingHorizontal: S.xl,
    marginBottom: S.md,
  },
  reactionBtn: {
    backgroundColor: C.CARD,
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  reactionEmoji: { fontSize: 11, fontWeight: '700', color: C.PURPLE },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '800',
    color: C.PURPLE,
    bottom: 200,
  },
  chatContainer: { paddingHorizontal: S.xl, marginBottom: S.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.TEXT, marginBottom: S.md },
  chatBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
    marginBottom: S.sm,
    backgroundColor: C.CARD,
    borderRadius: 10,
    padding: S.sm,
  },
  chatAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.PURPLE_LIGHT, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  chatAvatarText: { fontSize: 9, fontWeight: '700', color: C.PURPLE },
  chatTextCol: { flex: 1 },
  chatHandle: { color: C.PURPLE, fontWeight: '700', fontSize: 12, marginBottom: 2 },
  chatMessage: { color: C.TEXT, fontSize: 13 },
  chatTime: { color: C.MUTED, fontSize: 10, marginTop: 4 },
  tonightSection: { paddingHorizontal: S.xl, marginBottom: S.xxl },
  drawItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginBottom: S.md,
    backgroundColor: C.CARD,
    borderRadius: 10,
    padding: S.md,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  drawNum: { color: C.MUTED, fontSize: 14, fontWeight: '700', width: 20, textAlign: 'center' },
  drawThumb: { width: 44, height: 44, borderRadius: 8 },
  drawInfo: { flex: 1, gap: 3 },
  drawTitle: { color: C.TEXT, fontSize: 13, fontWeight: '600' },
  drawPrice: { color: C.GREY, fontSize: 11 },
  yourTickets: {
    backgroundColor: C.PURPLE_LIGHT,
    borderWidth: 1,
    borderColor: C.PURPLE,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  yourTicketsText: { color: C.PURPLE, fontSize: 10, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    gap: S.sm,
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
    backgroundColor: C.BG,
  },
  chatInput: {
    flex: 1,
    backgroundColor: C.CARD,
    borderRadius: 999,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    color: C.TEXT,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  sendBtn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingHorizontal: S.lg,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 14 },
});
