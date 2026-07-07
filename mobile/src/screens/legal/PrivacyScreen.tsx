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
import { C } from '../../theme/colors';
import { S } from '../../theme/spacing';

const SECTIONS = [
  {
    heading: '1. Who We Are',
    body: 'bedrawn ("we", "us", "our") is a trading name of Drawn Ltd, registered in England and Wales. We operate the bedrawn mobile application ("the App"). This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our App.',
  },
  {
    heading: '2. Data We Collect',
    body: 'We collect the following types of personal data:\n\n• Account data: name, email address, password (hashed), and profile information you provide.\n• Transaction data: ticket purchases, wallet top-ups, draw entries, and order history.\n• Usage data: how you interact with the App, pages viewed, features used.\n• Device data: device type, operating system, push notification token.\n• Communications: messages you send via in-app chat, support tickets.',
  },
  {
    heading: '3. How We Use Your Data',
    body: 'We use your data to:\n\n• Provide, maintain, and improve the App and its features.\n• Process payments and manage your wallet.\n• Conduct draws and notify you of results.\n• Send transactional communications (receipts, win notifications).\n• Send marketing communications (only with your consent).\n• Comply with legal obligations, including anti-fraud and KYC requirements.\n• Analyse App performance and user behaviour to improve the platform.',
  },
  {
    heading: '4. Legal Basis (UK GDPR)',
    body: 'We process your data under the following legal bases:\n\n• Contract: to provide the services you signed up for.\n• Legitimate interests: to improve our platform, prevent fraud, and ensure security.\n• Legal obligation: to comply with applicable laws.\n• Consent: for marketing emails and optional analytics. You may withdraw consent at any time.',
  },
  {
    heading: '5. Data Sharing',
    body: 'We share your data with:\n\n• Payment processors (Stripe) to handle transactions.\n• Shipping partners to fulfil prize deliveries.\n• Cloud infrastructure providers (AWS) for hosting.\n• Analytics providers (anonymised where possible).\n• Law enforcement or regulators when legally required.\n\nWe do not sell your personal data to third parties.',
  },
  {
    heading: '6. Data Retention',
    body: 'We retain your account data for as long as your account is active, plus 7 years for financial records (legal requirement). Usage data is retained for 24 months. You can request deletion of your account and associated data at any time by contacting privacy@bedrawn.app.',
  },
  {
    heading: '7. Your Rights',
    body: 'Under UK GDPR, you have the right to:\n\n• Access: request a copy of the data we hold about you.\n• Rectification: correct inaccurate data.\n• Erasure: request deletion of your data ("right to be forgotten").\n• Portability: receive your data in a structured, machine-readable format.\n• Objection: object to processing based on legitimate interests.\n• Restriction: request limited processing of your data.\n\nTo exercise any right, contact privacy@bedrawn.app.',
  },
  {
    heading: '8. Cookies and Tracking',
    body: 'Our mobile App does not use browser cookies. We use anonymised analytics to understand App usage patterns. You can opt out of analytics in Settings.',
  },
  {
    heading: '9. Security',
    body: 'We take data security seriously. We use industry-standard encryption (TLS 1.3), hashed passwords, and access controls. In the event of a data breach that poses a risk to your rights, we will notify you and the ICO within 72 hours as required by law.',
  },
  {
    heading: '10. International Transfers',
    body: 'Your data may be processed by our AWS infrastructure in the European Economic Area (EEA). Where data is transferred outside the UK or EEA, we ensure appropriate safeguards are in place (such as Standard Contractual Clauses).',
  },
  {
    heading: '11. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of material changes via the App or by email. Continued use of the App after changes constitutes acceptance.',
  },
  {
    heading: '12. Contact and Complaints',
    body: 'For privacy-related queries, contact: privacy@bedrawn.app or write to our Data Protection Officer at Drawn Ltd, 100 Oxford Street, London, W1D 1LL.\n\nIf you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner\'s Office (ICO) at ico.org.uk.',
  },
];

export function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: 1 June 2026</Text>

        {SECTIONS.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Drawn Ltd. All rights reserved.</Text>
          <Text style={styles.footerSub}>Registered in England and Wales</Text>
        </View>
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
  lastUpdated: { color: C.MUTED, fontSize: 12, marginBottom: S.xl },
  section: { marginBottom: S.xxl },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: C.TEXT,
    marginBottom: S.sm,
  },
  sectionBody: {
    color: C.GREY,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: { borderTopWidth: 1, borderTopColor: C.BORDER, paddingTop: S.xl, alignItems: 'center' },
  footerText: { color: C.MUTED, fontSize: 12 },
  footerSub: { color: C.MUTED, fontSize: 11, marginTop: 4 },
});
