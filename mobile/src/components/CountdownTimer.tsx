import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { C } from '../theme/colors';

function getSecondsUntilHour(targetHour: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, 0, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

type Props = {
  targetHour?: number;
  style?: object;
};

export function CountdownTimer({ targetHour = 21, style }: Props) {
  const [seconds, setSeconds] = useState(() => getSecondsUntilHour(targetHour));

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(getSecondsUntilHour(targetHour));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetHour]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const display = `${pad(h)}:${pad(m)}:${pad(s)}`;

  return (
    <Text style={[styles.text, style]}>{display}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
    color: C.WHITE,
    letterSpacing: 1,
  },
});
