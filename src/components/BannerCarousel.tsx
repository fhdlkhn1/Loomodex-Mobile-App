import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LMX, shadow } from '../theme';
import type { HomeBanner } from '../api/products';

const AUTO_MS = 5000;

/** Admin-managed homepage banners: swipeable, auto-advancing every 5 s, with dots. */
export function BannerCarousel({ banners, onPress }: { banners: HomeBanner[]; onPress: (b: HomeBanner) => void }) {
  const slides = banners.slice(0, 5);
  const ref = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [idx, setIdx] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Auto-advance (restarts after every manual swipe; paused while the finger is down)
  useEffect(() => {
    if (slides.length < 2 || !width || dragging) return;
    const t = setTimeout(() => {
      const next = (idx + 1) % slides.length;
      ref.current?.scrollTo({ x: next * width, animated: true });
      setIdx(next);
    }, AUTO_MS);
    return () => clearTimeout(t);
  }, [idx, width, dragging, slides.length]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setIdx(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const height = width ? Math.round(width / 2) : 0;

  return (
    <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: LMX.surfaceAlt, ...shadow('md') }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => setDragging(true)}
          onScrollEndDrag={() => setDragging(false)}
          onMomentumScrollEnd={onEnd}
          scrollEventThrottle={16}
        >
          {slides.map((b, i) => (
            <Pressable key={`${i}-${b.image}`} onPress={() => onPress(b)} disabled={b.link_type === 'none'} style={{ width, height }}
              accessibilityRole={b.link_type === 'none' ? 'image' : 'button'} accessibilityLabel={b.title || undefined}>
              {/* The banner design carries its own text — the title is only the accessibility label. */}
              <ExpoImage source={{ uri: b.image }} style={{ width, height }} contentFit="cover" transition={200} cachePolicy="memory-disk" />
            </Pressable>
          ))}
        </ScrollView>
      )}
      {slides.length > 1 && (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {slides.map((_, i) => (
            <View key={i} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.55)' }} />
          ))}
        </View>
      )}
      {!width && <View style={{ aspectRatio: 2 }} />}
    </View>
  );
}
