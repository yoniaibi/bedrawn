import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import { isEnabled } from '../config/featureFlags';
import { Draw } from '../data/mockData';
import { AccountScreen } from '../screens/account/AccountScreen';
import { NotificationsScreen } from '../screens/account/NotificationsScreen';
import { OrdersScreen } from '../screens/account/OrdersScreen';
import { SavedDrawsScreen } from '../screens/account/SavedDrawsScreen';
import { SearchScreen } from '../screens/account/SearchScreen';
import { SettingsScreen } from '../screens/account/SettingsScreen';
import { WalletScreen } from '../screens/account/WalletScreen';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { DrawDetailScreen } from '../screens/draw/DrawDetailScreen';
import { DrawsHistoryScreen } from '../screens/draw/DrawsHistoryScreen';
import { PurchaseScreen } from '../screens/draw/PurchaseScreen';
import { PurchaseSuccessScreen } from '../screens/draw/PurchaseSuccessScreen';
import { GrandDrawScreen } from '../screens/grand-draw/GrandDrawScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PrivacyScreen } from '../screens/legal/PrivacyScreen';
import { ProfileScreen } from '../screens/account/ProfileScreen';
import { TermsScreen } from '../screens/legal/TermsScreen';
import { LiveScreen } from '../screens/live/LiveScreen';
import { BecomeSellerScreen } from '../screens/seller/BecomeSellerScreen';
import { ListItemScreen } from '../screens/seller/ListItemScreen';
import { SellerDashboardScreen } from '../screens/seller/SellerDashboardScreen';
import { SellerProfileScreen } from '../screens/seller/SellerProfileScreen';
import { TicketsScreen } from '../screens/tickets/TicketsScreen';
import { C } from '../theme/colors';

export type DrawStackParamList = {
  DrawDetail: { draw: Draw };
  Purchase: { draw: Draw };
  PurchaseSuccess: { draw: Draw; ticketCount: number; totalPence: number };
  SellerProfile: { sellerId: string };
};

// Home stack
export type HomeStackParamList = {
  HomeMain: undefined;
  Search: undefined;
  Categories: undefined;
} & DrawStackParamList;

// Live stack
export type LiveStackParamList = {
  LiveMain: undefined;
} & DrawStackParamList;

// Tickets stack
export type TicketsStackParamList = {
  TicketsMain: undefined;
} & DrawStackParamList;

// Grand Draw stack
export type GrandDrawStackParamList = {
  GrandDrawMain: undefined;
};

// Account stack
export type AccountStackParamList = {
  AccountMain: undefined;
  Wallet: undefined;
  Orders: undefined;
  SavedDraws: undefined;
  Notifications: undefined;
  DrawsHistory: undefined;
  BecomeSeller: undefined;
  ListItem: undefined;
  SellerDashboard: undefined;
  Settings: undefined;
  Profile: undefined;
  Terms: undefined;
  Privacy: undefined;
} & DrawStackParamList;

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const LiveStack = createNativeStackNavigator<LiveStackParamList>();
const TicketsStack = createNativeStackNavigator<TicketsStackParamList>();
const GrandDrawStack = createNativeStackNavigator<GrandDrawStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: C.BG },
  animation: 'slide_from_right' as const,
};

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Search" component={SearchScreen} />
      <HomeStack.Screen name="Categories" component={CategoriesScreen} />
      <HomeStack.Screen name="DrawDetail" component={DrawDetailScreen} />
      <HomeStack.Screen name="Purchase" component={PurchaseScreen} />
      <HomeStack.Screen name="PurchaseSuccess" component={PurchaseSuccessScreen} />
      <HomeStack.Screen name="SellerProfile" component={SellerProfileScreen} />
    </HomeStack.Navigator>
  );
}

function LiveStackNav() {
  return (
    <LiveStack.Navigator screenOptions={screenOptions}>
      <LiveStack.Screen name="LiveMain" component={LiveScreen} />
      <LiveStack.Screen name="DrawDetail" component={DrawDetailScreen} />
      <LiveStack.Screen name="Purchase" component={PurchaseScreen} />
      <LiveStack.Screen name="PurchaseSuccess" component={PurchaseSuccessScreen} />
      <LiveStack.Screen name="SellerProfile" component={SellerProfileScreen} />
    </LiveStack.Navigator>
  );
}

function TicketsStackNav() {
  return (
    <TicketsStack.Navigator screenOptions={screenOptions}>
      <TicketsStack.Screen name="TicketsMain" component={TicketsScreen} />
      <TicketsStack.Screen name="DrawDetail" component={DrawDetailScreen} />
      <TicketsStack.Screen name="Purchase" component={PurchaseScreen} />
      <TicketsStack.Screen name="PurchaseSuccess" component={PurchaseSuccessScreen} />
      <TicketsStack.Screen name="SellerProfile" component={SellerProfileScreen} />
    </TicketsStack.Navigator>
  );
}

function GrandDrawStackNav() {
  return (
    <GrandDrawStack.Navigator screenOptions={screenOptions}>
      <GrandDrawStack.Screen name="GrandDrawMain" component={GrandDrawScreen} />
    </GrandDrawStack.Navigator>
  );
}

function AccountStackNav() {
  return (
    <AccountStack.Navigator screenOptions={screenOptions}>
      <AccountStack.Screen name="AccountMain" component={AccountScreen} />
      <AccountStack.Screen name="Wallet" component={WalletScreen} />
      <AccountStack.Screen name="Orders" component={OrdersScreen} />
      <AccountStack.Screen name="SavedDraws" component={SavedDrawsScreen} />
      <AccountStack.Screen name="Notifications" component={NotificationsScreen} />
      <AccountStack.Screen name="BecomeSeller" component={BecomeSellerScreen} />
      <AccountStack.Screen name="ListItem" component={ListItemScreen} />
      <AccountStack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
      <AccountStack.Screen name="Settings" component={SettingsScreen} />
      <AccountStack.Screen name="Profile" component={ProfileScreen} />
      <AccountStack.Screen name="Terms" component={TermsScreen} />
      <AccountStack.Screen name="Privacy" component={PrivacyScreen} />
      <AccountStack.Screen name="DrawsHistory" component={DrawsHistoryScreen} />
      <AccountStack.Screen name="DrawDetail" component={DrawDetailScreen} />
      <AccountStack.Screen name="Purchase" component={PurchaseScreen} />
      <AccountStack.Screen name="PurchaseSuccess" component={PurchaseSuccessScreen} />
      <AccountStack.Screen name="SellerProfile" component={SellerProfileScreen} />
    </AccountStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const iconMap: Record<string, string> = {
    Home:       '⊙',
    Live:       '◉',
    Tickets:    '◈',
    GrandDraw:  '◆',
    Account:    '○',
  };
  return (
    <View style={{
      width: 28, height: 28, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: focused ? C.PURPLE_LIGHT : 'transparent',
    }}>
      <Text style={{ fontSize: 13, color: focused ? C.PURPLE : C.MUTED, fontWeight: '700' }}>
        {iconMap[label] ?? '○'}
      </Text>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.WHITE,
          borderTopColor: C.BORDER,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: C.PURPLE,
        tabBarInactiveTintColor: C.MUTED,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Live"
        component={LiveStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Live" focused={focused} /> }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketsStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Tickets" focused={focused} /> }}
      />
      {isEnabled('GRAND_DRAW') && (
        <Tab.Screen
          name="Grand Draw"
          component={GrandDrawStackNav}
          options={{ tabBarIcon: ({ focused }) => <TabIcon label="GrandDraw" focused={focused} /> }}
        />
      )}
      <Tab.Screen
        name="Account"
        component={AccountStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Account" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
