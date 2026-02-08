import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ size = 'md' }: LogoProps) {
  const sizes = {
    sm: { container: 60, dSize: 48, emoji: 16, emojiOffset: 14 },
    md: { container: 80, dSize: 64, emoji: 20, emojiOffset: 18 },
    lg: { container: 120, dSize: 96, emoji: 28, emojiOffset: 28 },
  };

  const s = sizes[size];

  return (
    <View style={[styles.container, { width: s.container, height: s.container }]}>
      <Text style={[styles.dLetter, { fontSize: s.dSize }]}>D</Text>
      <Text style={[styles.emoji, styles.topLeft, { fontSize: s.emoji, top: -s.emojiOffset * 0.3, left: -s.emojiOffset * 0.3 }]}>
        {'\u{1F527}'}
      </Text>
      <Text style={[styles.emoji, styles.topRight, { fontSize: s.emoji, top: -s.emojiOffset * 0.3, right: -s.emojiOffset * 0.3 }]}>
        {'\u{1F528}'}
      </Text>
      <Text style={[styles.emoji, styles.bottomRight, { fontSize: s.emoji, bottom: -s.emojiOffset * 0.3, right: -s.emojiOffset * 0.3 }]}>
        {'\u{1FA9B}'}
      </Text>
      <Text style={[styles.emoji, styles.bottomLeft, { fontSize: s.emoji, bottom: -s.emojiOffset * 0.3, left: -s.emojiOffset * 0.3 }]}>
        {'\u{26CF}'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dLetter: {
    fontWeight: '900',
    color: colors.primary,
    textShadowColor: 'rgba(37, 99, 235, 0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  emoji: {
    position: 'absolute',
  },
  topLeft: {},
  topRight: {},
  bottomRight: {},
  bottomLeft: {},
});
