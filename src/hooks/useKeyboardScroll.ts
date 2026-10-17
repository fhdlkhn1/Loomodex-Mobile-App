import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

/**
 * Keyboard handling shared by Screen, Sheet and the modal forms.
 *
 * Android is edge-to-edge (mandatory since SDK 54), so the window no longer shrinks when the
 * keyboard opens — the keyboard is drawn OVER the app. KeyboardAvoidingView with
 * behavior="padding" works on both platforms: it only pads by the part of its own frame the
 * keyboard really covers, so it is a no-op wherever the window did resize.
 */
export const KEYBOARD_BEHAVIOR = 'padding' as const;

/** Space kept between the focused field and the top of the keyboard. */
const GAP = 24;

type FocusListener = () => void;
const focusListeners = new Set<FocusListener>();

/**
 * Inputs call this from onFocus: when the user moves to another field while the keyboard is
 * already open there is no new keyboard event, so the scroll views re-check on focus instead.
 */
export function notifyInputFocus() {
  focusListeners.forEach(l => l());
}

/**
 * Keeps the focused TextInput of a ScrollView visible above the keyboard.
 * Returns the ref + onScroll handler to put on the ScrollView. Only the ScrollView that
 * actually contains the focused input scrolls (measureLayout fails for non-descendants), so a
 * sheet open over a screen never moves the screen behind it.
 */
export function useKeyboardScroll() {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  }, []);

  const reveal = useCallback((keyboardY: number) => {
    const sv = ref.current;
    const input = TextInput.State.currentlyFocusedInput() as any;
    if (!sv || !input || !keyboardY) return;
    const inner = (sv as any).getInnerViewRef?.();
    if (!inner || typeof input.measureLayout !== 'function') return;
    // Ancestry check: succeeds only when the input lives inside this ScrollView.
    input.measureLayout(inner, () => {
      input.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        const overflow = y + h + GAP - keyboardY;
        if (overflow > 0) sv.scrollTo({ y: offset.current + overflow, animated: true });
      });
    }, () => {});
  }, []);

  useEffect(() => {
    // Let KeyboardAvoidingView apply its padding first (Android pads on keyboardDidShow),
    // otherwise scrollTo is clamped to the old, taller viewport.
    const delay = Platform.OS === 'android' ? 160 : 60;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (keyboardY: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => reveal(keyboardY), delay);
    };
    const show = Keyboard.addListener('keyboardDidShow', e => schedule(e.endCoordinates.screenY));
    const onFocus: FocusListener = () => {
      const m = Keyboard.isVisible() ? Keyboard.metrics() : undefined;
      if (m) schedule(m.screenY);
    };
    focusListeners.add(onFocus);
    return () => {
      if (timer) clearTimeout(timer);
      show.remove();
      focusListeners.delete(onFocus);
    };
  }, [reveal]);

  return { ref, onScroll };
}
