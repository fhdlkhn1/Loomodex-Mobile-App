import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleProp, ViewStyle } from 'react-native';
import { LMX, sans } from '../theme';
import { Icon, IconName } from '../Icon';
import { Button } from '../components';
import { t } from '../i18n';

/** Error card with a clear title, the friendly message and a "Réessayer" button. */
export function ErrorState({
  title = t('Problème de connexion'), message, onRetry, icon = 'refresh', retrying, style,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  icon?: IconName;
  retrying?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ alignItems: 'center', paddingHorizontal: 28, paddingVertical: 32, gap: 10 }, style]}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <Icon name={icon} size={24} color={LMX.rose} />
      </View>
      <Text style={{ fontSize: 16, fontFamily: sans(700), color: LMX.ink, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center', lineHeight: 19 }}>{message}</Text>
      {onRetry && (
        <Button variant="accent" size="md" icon="refresh" onPress={onRetry} disabled={retrying} style={{ marginTop: 8, minWidth: 160 }}>
          {retrying ? t('Chargement…') : t('Réessayer')}
        </Button>
      )}
    </View>
  );
}

/** Pulsing grey block used for loading placeholders. */
export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const op = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.5, duration: 650, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ backgroundColor: LMX.ink10, borderRadius: 10, opacity: op }, style]} />;
}

/** Placeholder for a horizontal product rail (section title + 3 cards). */
export function SkeletonRail() {
  return (
    <View style={{ backgroundColor: LMX.surface, marginTop: 8, paddingTop: 18, paddingBottom: 16 }}>
      <SkeletonBlock style={{ width: 150, height: 16, marginLeft: 16, marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, overflow: 'hidden' }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{ width: 160, gap: 8 }}>
            <SkeletonBlock style={{ width: 160, height: 160, borderRadius: LMX.r.lg }} />
            <SkeletonBlock style={{ width: 130, height: 12 }} />
            <SkeletonBlock style={{ width: 90, height: 14 }} />
          </View>
        ))}
      </View>
    </View>
  );
}
