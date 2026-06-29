import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
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
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Please enter your name';
    if (!email.includes('@')) e.email = 'Please enter a valid email';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!agreed) e.terms = 'You must agree to the Terms of Service';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Navigate directly for now — Amplify signUp would go here
      navigation.navigate('Interests');
    } catch (err: any) {
      setErrors({ form: err.message ?? 'Sign up failed' });
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !name || !email || !password || !agreed || loading;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>DRAWN</Text>
          </View>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join thousands winning luxury items for pennies.</Text>

          {errors.form && <Text style={styles.errorBanner}>{errors.form}</Text>}

          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="Your name"
              placeholderTextColor={C.MUTED}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="you@example.com"
              placeholderTextColor={C.MUTED}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="Min. 8 characters"
              placeholderTextColor={C.MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreed(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I agree to DRAWN's{' '}
              <Text style={styles.link}>Terms of Service</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={styles.fieldError}>{errors.terms}</Text>}

          <TouchableOpacity
            style={[styles.btn, isDisabled && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isDisabled}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  content: { padding: S.xl, paddingBottom: S.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: S.xxl },
  backBtn: { marginRight: S.md },
  backText: { color: C.GREY, fontSize: 15 },
  logo: { fontFamily: 'serif', fontSize: 22, fontStyle: 'italic', color: C.PURPLE, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: C.TEXT, marginBottom: S.sm },
  subtitle: { fontSize: 14, color: C.GREY, marginBottom: S.xxl },
  errorBanner: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderWidth: 1,
    borderColor: C.RED,
    borderRadius: 8,
    padding: S.md,
    color: C.RED,
    fontSize: 13,
    marginBottom: S.lg,
  },
  field: { marginBottom: S.lg },
  label: { color: C.GREY, fontSize: 12, fontWeight: '600', marginBottom: S.xs, letterSpacing: 0.5 },
  input: {
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.BORDER,
    borderRadius: 10,
    padding: S.lg,
    color: C.TEXT,
    fontSize: 15,
  },
  inputError: { borderColor: C.RED },
  fieldError: { color: C.RED, fontSize: 11, marginTop: S.xs },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginBottom: S.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: C.PURPLE,
    borderColor: C.PURPLE,
  },
  checkmark: { color: C.WHITE, fontSize: 13, fontWeight: '800' },
  checkboxText: { color: C.GREY, fontSize: 13, flex: 1 },
  link: { color: C.PURPLE, textDecorationLine: 'underline' },
  btn: {
    backgroundColor: C.PURPLE,
    borderRadius: 999,
    paddingVertical: S.lg,
    alignItems: 'center',
    marginTop: S.xl,
    marginBottom: S.lg,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: C.WHITE, fontWeight: '700', fontSize: 16 },
  loginLink: { alignItems: 'center', paddingVertical: S.sm },
  loginLinkText: { color: C.GREY, fontSize: 14 },
});
