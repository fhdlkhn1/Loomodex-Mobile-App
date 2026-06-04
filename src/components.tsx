import React from 'react';
import {
  View, Text, Image, Pressable, ScrollView, TextInput, StyleProp, ViewStyle, TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, G, Circle, Text as SvgText } from 'react-native-svg';
import { LMX, FONT, sans, mono, shadow } from './theme';
import { Icon, IconName, CategoryGlyph } from './Icon';
import { IMG, Product, Category } from './data';

// ── Screen shell ───────────────────────────────────────────────
export function Screen({
  children, bg, footer, scroll = true, padTop = true, contentStyle,
}: {
  children: React.ReactNode;
  bg?: string;
  footer?: React.ReactNode;
  scroll?: boolean;
  padTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const top = padTop ? insets.top + 6 : 0;
  const bottomPad = (footer ? 96 : 24) + insets.bottom;
  return (
    <View style={{ flex: 1, backgroundColor: bg || LMX.bg }}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ paddingTop: top, paddingBottom: bottomPad }, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop: top }, contentStyle]}>{children}</View>
      )}
      {footer && (
        <View style={{
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 14,
          backgroundColor: LMX.bg, borderTopWidth: 1, borderTopColor: LMX.hairline,
        }}>
          {footer}
        </View>
      )}
    </View>
  );
}

// ── AppBar ─────────────────────────────────────────────────────
export function AppBar({
  left, right, title, overlay = false,
}: { left?: React.ReactNode; right?: React.ReactNode; title?: string | null; overlay?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
      overlay && { position: 'absolute', top: insets.top + 6, left: 0, right: 0, zIndex: 10 },
    ]}>
      <View style={{ minWidth: 40, flexDirection: 'row', alignItems: 'center' }}>{left}</View>
      {!!title && <Text style={{ fontFamily: sans(600), fontSize: 15, color: LMX.ink }}>{title}</Text>}
      <View style={{ minWidth: 40, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>{right}</View>
    </View>
  );
}

export function IconBtn({
  icon, badge, onPress, bg = 'transparent', size = 38, color = LMX.ink,
}: { icon: IconName; badge?: number; onPress?: () => void; bg?: string; size?: number; color?: string }) {
  return (
    <Pressable onPress={onPress} style={{
      width: size, height: size, borderRadius: 999, backgroundColor: bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={20} color={color} />
      {badge != null && (
        <View style={{
          position: 'absolute', top: 3, right: 3, minWidth: 16, height: 16, borderRadius: 8,
          backgroundColor: LMX.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
          borderWidth: 1.5, borderColor: LMX.bg,
        }}>
          <Text style={{ color: '#fff', fontSize: 9.5, fontFamily: mono(700) }}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Buttons ────────────────────────────────────────────────────
export function Button({
  children, variant = 'primary', size = 'md', icon, full, style, onPress, disabled,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'ghost' | 'soft' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const sizes = {
    sm: { h: 36, fs: 13, px: 14, r: 10 },
    md: { h: 48, fs: 14, px: 18, r: 14 },
    lg: { h: 56, fs: 15, px: 22, r: 16 },
  }[size];
  const variants: Record<string, { bg: string; fg: string; border?: string }> = {
    primary: { bg: LMX.ink, fg: '#fff' },
    accent: { bg: LMX.accent, fg: '#fff' },
    ghost: { bg: 'transparent', fg: LMX.ink, border: LMX.border },
    soft: { bg: LMX.surface, fg: LMX.ink, border: LMX.border },
    dark: { bg: LMX.ink, fg: '#fff' },
  };
  const v = variants[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[{
      height: sizes.h, borderRadius: sizes.r, paddingHorizontal: sizes.px,
      backgroundColor: v.bg, borderWidth: v.border ? 1 : 0, borderColor: v.border,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      opacity: disabled ? 0.5 : 1,
    }, full && { alignSelf: 'stretch' }, style]}>
      {typeof children === 'string'
        ? <Text style={{ color: v.fg, fontFamily: sans(600), fontSize: sizes.fs }}>{children}</Text>
        : children}
      {icon && <Icon name={icon} size={16} color={v.fg} />}
    </Pressable>
  );
}

// ── Price ──────────────────────────────────────────────────────
export function Price({
  value, was, size = 'md', color = LMX.ink,
}: { value: number; was?: number | null; size?: 'sm' | 'md' | 'lg' | 'xl'; color?: string }) {
  const sz = { sm: 13, md: 15, lg: 22, xl: 28 }[size];
  const f = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/[\u00A0\s,]/g, ' ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      <Text style={{ fontFamily: mono(600), fontSize: sz, color }}>
        {f(value)}
        <Text style={{ fontSize: sz * 0.55, color: LMX.ink50, fontFamily: sans(500) }}> GNF</Text>
      </Text>
      {was ? (
        <Text style={{ fontFamily: mono(400), fontSize: sz * 0.65, color: LMX.ink50, textDecorationLine: 'line-through' }}>
          {f(was)}
        </Text>
      ) : null}
    </View>
  );
}

export function Discount({ off }: { off: number }) {
  if (!off) return null;
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: LMX.ink }}>
      <Text style={{ color: '#fff', fontSize: 10, fontFamily: mono(700) }}>−{off}%</Text>
    </View>
  );
}

// ── ProductCard ────────────────────────────────────────────────
export function ProductCard({
  product, variant = 'grid', onPress,
}: { product: Product; variant?: 'grid' | 'list'; onPress?: () => void }) {
  if (variant === 'list') {
    return (
      <Pressable onPress={onPress} style={{
        flexDirection: 'row', gap: 12, padding: 10, backgroundColor: LMX.surface,
        borderRadius: LMX.r.lg, alignItems: 'center', borderWidth: 1, borderColor: LMX.border,
      }}>
        <Image source={{ uri: IMG(product.slug) }} style={{ width: 76, height: 76, borderRadius: 12, backgroundColor: LMX.surfaceAlt }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 10, color: LMX.ink50, marginBottom: 3, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: sans(500) }}>{product.seller}</Text>
          <Text numberOfLines={2} style={{ fontSize: 13.5, fontFamily: sans(500), color: LMX.ink, lineHeight: 18, marginBottom: 6 }}>{product.name}</Text>
          <Price value={product.price} was={product.was} size="sm" />
        </View>
      </Pressable>
    );
  }
  const isNew = product.reviews === 0 || product.reviews < 3;
  return (
    <Pressable onPress={onPress} style={{
      backgroundColor: LMX.surface, borderRadius: LMX.r.lg, overflow: 'hidden',
      borderWidth: 1, borderColor: LMX.border, flex: 1,
    }}>
      <View style={{ aspectRatio: 1, backgroundColor: LMX.surfaceAlt }}>
        <Image source={{ uri: IMG(product.slug) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {product.off > 0 && (
          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#FF7A00', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontFamily: mono(700) }}>−{product.off}%</Text>
          </View>
        )}
        <View style={{
          position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="heart" size={16} color={LMX.ink} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 10, paddingTop: 9, paddingBottom: 10 }}>
        {/* Verified / New badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: isNew ? '#EEF4FF' : '#DAF1E6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
            <Icon name={isNew ? 'sparkle' : 'shield'} size={9} color={isNew ? '#1E6BFF' : '#0E8A57'} />
            <Text style={{ fontSize: 9, fontFamily: sans(600), color: isNew ? '#1E6BFF' : '#0E8A57' }}>{isNew ? 'New Product' : 'Verified'}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={{ fontSize: 12.5, fontFamily: sans(500), color: LMX.ink, lineHeight: 17, marginBottom: 6, minHeight: 34 }}>{product.name}</Text>
        <Price value={product.price} was={product.was} size="md" />
        {/* Delivery info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Icon name="truck" size={10} color="#1E6BFF" />
          <Text style={{ fontSize: 9.5, color: '#1E6BFF', fontFamily: sans(500) }}>24–48h Conakry</Text>
        </View>
        {/* Buy Now button */}
        <Pressable onPress={onPress} style={{ marginTop: 8, backgroundColor: '#1E6BFF', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 11.5, fontFamily: sans(700) }}>Buy Now</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ── Section header ─────────────────────────────────────────────
export function SectionHeader({
  title, subtitle, action, displayType, onAction,
}: { title: string; subtitle?: string; action?: string; displayType?: boolean; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: displayType ? FONT.display : sans(600),
          fontSize: displayType ? 24 : 17, color: LMX.ink,
        }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 3 }}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ fontSize: 12, fontFamily: sans(500), color: LMX.ink70 }}>{action}</Text>
          <Icon name="chevR" size={12} color={LMX.ink70} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function CategoryChip({ cat, active, onPress }: { cat: Category; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', gap: 8, width: 68 }}>
      <View style={{
        width: 62, height: 62, borderRadius: 18, backgroundColor: cat.hue,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: active ? LMX.ink : 'transparent',
      }}>
        <CategoryGlyph id={cat.id} />
      </View>
      <Text style={{ fontSize: 11, fontFamily: sans(500), color: LMX.ink }}>{cat.label}</Text>
    </Pressable>
  );
}

export function Chip({ children, active, icon, onPress }: { children: React.ReactNode; active?: boolean; icon?: IconName; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{
      flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 999, backgroundColor: active ? LMX.ink : LMX.surface,
      borderWidth: active ? 0 : 1, borderColor: LMX.border,
    }}>
      {icon && <Icon name={icon} size={13} color={active ? '#fff' : LMX.ink} />}
      <Text style={{ fontSize: 12, fontFamily: sans(500), color: active ? '#fff' : LMX.ink }}>{children}</Text>
    </Pressable>
  );
}

// ── Form field ─────────────────────────────────────────────────
export function Field({
  label, value, onChangeText, prefix, trailingIcon, onTrailingPress,
  secure, keyboardType, autoCapitalize, placeholder,
}: {
  label: string;
  value?: string;
  onChangeText?: (v: string) => void;
  prefix?: string;
  trailingIcon?: IconName;
  onTrailingPress?: () => void;
  secure?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  placeholder?: string;
}) {
  const [internal, setInternal] = React.useState(value || '');
  const controlled = onChangeText !== undefined;
  const displayVal = controlled ? (value ?? '') : internal;

  return (
    <View>
      <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>{label}</Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface,
        borderWidth: 1, borderColor: LMX.border, borderRadius: 14, paddingHorizontal: 16, height: 54,
      }}>
        {prefix && (
          <>
            <Text style={{ fontFamily: mono(500), fontSize: 14, color: LMX.ink70 }}>{prefix}</Text>
            <View style={{ width: 1, height: 22, backgroundColor: LMX.hairline }} />
          </>
        )}
        <TextInput
          value={displayVal}
          onChangeText={controlled ? onChangeText : setInternal}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          placeholder={placeholder}
          placeholderTextColor={LMX.ink50}
          style={{ flex: 1, fontFamily: sans(400), fontSize: 15, color: LMX.ink, padding: 0 }}
        />
        {trailingIcon && (
          <Pressable onPress={onTrailingPress}>
            <Icon name={trailingIcon} size={18} color={LMX.ink50} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Toggle (static visual) ─────────────────────────────────────
export function Toggle({ on }: { on?: boolean }) {
  const [v, setV] = React.useState(!!on);
  return (
    <Pressable onPress={() => setV(!v)} style={{
      width: 40, height: 24, borderRadius: 12, backgroundColor: v ? LMX.ink : LMX.ink10, justifyContent: 'center',
    }}>
      <View style={{
        width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: v ? 18 : 2, ...shadow('sm'),
      }} />
    </Pressable>
  );
}

// ── Summary row ────────────────────────────────────────────────
export function SummaryRow({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const f = (n: number) => Math.abs(n).toLocaleString('fr-FR').replace(/[\u00A0,]/g, ' ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 13, color: LMX.ink70 }}>{label}</Text>
      <Text style={{ fontFamily: mono(600), fontSize: 13, color: accent ? LMX.emerald : LMX.ink }}>
        {value < 0 ? '−' : ''}{f(value)}<Text style={{ fontSize: 9, color: LMX.ink50 }}> GNF</Text>
      </Text>
    </View>
  );
}

// ── Setting row ────────────────────────────────────────────────
export function SettingRow({
  icon, label, sub, last, onPress,
}: { icon: IconName; label: string; sub?: string; last?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{
      paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline,
    }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={LMX.ink} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13.5, fontFamily: sans(500), color: LMX.ink }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 1 }}>{sub}</Text> : null}
      </View>
      <Icon name="chevR" size={14} color={LMX.ink50} />
    </Pressable>
  );
}

export function ActivePill({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 10, paddingRight: 8, paddingVertical: 5,
      borderRadius: 999, backgroundColor: LMX.accentSoft,
    }}>
      <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: LMX.accent }}>{children}</Text>
      <Icon name="close" size={12} color={LMX.accent} />
    </View>
  );
}

// ── Wordmark ───────────────────────────────────────────────────
export function Wordmark({ size = 'md', light }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const fs = size === 'lg' ? 30 : size === 'sm' ? 20 : 25;
  const ink = light ? '#fff' : LMX.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View style={{
        width: fs * 0.95, height: fs * 0.95, borderRadius: fs * 0.28,
        backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="bag" size={fs * 0.6} color="#fff" />
      </View>
      <Text style={{ fontFamily: FONT.display, fontSize: fs, color: ink }}>
        Loomo<Text style={{ color: LMX.accent }}>dex</Text>
      </Text>
    </View>
  );
}

// ── Faux street map ────────────────────────────────────────────
export function MapVisual() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 250" preserveAspectRatio="xMidYMid slice">
      <Rect width="360" height="250" fill="#EAE6DA" />
      <G stroke="#FAF7F1" strokeWidth="14" fill="none" strokeLinecap="round">
        <Path d="M-10,180 C 60,170 120,210 200,180 S 340,160 380,180" />
        <Path d="M-10,90 C 60,100 130,70 200,90 S 340,110 380,90" />
        <Path d="M50,-10 L70,260" />
        <Path d="M230,-10 L260,260" />
      </G>
      <G stroke="#F1ECDE" strokeWidth="6" fill="none" strokeLinecap="round">
        <Path d="M-10,40 L380,55" />
        <Path d="M-10,225 L380,235" />
        <Path d="M150,-10 L160,260" />
      </G>
      <G fill="#E0DBCE">
        <Rect x="90" y="20" width="50" height="55" rx="3" />
        <Rect x="170" y="20" width="50" height="55" rx="3" />
        <Rect x="270" y="20" width="60" height="55" rx="3" />
        <Rect x="90" y="105" width="50" height="60" rx="3" />
        <Rect x="170" y="105" width="55" height="60" rx="3" />
        <Rect x="270" y="105" width="60" height="60" rx="3" />
        <Rect x="80" y="195" width="65" height="50" rx="3" />
        <Rect x="170" y="195" width="55" height="50" rx="3" />
      </G>
      <Path d="M-10,260 Q 100,235 200,250 T 380,255 L380,270 L-10,270 Z" fill="#C9D8DA" />
      <Path d="M 60 220 C 100 200 130 160 180 150 S 260 130 280 110" stroke="#D94C1F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <G>
        <Circle cx="280" cy="110" r="14" fill="rgba(217,76,31,0.18)" />
        <Circle cx="280" cy="110" r="7" fill="#181612" />
        <Circle cx="280" cy="110" r="2.5" fill="#fff" />
      </G>
      <G>
        <Circle cx="60" cy="220" r="16" fill="#fff" stroke="#181612" strokeWidth="2" />
        <SvgText x="60" y="225" textAnchor="middle" fontSize="13" fill="#181612" fontWeight="700">M</SvgText>
      </G>
    </Svg>
  );
}

// ── small re-exports ───────────────────────────────────────────
export { Icon, CategoryGlyph };
