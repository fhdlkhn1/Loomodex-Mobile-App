import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Animated, useWindowDimensions, StatusBar } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture, FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { sans, mono } from '../theme';
import { Icon } from '../Icon';
import { t } from '../i18n';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** One zoomable page: pinch (around the fingers), double-tap zoom, pan while zoomed. */
function ZoomableImage({ uri, width, height, active, onZoomChange }: {
  uri: string; width: number; height: number; active: boolean; onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const st = useRef({ s: 1, x: 0, y: 0, s0: 1, x0: 0, y0: 0, fx: 0, fy: 0 }).current;
  const [zoomed, setZoomed] = useState(false);
  const zoomedRef = useRef(false);

  const markZoom = (z: boolean) => {
    if (zoomedRef.current === z) return;
    zoomedRef.current = z;
    setZoomed(z);
    onZoomChange(z);
  };

  const bound = (x: number, y: number, s: number): [number, number] => {
    const mx = (width * (s - 1)) / 2;
    const my = (height * (s - 1)) / 2;
    return [clamp(x, -mx, mx), clamp(y, -my, my)];
  };

  const apply = (s: number, x: number, y: number) => {
    st.s = s; st.x = x; st.y = y;
    scale.setValue(s); tx.setValue(x); ty.setValue(y);
  };

  const animateTo = (s: number, x: number, y: number) => {
    st.s = s; st.x = x; st.y = y;
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: true, friction: 8 }),
      Animated.spring(tx, { toValue: x, useNativeDriver: true, friction: 8 }),
      Animated.spring(ty, { toValue: y, useNativeDriver: true, friction: 8 }),
    ]).start();
    markZoom(s > 1.01);
  };

  // Leaving the page resets its zoom
  useEffect(() => {
    if (!active && st.s !== 1) { apply(1, 0, 0); markZoom(false); }
  }, [active]);

  const gesture = useMemo(() => {
    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onStart(e => {
        st.s0 = st.s; st.x0 = st.x; st.y0 = st.y;
        st.fx = e.focalX - width / 2; st.fy = e.focalY - height / 2;
      })
      .onUpdate(e => {
        const s = clamp(st.s0 * e.scale, 1, MAX_SCALE);
        const k = s / st.s0;
        const [x, y] = bound(st.fx - (st.fx - st.x0) * k, st.fy - (st.fy - st.y0) * k, s);
        apply(s, x, y);
      })
      .onEnd(() => {
        if (st.s < 1.05) animateTo(1, 0, 0);
        else markZoom(true);
      });

    const pan = Gesture.Pan()
      .runOnJS(true)
      .enabled(zoomed)
      .maxPointers(1)
      .onStart(() => { st.x0 = st.x; st.y0 = st.y; })
      .onUpdate(e => {
        const [x, y] = bound(st.x0 + e.translationX, st.y0 + e.translationY, st.s);
        apply(st.s, x, y);
      });

    const doubleTap = Gesture.Tap()
      .runOnJS(true)
      .numberOfTaps(2)
      .onEnd(e => {
        if (st.s > 1.01) { animateTo(1, 0, 0); return; }
        const fx = e.x - width / 2;
        const fy = e.y - height / 2;
        const [x, y] = bound(-fx * (DOUBLE_TAP_SCALE - 1), -fy * (DOUBLE_TAP_SCALE - 1), DOUBLE_TAP_SCALE);
        animateTo(DOUBLE_TAP_SCALE, x, y);
      });

    return Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));
  }, [zoomed, width, height]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height, overflow: 'hidden' }} collapsable={false}>
        <Animated.View style={{ width, height, transform: [{ translateX: tx }, { translateY: ty }, { scale }] }}>
          <ExpoImage source={{ uri }} style={{ width, height }} contentFit="contain" transition={120} cachePolicy="memory-disk" />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/**
 * Full-screen photo viewer: swipe between all images, pinch / double-tap to zoom,
 * pan while zoomed, "3/10" counter and a close button.
 */
export function ImageViewer({ images, index, visible, onClose, onIndexChange }: {
  images: string[];
  index: number;
  visible: boolean;
  onClose: () => void;
  onIndexChange?: (i: number) => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [cur, setCur] = useState(index);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (visible) { setCur(index); setZoomed(false); }
  }, [visible, index]);

  const close = () => { onIndexChange?.(cur); onClose(); };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={close} statusBarTranslucent supportedOrientations={['portrait']}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" />
        <FlatList
          data={images}
          keyExtractor={(u, i) => `${i}-${u}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!zoomed}
          initialScrollIndex={Math.min(Math.max(index, 0), Math.max(images.length - 1, 0))}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={e => setCur(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item, index: i }) => (
            <ZoomableImage uri={item} width={width} height={height} active={i === cur} onZoomChange={setZoomed} />
          )}
        />
        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontFamily: mono(600), fontSize: 13 }}>{images.length ? `${cur + 1}/${images.length}` : '0/0'}</Text>
          </View>
          <Pressable onPress={close} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={20} color="#fff" />
          </Pressable>
        </View>
        {!zoomed && images.length > 0 && (
          <View pointerEvents="none" style={{ position: 'absolute', bottom: insets.bottom + 18, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11.5, fontFamily: sans(500) }}>{t('Pincez ou touchez deux fois pour zoomer')}</Text>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}
