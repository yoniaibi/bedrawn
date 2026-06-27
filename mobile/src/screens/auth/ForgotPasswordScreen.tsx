import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.includes('@')) return;
    setLoading(true);
    await new Promise(res => setTimeout(res, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {!sent ? (
            <>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a link to reset your password.
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.MUTED}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.btn, (!email.includes('@') || loading) && styles.btnDisabled]}
                onPress={handleSend}
                disabled={!email.includes('@') || loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>📬</Text>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We sent a reset link to{' '}
                <Text style={styles.emailHighlight}>{email}</Text>. It may take a minute.
              </Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.btnText}>Back to login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSend} style={styles.resendBtn}>
                <Text style={styles.resendText}>Resend email</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  content: { flex: 1, padding: S.xl },
  backBtn: { marginBottom: S.xxl },
  backText: { color: C.GREY, fontSize: 15 },
  title: { fontSize: 26, fontWeight: '800', color: C.WHITE, marginBottom: S.sm },
  subtitle: { fontSize: 14, color: C.GREY, lineHeight: 20, marginBottom: S.xxl },
  emailHighlight: { color: C.PURPLE, fontWeight: '700' },
  label: { color: C.GREY, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: S.xs },
  input: {
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.BORDER,
    borderRadius: 10,
    padding: S.lg,
    color: C.WHITE,
    fontSize: 15,
    marginBottom: S.xl,
  },
  btn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successEmoji: { fontSize: 56, marginBottom: S.xl },
  resendBtn: { marginTop: S.lg, paddingVertical: S.sm },
  resendText: { color: C.MUTED, fontSize: 14 },
});
