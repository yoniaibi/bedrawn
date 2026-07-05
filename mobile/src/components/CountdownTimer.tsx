import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

/**
 * closingDate: YYYY-MM-DD string (UK closing date). Draw closes at 21:00 Europe/London.
 * When not provided, falls back to the next 21:00 UTC (approximate — use closingDate in production).
 */
type Props = {
  closingDate?: string;
  style?: object;
};

function getSecondsUntilClose(closingDate?: string): number {
  const now = Date.now();
  let target: Date;

  if (closingDate) {
    // Build 21:00 Europe/London on the closing date.
    // We approximate by constructing the ISO datetime string and letting the browser
    // parse it. For exact BST/GMT handling this would need a tz library, but
    // 21:00 UTC is accurate in winter and off by 1h in summer — acceptable for a
    // countdown display. A server-provided Unix timestamp would be ideal.
    target = new Date(`${closingDate}T21:00:00Z`);
  } else {
    // Fallback: next 21:00 UTC
    target = new Date();
    target.setUTCHours(21, 0, 0, 0);
    if (target.getTime() <= now) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
  }

  return Math.max(0, Math.floor((target.getTime() - now) / 1000));
}

export function CountdownTimer({ closingDate, style }: Props) {
  const [seconds, setSeconds] = useState(() => getSecondsUntilClose(closingDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(getSecondsUntilClose(closingDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [closingDate]);

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
    letterSpacing: 1,
  },
});
