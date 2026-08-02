import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { LMX, FONT, sans, mono, shadow } from '../theme';
import { Icon } from '../Icon';

const ICON = require('../../assets/icon.png');

export function ScreenSplash() {
  const nav = useNavigation<any>();
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(progress, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ]).start();
    // Straight to the home page — customers browse and check out as guests, no login gate.
    const t = setTimeout(() => nav.replace('Main'), 2400);
    return () => clearTimeout(t);
  }, []);

  const barW = progress.interpolate({ inputRange: [0, 1], outputRange: ['4%', '100%'] });

  return (
    <View style={{ flex: 1, backgroundColor: '#0A1426' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0B1224', '#0A1322', '#0B1018']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {/* ambient glows */}
      <View style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: '#0EA5E9', opacity: 0.18 }} />
      <View style={{ position: 'absolute', bottom: 40, left: -70, width: 300, height: 300, borderRadius: 150, backgroundColor: '#F37524', opacity: 0.16 }} />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: rise }] }}>
          <View style={{ ...shadow('lg'), shadowColor: '#0EA5E9', shadowOpacity: 0.35, borderRadius: 36 }}>
            <Image source={ICON} style={{ width: 156, height: 156, borderRadius: 36 }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28 }}>
            <Text style={{ fontFamily: sans(700), fontSize: 30, letterSpacing: 2, color: '#EDF1F7' }}>LOOMODE</Text>
            <Text style={{ fontFamily: sans(700), fontSize: 30, letterSpacing: 2, color: LMX.brand }}>X</Text>
          </View>
          <LinearGradient colors={['#F37524', '#0EA5E9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3, width: 150, borderRadius: 2, marginTop: 4 }} />

          <Text style={{ fontFamily: FONT.displayItalic, fontSize: 18, color: 'rgba(237,241,247,0.72)', marginTop: 20, textAlign: 'center' }}>
            Le marché de Guinée, à votre porte.
          </Text>
        </Animated.View>
      </View>

      {/* progress + footer */}
      <View style={{ paddingHorizontal: 40, paddingBottom: 48 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <Animated.View style={{ width: barW, height: '100%' }}>
            <LinearGradient colors={['#F37524', '#0EA5E9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 2 }} />
          </Animated.View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="shield" size={14} color="rgba(237,241,247,0.6)" />
            <Text style={{ fontSize: 12, color: 'rgba(237,241,247,0.6)', fontFamily: sans(500) }}>Paiement à la livraison</Text>
          </View>
          <Text style={{ color: 'rgba(237,241,247,0.3)' }}>·</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="truck" size={14} color="rgba(237,241,247,0.6)" />
            <Text style={{ fontSize: 12, color: 'rgba(237,241,247,0.6)', fontFamily: sans(500) }}>Livraison 3h–48h</Text>
          </View>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'rgba(237,241,247,0.32)', fontFamily: mono(400), letterSpacing: 1 }}>v1.0 · Conakry</Text>
      </View>
    </View>
  );
}
