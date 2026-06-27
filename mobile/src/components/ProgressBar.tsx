import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { C } from '../theme/colors';

type Props = {
  percent: number;
  height?: number;
};

export function ProgressBar({ percent, height = 4 }: Props) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(Math.max(percent, 0), 100),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percent, widthAnim]);

  const fillColor = percent >= 85 ? C.RED : C.PURPLE;

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: C.BORDER,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
