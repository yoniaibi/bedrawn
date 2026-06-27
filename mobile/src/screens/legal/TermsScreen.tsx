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
    heading: '1. Introduction',
    body: 'Welcome to DRAWN ("the Platform", "we", "us", or "our"). These Terms of Service ("Terms") govern your access to and use of our mobile application and services. By creating an account or using DRAWN, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.\n\nDRAWN is operated by Drawn Ltd, a company registered in England and Wales.',
  },
  {
    heading: '2. Eligibility',
    body: 'You must be at least 18 years of age to use DRAWN. By creating an account, you confirm that you are 18 or older. We reserve the right to request proof of age at any time. Draws on DRAWN constitute a genuine competition of skill, not a lottery or game of chance, in accordance with applicable UK law.',
  },
  {
    heading: '3. Draw Rules',
    body: 'Each draw is a competition with a fixed number of tickets. The winning ticket is selected at random from all valid ticket holders at the scheduled draw time (typically 9pm UK time). One ticket equals one entry. Sellers set ticket prices and total ticket numbers. DRAWN does not guarantee any minimum or maximum prize value. All draws are subject to a minimum ticket threshold; if not met, draws may be extended or cancelled and tickets refunded.',
  },
  {
    heading: '4. Postal Entries',
    body: 'In accordance with UK competition law, free postal entries are available for any draw. To submit a postal entry, send a postcard with your name, email address, and the draw title to: DRAWN Entries, PO Box 12345, London, EC1A 1AA. Postal entries are subject to the same odds as purchased ticket entries. One postal entry per draw per entrant.',
  },
  {
    heading: '5. Payments and Wallet',
    body: 'DRAWN operates a prepaid wallet system. You add funds to your wallet and use them to purchase draw tickets. Wallet funds are non-refundable except in cases where a draw is cancelled by the seller or platform. All payments are processed securely via our payment provider. DRAWN does not store card details.',
  },
  {
    heading: '6. Sellers',
    body: 'Sellers must be approved by DRAWN before listing items. By listing an item, sellers agree to (a) accurately describe items, (b) provide authentication documentation where required, (c) ship winning items promptly. Sellers may be liable for liquidated damages if they withdraw a listing after tickets have been sold. DRAWN reserves the right to remove any listing at its sole discretion.',
  },
  {
    heading: '7. Authenticity',
    body: 'DRAWN takes authenticity seriously. While we verify sellers and encourage authentication, DRAWN cannot guarantee the authenticity of every item. Buyers should review all provided documentation. In the event of a successful claim of inauthenticity within 30 days of receipt, DRAWN will investigate and may offer remedies at its discretion.',
  },
  {
    heading: '8. Prohibited Conduct',
    body: 'You may not: use bots, scripts, or automated tools to purchase tickets; create multiple accounts; attempt to manipulate draw outcomes; list counterfeit or stolen items; harass other users; or violate any applicable law. Violations may result in immediate account suspension and forfeiture of wallet funds.',
  },
  {
    heading: '9. Intellectual Property',
    body: 'All content on DRAWN, including logos, branding, and software, is owned by Drawn Ltd or its licensors. You may not reproduce, distribute, or create derivative works without written permission.',
  },
  {
    heading: '10. Limitation of Liability',
    body: 'To the fullest extent permitted by law, DRAWN shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount you paid in ticket purchases in the 3 months preceding the event giving rise to the claim.',
  },
  {
    heading: '11. Governing Law',
    body: 'These Terms are governed by the laws of England and Wales. Any disputes shall be resolved in the courts of England and Wales.',
  },
  {
    heading: '12. Changes to Terms',
    body: 'We may update these Terms from time to time. We will notify you of material changes via email or in-app notification. Continued use of DRAWN after changes constitutes acceptance of the updated Terms.',
  },
  {
    heading: '13. Contact',
    body: 'For questions about these Terms, please contact us at legal@drawn.app or write to: Drawn Ltd, 100 Oxford Street, London, W1D 1LL, United Kingdom.',
  },
];

export function TermsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
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
  title: { fontSize: 17, fontWeight: '700', color: C.WHITE },
  content: { padding: S.xl, paddingBottom: S.xxxl },
  lastUpdated: { color: C.MUTED, fontSize: 12, marginBottom: S.xl },
  section: { marginBottom: S.xxl },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: C.WHITE,
    marginBottom: S.sm,
  },
  sectionBody: {
    color: C.GREY,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: { borderTopWidth: 1, borderTopColor: C.BORDER, paddingTop: S.xl },
  footerText: { color: C.MUTED, fontSize: 12, textAlign: 'center' },
});
