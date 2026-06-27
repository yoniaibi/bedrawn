import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme/colors';
import { S } from '../theme/spacing';

type Props = {
  messages: string[];
};

export function ActivityTicker({ messages }: Props) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setIndex(prev => (prev + 1) % messages.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [messages, opacity]);

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Animated.Text style={[styles.text, { opacity }]} numberOfLines={1}>
        {messages[index]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.CARD,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: 8,
    gap: S.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.GREEN,
  },
  text: {
    color: C.GREY,
    fontSize: 12,
    flex: 1,
  },
});
