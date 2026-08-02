import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ImageBackground, ActivityIndicator, TextInput, Modal, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono, shadow, decodeEntities } from '../theme';
import { CATEGORIES as STATIC_CATS } from '../data';
import { Icon } from '../Icon';
import { CategoryGlyph } from '../Icon';
import {
  Screen, AppBar, IconBtn, Button, ProductCard, SectionHeader, CategoryChip, Chip, ActivePill, BellButton,
} from '../components';
import { productsApi, Product as ApiProduct } from '../api/products';
import { get } from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

// Homepage should surface PRODUCTS first, not categories. The category grid is hidden
// here (categories remain reachable via the menu drawer and the Categories tab).
// Flip to true to bring the homepage grid back.
const SHOW_HOME_CATEGORIES = false;

// "How to order" step illustrations (same images as the website)
const STEP_IMAGES = [
  require('../../assets/steps/step-1.png'),
  require('../../assets/steps/step-2.png'),
  require('../../assets/steps/step-3.png'),
  require('../../assets/steps/step-4.png'),
  require('../../assets/steps/step-5.png'),
  require('../../assets/steps/step-6.png'),
];

function TimePill({ v }: { v: string }) {
  return (
    <View style={{ backgroundColor: LMX.navy, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 }}>
      <Text style={{ fontFamily: sans(700), fontSize: 11, color: '#fff' }}>{v}</Text>
    </View>
  );
}

// Live flash-deals countdown — ticks every second, counts down to midnight (resets daily).
function FlashCountdown() {
  const calc = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);
    let diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    const h = Math.floor(diff / 3600); diff -= h * 3600;
    const m = Math.floor(diff / 60); const s = diff - m * 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return { h: pad(h), m: pad(m), s: pad(s) };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 }}>
      <TimePill v={t.h} /><Text style={{ color: LMX.ink50, fontSize: 11 }}>:</Text>
      <TimePill v={t.m} /><Text style={{ color: LMX.ink50, fontSize: 11 }}>:</Text>
      <TimePill v={t.s} />
    </View>
  );
}

function SectionRow({ icon, title, onViewAll }: { icon: string; title: string; onViewAll?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={{ fontSize: 16, fontFamily: sans(700), color: LMX.ink }}>{title}</Text>
      </View>
      <Pressable onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Text style={{ fontSize: 12, fontFamily: sans(500), color: LMX.brand }}>Voir tout</Text>
        <Icon name="chevR" size={12} color={LMX.brand} />
      </Pressable>
    </View>
  );
}

function useHomeData() {
  // Cached + deduped across navigations (TanStack Query) — no refetch on every visit
  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: async () => {
      const [cRes, aRes, fRes, nRes, tRes, ftRes] = await Promise.allSettled([
        get<{ categories: any[] }>('/categories'),
        productsApi.list({ per_page: 24 }),
        productsApi.flashDeals(),
        productsApi.newArrivals(),
        productsApi.trending(),
        productsApi.featured(),
      ]);
      return {
        cats:        (cRes.status === 'fulfilled' && cRes.value.categories?.length) ? cRes.value.categories : STATIC_CATS,
        all:         aRes.status === 'fulfilled' ? (aRes.value.products ?? []) : [],
        flashDeals:  fRes.status === 'fulfilled' ? (fRes.value.products ?? []) : [],
        newArrivals: nRes.status === 'fulfilled' ? (nRes.value.products ?? []) : [],
        trending:    tRes.status === 'fulfilled' ? (tRes.value.products ?? []) : [],
        featured:    ftRes.status === 'fulfilled' ? (ftRes.value.products ?? []) : [],
      };
    },
  });

  return {
    cats:        data?.cats ?? STATIC_CATS,
    all:         data?.all ?? [],
    flashDeals:  data?.flashDeals ?? [],
    newArrivals: data?.newArrivals ?? [],
    trending:    data?.trending ?? [],
    featured:    data?.featured ?? [],
    loading:     isLoading,
  };
}

// Map API product to the shape ProductCard expects
function apiToCard(p: ApiProduct) {
  return {
    id: String(p.id),
    name: decodeEntities(p.name),
    slug: p.slug,
    price: p.price,
    was: p.regular_price > p.price ? p.regular_price : null,
    off: p.off,
    cat: String(p.categories?.[0] ?? ''),
    seller: decodeEntities(p.seller),
    rating: p.rating,
    reviews: p.reviews,
    sold: p.sold,
    image: p.image,
    is_usa: p.is_usa,
    delivery_estimate: p.delivery_estimate,
  };
}

// Horizontal product rail backed by real API products (no static placeholders)
function ProductRail({ products, nav }: { products: ApiProduct[]; nav: any }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
      {products.slice(0, 12).map(p => (
        <View key={p.id} style={{ width: 160 }}>
          <ProductCard product={apiToCard(p) as any} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} />
        </View>
      ))}
    </ScrollView>
  );
}

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(SCREEN_W * 0.86, 360);

const MENU_SERVICES: { icon: any; label: string; route: string }[] = [
  { icon: 'truck',      label: 'Suivi de commande',   route: 'TrackEntry' },
  { icon: 'headset',    label: "Centre d'aide",       route: 'Help' },
  { icon: 'storefront', label: 'Vendre sur Loomodex', route: 'Seller' },
];

function MenuRow({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}>
      {children}
    </Pressable>
  );
}

function MenuDrawer({ visible, onClose, cats, nav }: { visible: boolean; onClose: () => void; cats: any[]; nav: any }) {
  const insets = useSafeAreaInsets();
  const { cart } = useCart();
  const tx = React.useRef(new Animated.Value(-PANEL_W)).current;
  const fade = React.useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(tx, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tx, { toValue: -PANEL_W, duration: 200, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) setMounted(false); });
    }
  }, [visible]);

  const go = (route: string, params?: any) => { onClose(); setTimeout(() => nav.navigate(route, params), 230); };

  if (!mounted) return null;

  const sectionLabel = { fontFamily: sans(700), fontSize: 11, color: LMX.ink50, letterSpacing: 0.8, marginBottom: 8, marginTop: 4 } as const;

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* Scrim */}
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,31,58,0.45)', opacity: fade }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Panel */}
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: PANEL_W, backgroundColor: LMX.surface, transform: [{ translateX: tx }], ...shadow('lg') }}>
          {/* Header */}
          <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
            <ExpoImage source={require('../../assets/logo.png')} style={{ width: 168, height: 38 }} contentFit="contain" />
            <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color={LMX.ink} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 24 }}>
            {/* Account + Cart cards */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
              <Pressable onPress={() => go('Account')} style={{ flex: 1, backgroundColor: LMX.brandSoft, borderRadius: 16, padding: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="user" size={18} color="#fff" />
                </View>
                <Text style={{ fontFamily: sans(700), fontSize: 13.5, color: LMX.ink }}>Mon compte</Text>
                <Text style={{ fontFamily: sans(400), fontSize: 11, color: LMX.ink50, marginTop: 2 }}>Gérer mes informations</Text>
              </Pressable>
              <Pressable onPress={() => go('Cart')} style={{ flex: 1, backgroundColor: LMX.accentSoft, borderRadius: 16, padding: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: LMX.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon name="bag" size={18} color="#fff" />
                  {cart.item_count > 0 && (
                    <View style={{ position: 'absolute', top: -5, right: -6, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: LMX.navy, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: LMX.accentSoft }}>
                      <Text style={{ color: '#fff', fontSize: 9, fontFamily: mono(700) }}>{cart.item_count}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: sans(700), fontSize: 13.5, color: LMX.ink }}>Mon panier</Text>
                <Text style={{ fontFamily: sans(400), fontSize: 11, color: LMX.ink50, marginTop: 2 }}>Voir mes articles</Text>
              </Pressable>
            </View>

            {/* Categories */}
            <Text style={sectionLabel}>CATÉGORIES</Text>
            {cats.map((cat: any) => {
              const id = cat.id ?? cat.slug;
              const label = decodeEntities(cat.name ?? cat.label ?? id).replace(/\n/g, ' ');
              return (
                <MenuRow key={id} onPress={() => go('Category', { categoryId: cat.id, categoryName: label })}>
                  <View style={{ width: 42, height: 42, borderRadius: 11, overflow: 'hidden', backgroundColor: cat.hue ?? LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    {cat.image
                      ? <ExpoImage source={{ uri: cat.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      : <CategoryGlyph id={id} size={22} />}
                  </View>
                  <Text style={{ flex: 1, fontFamily: sans(500), fontSize: 13.5, color: LMX.ink }}>{label}</Text>
                  <Icon name="chevR" size={16} color={LMX.ink30} />
                </MenuRow>
              );
            })}

            {/* Services */}
            <Text style={[sectionLabel, { marginTop: 18 }]}>SERVICES</Text>
            {MENU_SERVICES.map((s) => (
              <MenuRow key={s.label} onPress={() => go(s.route)}>
                <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={s.icon} size={19} color={LMX.brand} />
                </View>
                <Text style={{ flex: 1, fontFamily: sans(500), fontSize: 13.5, color: LMX.ink }}>{s.label}</Text>
                <Icon name="chevR" size={16} color={LMX.ink30} />
              </MenuRow>
            ))}

            {/* Help card */}
            <View style={{ marginTop: 22, backgroundColor: LMX.brandSoft, borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="headset" size={21} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: sans(700), fontSize: 13.5, color: LMX.ink }}>Besoin d'aide ?</Text>
                  <Text style={{ fontFamily: sans(400), fontSize: 11.5, color: LMX.ink50, marginTop: 2, lineHeight: 16 }}>Notre équipe est disponible pour vous aider.</Text>
                </View>
              </View>
              <Pressable onPress={() => go('Help')} style={{ backgroundColor: LMX.brand, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon name="msg" size={16} color="#fff" />
                <Text style={{ fontFamily: sans(700), fontSize: 13, color: '#fff' }}>Chat en direct</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: LMX.emerald }} />
                <Text style={{ fontSize: 11, color: LMX.ink50, fontFamily: sans(500) }}>Réponse rapide</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function ScreenHome() {
  const nav = useNavigation<any>();
  const { isVendor, isDriver, isLogistics, isSupport } = useAuth();
  const { cats, all, flashDeals, newArrivals, trending, featured, loading } = useHomeData();
  const [menuOpen, setMenuOpen] = useState(false);

  // Staff shortcut to their dashboard
  const staffDash = isDriver
    ? { route: 'Driver', label: 'Tableau de bord livreur', sub: 'Voir mes livraisons', icon: 'truck' as const }
    : isLogistics
    ? { route: 'Logistics', label: 'Opérations logistique', sub: 'Assigner les livreurs', icon: 'truck' as const }
    : isSupport
    ? { route: 'CS', label: 'Support client', sub: 'Confirmer les commandes', icon: 'headset' as const }
    : isVendor
    ? { route: 'Seller', label: 'Tableau de bord vendeur', sub: 'Ventes, commandes, produits', icon: 'storefront' as const }
    : null;

  // Each rail uses its dedicated endpoint, falling back to the general product list — never static placeholders
  const fdRail = flashDeals.length ? flashDeals : all;
  const naRail = newArrivals.length ? newArrivals : all;
  const ftRail = featured.length ? featured : all;
  const trRail = trending.length ? trending : all;

  // Category hue map for local display
  const hueMap: Record<string, string> = {
    beauty: '#FFF0E5', laptops: '#E8EFFE', electronics: '#E5F5FF',
    fashion: '#F0E8FF', home: '#FFF8E1', phones: '#E8EFFE',
    baby: '#FEF3C7', sports: '#D1FAE5',
  };

  return (
    <Screen bg={LMX.bg}>

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: LMX.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => setMenuOpen(true)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="list" size={20} color={LMX.ink} />
          </Pressable>
          <ExpoImage source={require('../../assets/logo.png')} style={{ width: 168, height: 38 }} contentFit="contain" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BellButton bg={LMX.surfaceAlt} />
          <Pressable onPress={() => nav.navigate('Cart')} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bag" size={18} color={LMX.ink} />
          </Pressable>
        </View>
      </View>

      {/* Sidebar menu */}
      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} cats={cats} nav={nav} />

      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: LMX.surface }}>
        <Pressable onPress={() => nav.navigate('Search')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.bg, borderRadius: 999, paddingHorizontal: 16, height: 46, borderWidth: 1, borderColor: LMX.border }}>
          <Icon name="search" size={17} color={LMX.ink50} />
          <Text style={{ flex: 1, fontSize: 13.5, color: LMX.ink50, fontFamily: sans(400) }}>Rechercher un produit, un vendeur...</Text>
          <Icon name="mic" size={17} color={LMX.ink50} />
        </Pressable>
      </View>

      {/* Staff dashboard shortcut */}
      {staffDash && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Pressable onPress={() => nav.navigate(staffDash.route)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.navy, borderRadius: 16, padding: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={staffDash.icon} size={19} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: sans(700), color: '#fff' }}>{staffDash.label}</Text>
              <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.7, marginTop: 2 }}>{staffDash.sub}</Text>
            </View>
            <Icon name="arrowR" size={16} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Hero Banner — delivery photo + branded overlay + service footer */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ borderRadius: 20, overflow: 'hidden', ...shadow('md') }}>
          <Pressable onPress={() => nav.navigate('Category')}>
            <ImageBackground source={require('../../assets/banner.jpg')} style={{ width: '100%', height: 296 }} resizeMode="cover">
              {/* Left-dark scrim keeps text legible while the photo shows on the right */}
              <LinearGradient
                colors={['rgba(8,18,38,0.95)', 'rgba(8,18,38,0.72)', 'rgba(8,18,38,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 14 }}
              >
                {/* Logo */}
                <ExpoImage source={require('../../assets/logo.png')} style={{ width: 160, height: 36 }} contentFit="contain" />

                {/* Headline */}
                <Text style={{ fontFamily: sans(800), fontSize: 18, color: '#fff', lineHeight: 22, marginTop: 10, maxWidth: '74%' }}>
                  VOS ACHATS,{'\n'}
                  <Text style={{ color: LMX.accent }}>LIVRÉS AVEC{'\n'}</Text>
                  SOIN ET <Text style={{ color: LMX.accent }}>SOURIRE !</Text>
                </Text>

                {/* Trust trio */}
                <View style={{ marginTop: 10, gap: 6 }}>
                  {[
                    { icon: 'truck',  label: 'Livraison rapide' },
                    { icon: 'shield', label: 'Service fiable' },
                    { icon: 'key',    label: 'Paiement sécurisé' },
                  ].map(it => (
                    <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: LMX.accent, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={it.icon as any} size={9} color={LMX.accent} />
                      </View>
                      <Text style={{ fontSize: 11, color: '#fff', fontFamily: sans(600) }}>{it.label}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA — a clear, elevated button (its own tap target) */}
                <Pressable
                  onPress={() => nav.navigate('Category')}
                  style={{ marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: LMX.accent, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', ...shadow('lg') }}
                >
                  <Text style={{ color: '#fff', fontFamily: sans(800), fontSize: 14.5 }}>Acheter maintenant</Text>
                  <Icon name="arrowR" size={16} color="#fff" />
                </Pressable>

                {/* Confiance Garantie badge */}
                <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: LMX.accent, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', width: 76 }}>
                  <Icon name="shield" size={15} color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: sans(700), fontSize: 7.5, textAlign: 'center', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>CONFIANCE{'\n'}GARANTIE</Text>
                </View>
              </LinearGradient>
            </ImageBackground>

            {/* Navy service footer (matches banner bottom bar) */}
            <View style={{ backgroundColor: LMX.navy, paddingVertical: 14, paddingHorizontal: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  { icon: 'user',    label: 'Clients\nsatisfaits',     tint: LMX.brand },
                  { icon: 'package', label: 'Colis\nprotégés',         tint: LMX.accent },
                  { icon: 'pin',     label: 'Suivi en\ntemps réel',    tint: LMX.brand },
                  { icon: 'headset', label: 'Support\ndédié',          tint: LMX.accent },
                ].map(s => (
                  <View key={s.label} style={{ flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 2 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.tint, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={s.icon as any} size={16} color="#fff" />
                    </View>
                    <Text style={{ fontSize: 9, color: '#fff', fontFamily: sans(600), textAlign: 'center', lineHeight: 11 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 12, marginBottom: 10 }} />
              <Text style={{ textAlign: 'center', fontSize: 10.5, fontFamily: sans(700), color: '#fff', letterSpacing: 0.3 }}>
                LOOMODEX, LA CONFIANCE À CHAQUE <Text style={{ color: LMX.accent }}>LIVRAISON</Text>
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Trust badges — reassurance strip right under the hero */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            { icon: 'truck',  title: 'Livraison 3h–48h',       sub: 'à Conakry',             tint: LMX.brand,     bg: LMX.brandSoft },
            { icon: 'money',  title: 'Paiement à la livraison', sub: 'Sans frais',            tint: LMX.accent,    bg: LMX.accentSoft },
            { icon: 'shield', title: 'Produits vérifiés',       sub: 'Vendeurs de confiance', tint: LMX.emerald,   bg: LMX.emeraldSoft },
            { icon: 'key',    title: 'Livraison OTP',           sub: 'Sécurisée par code',    tint: LMX.brandDeep, bg: LMX.brandSoft },
          ].map(b => (
            <View key={b.title} style={{ width: '48%', backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: b.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={b.icon as any} size={18} color={b.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontFamily: sans(700), color: LMX.ink, lineHeight: 15 }}>{b.title}</Text>
                <Text style={{ fontSize: 10, color: LMX.ink50, marginTop: 1 }}>{b.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* USA Store entry point — a separate catalogue, so it gets its own doorway
          rather than being mixed into the category grid */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
        <Pressable
          onPress={() => nav.navigate('UsaStore')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.navy, borderRadius: 16, padding: 14 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 19 }}>🇺🇸</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontFamily: sans(700), color: '#fff' }}>USA Store</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              iPhone, MacBook, AirPods — importés des États-Unis
            </Text>
          </View>
          <Icon name="arrowR" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Shop by categories — gradient grid. Hidden so the homepage shows products
          first (SHOW_HOME_CATEGORIES flag above); categories stay in the menu/tab. */}
      {SHOW_HOME_CATEGORIES && (
      <View style={{ paddingHorizontal: 14, paddingTop: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bag" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontFamily: sans(700), color: LMX.navy, letterSpacing: 0.2 }}>Parcourir les catégories</Text>
            <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 1 }}>Trouvez exactement ce que vous cherchez, plus rapidement</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {cats.map((cat: any) => {
            const slug  = cat.slug ?? cat.id;
            const label = decodeEntities(cat.name ?? cat.label ?? slug);
            return (
              <Pressable
                key={cat.id ?? cat.slug}
                onPress={() => nav.navigate('Category', { categoryId: cat.id, categoryName: label })}
                style={{ width: '48%', marginBottom: 14 }}
              >
                <View style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: 1.3, backgroundColor: LMX.navy, ...shadow('sm') }}>
                  {cat.image
                    ? <ExpoImage source={{ uri: cat.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    : (
                      <LinearGradient colors={['#E7EEFF', '#CBD9F5']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <CategoryGlyph id={slug} size={46} />
                      </LinearGradient>
                    )
                  }
                  {/* dark gradient so the label is readable over any photo */}
                  <LinearGradient colors={['transparent', 'rgba(8,18,38,0.85)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' }} />
                  <Text numberOfLines={2} style={{ position: 'absolute', left: 12, right: 12, bottom: 10, fontSize: 13.5, fontFamily: sans(700), color: '#fff', lineHeight: 17 }}>{label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      )}

      {loading ? (
        <View style={{ paddingVertical: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : (
        <>
          {/* Flash Deals */}
          {fdRail.length > 0 && (
            <View style={{ backgroundColor: LMX.surface, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ fontSize: 18 }}>⚡</Text>
                  <Text style={{ fontSize: 16, fontFamily: sans(700), color: LMX.ink }}>Offres flash</Text>
                  <FlashCountdown />
                </View>
                <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} onPress={() => nav.navigate('Category')}>
                  <Text style={{ fontSize: 12, fontFamily: sans(500), color: LMX.brand }}>Voir tout</Text>
                  <Icon name="chevR" size={12} color={LMX.brand} />
                </Pressable>
              </View>
              <ProductRail products={fdRail} nav={nav} />
            </View>
          )}

          {/* New Arrivals */}
          {naRail.length > 0 && (
            <View style={{ backgroundColor: LMX.surface, marginTop: 8 }}>
              <SectionRow icon="🆕" title="Nouveautés" onViewAll={() => nav.navigate('Category')} />
              <ProductRail products={naRail} nav={nav} />
            </View>
          )}

          {/* Premium Selection */}
          {ftRail.length > 0 && (
            <View style={{ backgroundColor: LMX.surface, marginTop: 8 }}>
              <SectionRow icon="💎" title="Sélection Premium" onViewAll={() => nav.navigate('Category')} />
              <ProductRail products={ftRail} nav={nav} />
            </View>
          )}

          {/* Trending */}
          {trRail.length > 0 && (
            <View style={{ backgroundColor: LMX.surface, marginTop: 8 }}>
              <SectionRow icon="🚀" title="Tendances" onViewAll={() => nav.navigate('Category')} />
              <ProductRail products={trRail} nav={nav} />
            </View>
          )}

          {/* Recommended */}
          {all.length > 0 && (
            <View style={{ backgroundColor: LMX.surface, marginTop: 8, marginBottom: 8 }}>
              <SectionRow icon="⭐" title="Recommandés" onViewAll={() => nav.navigate('Category')} />
              <ProductRail products={all} nav={nav} />
            </View>
          )}

          {/* Featured category banners (matches website) */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 12 }}>
            {[
              { title: 'Téléphones', sub: 'Les derniers smartphones aux meilleurs prix', icon: 'phone', kw: ['phone', 'téléph', 'telef', 'smartphone'], colors: ['#1E5FD6', '#0A1A4A'] as [string, string] },
              { title: 'Mode',       sub: 'La mode tendance pour hommes et femmes',       icon: 'bag',   kw: ['mode', 'fashion', 'vêtem', 'chauss'],            colors: ['#F97316', '#B23B0A'] as [string, string] },
              { title: 'Beauté',     sub: 'Soins de la peau, parfums et toilettage',      icon: 'star',  kw: ['beaut', 'beauty', 'soin', 'parfum'],             colors: ['#7C3AED', '#4C1D95'] as [string, string] },
            ].map((f, i) => {
              const cat = cats.find((c: any) => {
                const s = ((c.slug ?? '') + ' ' + (c.name ?? c.label ?? '')).toLowerCase();
                return f.kw.some(k => s.includes(k));
              });
              const go = () => cat
                ? nav.navigate('Category', { categoryId: cat.id, categoryName: decodeEntities(cat.name ?? f.title) })
                : nav.navigate('Category');
              return (
                <Pressable key={i} onPress={go}>
                  <LinearGradient colors={f.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: LMX.r.lg, padding: 20, overflow: 'hidden' }}>
                    <View style={{ position: 'absolute', right: -12, top: 18, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={f.icon as any} size={42} color="rgba(255,255,255,0.45)" />
                    </View>
                    <Text style={{ fontSize: 20, fontFamily: sans(800), color: '#fff', marginBottom: 4 }}>{f.title}</Text>
                    <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.9)', marginBottom: 14 }}>{f.sub}</Text>
                    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}>
                      <Text style={{ fontSize: 13, fontFamily: sans(700), color: '#fff' }}>Acheter maintenant</Text>
                      <Icon name="arrowR" size={14} color="#fff" />
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>

          {/* Weekly promo banner (matches website) */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <LinearGradient colors={['#FF7A00', '#FFB04A', '#1E6BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: LMX.r.lg, padding: 20 }}>
              <Text style={{ fontSize: 19, fontFamily: sans(800), color: '#fff', marginBottom: 6 }}>Offres Spéciales de la Semaine !</Text>
              <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.92)', lineHeight: 18, marginBottom: 14 }}>
                Jusqu'à 50% de réduction sur l'électronique, la mode et plus encore. Ne manquez pas ces offres incroyables !
              </Text>
              <Pressable onPress={() => nav.navigate('Category')} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 }}>
                <Icon name="bag" size={16} color={LMX.ink} />
                <Text style={{ fontSize: 13.5, fontFamily: sans(700), color: LMX.ink }}>Voir les offres</Text>
              </Pressable>
            </LinearGradient>
          </View>

          {/* Stats bar (matches website) */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, paddingVertical: 16 }}>
              {[
                { n: '100+', l: 'Produits disponibles' },
                { n: '50+',  l: 'Clients satisfaits' },
                { n: '10+',  l: 'Vendeurs Vérifiés' },
                { n: '24/7', l: 'Support client' },
              ].map((s, i) => (
                <View key={i} style={{ width: '50%', alignItems: 'center', paddingVertical: 10 }}>
                  <Text style={{ fontSize: 24, fontFamily: sans(800), color: LMX.brand }}>{s.n}</Text>
                  <Text style={{ fontSize: 12, color: LMX.ink50, marginTop: 2 }}>{s.l}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Customer testimonials (matches website) */}
          <View style={{ paddingTop: 18, paddingBottom: 10 }}>
            <Text style={{ paddingHorizontal: 16, fontSize: 16, fontFamily: sans(700), color: LMX.ink, marginBottom: 12 }}>Ce que disent nos clients</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
              {[
                { quote: "Livraison rapide et produits de grande qualité. Loomodex est désormais ma référence pour l'électronique !", initials: 'AM', name: 'Amadou M.', role: 'Conakry' },
                { quote: "J'adore la variété d'articles de mode disponibles. Les prix sont très abordables et le paiement à la livraison est super pratique.", initials: 'FB', name: 'Fatoumata B.', role: 'Kindia' },
                { quote: 'En tant que vendeur, la plateforme est très facile à utiliser. Je gère ma boutique et suis mes commandes sans effort.', initials: 'IK', name: 'Ibrahim K.', role: 'Vendeur vérifié' },
              ].map((t, i) => (
                <View key={i} style={{ width: 280, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 16 }}>
                  <Text style={{ fontSize: 32, fontFamily: sans(800), color: LMX.brand, lineHeight: 30, marginBottom: 2 }}>“</Text>
                  <Text style={{ fontSize: 12.5, color: LMX.ink70, lineHeight: 18, marginBottom: 14 }}>{t.quote}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 13, fontFamily: sans(700), color: '#fff' }}>{t.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{t.name}</Text>
                      <Text style={{ fontSize: 11, color: LMX.ink50 }}>{t.role}</Text>
                      <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => <Icon key={s} name="star" size={11} color={LMX.amber} />)}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* How to order — near the end (matches website) */}
          <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18 }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF1FF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 }}>
                <Icon name="receipt" size={12} color={LMX.brand} />
                <Text style={{ fontSize: 11, fontFamily: sans(700), color: LMX.brand, textTransform: 'uppercase' }}>Guide simple</Text>
              </View>
              <Text style={{ fontSize: 18, fontFamily: sans(800), color: LMX.ink, textAlign: 'center' }}>Comment commander sur Loomodex ?</Text>
              <Text style={{ fontSize: 12, color: LMX.ink50, textAlign: 'center', marginTop: 4 }}>Suivez ces étapes simples pour commander en toute sécurité.</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {[
                { icon: 'search',  title: 'Choisissez votre produit',  desc: "Parcourez l'application et sélectionnez le produit souhaité." },
                { icon: 'bag',     title: 'Ajoutez au panier',         desc: 'Ajoutez-le au panier et passez à la commande.' },
                { icon: 'receipt', title: 'Entrez vos informations',   desc: 'Nom, téléphone, adresse, commune, quartier et point de repère.' },
                { icon: 'money',   title: 'Payez les frais de livraison', desc: 'Payez les frais de livraison pour confirmer et réserver le livreur.' },
                { icon: 'truck',   title: 'Recevez votre commande',    desc: 'Le livreur vous livre à votre adresse.' },
                { icon: 'shield',  title: 'Payez à la livraison',      desc: 'Payez le produit après réception et vérification.' },
              ].map((s, i) => (
                <View key={i} style={{ width: '48%', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, marginBottom: 12, alignItems: 'center' }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: LMX.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontFamily: sans(700), color: '#fff' }}>{i + 1}</Text>
                  </View>
                  <ExpoImage source={STEP_IMAGES[i]} style={{ width: 76, height: 76, marginBottom: 8 }} contentFit="contain" />
                  <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.ink, textAlign: 'center', marginBottom: 4 }}>{s.title}</Text>
                  <Text style={{ fontSize: 10.5, color: LMX.ink50, textAlign: 'center', lineHeight: 14 }}>{s.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

    </Screen>
  );
}

export function ScreenCategories() {
  const nav = useNavigation<any>();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => get<{ categories: any[] }>('/categories'),
  });
  const cats = data?.categories ?? [];
  const list = cats.length ? cats : STATIC_CATS;

  return (
    <Screen>
      <AppBar left={<View style={{ width: 38 }} />} title="Catégories" right={<IconBtn icon="search" onPress={() => nav.navigate('Search')} />} />

      {/* Search entry */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <Pressable onPress={() => nav.navigate('Search')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surfaceAlt, borderRadius: 999, paddingHorizontal: 14, height: 44 }}>
          <Icon name="search" size={16} color={LMX.ink70} />
          <Text style={{ fontSize: 13, color: LMX.ink50 }}>Rechercher une catégorie ou un produit…</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingTop: 50 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : (
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {list.map((cat: any) => {
            const slug  = cat.slug ?? cat.id;
            const label = decodeEntities(cat.name ?? cat.label ?? slug);
            return (
              <Pressable
                key={cat.id ?? cat.slug}
                onPress={() => nav.navigate('Category', { categoryId: cat.id, categoryName: label })}
                style={{ width: '48.5%', marginBottom: 14 }}
              >
                <View style={{ borderRadius: 18, overflow: 'hidden', aspectRatio: 1.15, backgroundColor: LMX.navy, ...shadow('sm') }}>
                  {cat.image
                    ? <ExpoImage source={{ uri: cat.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    : (
                      <LinearGradient colors={['#E7EEFF', '#CBD9F5']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <CategoryGlyph id={slug} size={42} />
                      </LinearGradient>
                    )
                  }
                  <LinearGradient colors={['transparent', 'rgba(8,18,38,0.92)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }} />
                  <Text numberOfLines={2} style={{ position: 'absolute', left: 10, right: 10, bottom: 10, fontSize: 13, fontFamily: sans(700), color: '#fff', lineHeight: 16 }}>{label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

export function ScreenCategory() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const parentId: number | undefined   = route.params?.categoryId;
  const parentName: string | undefined = route.params?.categoryName;

  const [activeCat, setActiveCat] = useState<number | undefined>(parentId);
  const [subcats, setSubcats]     = useState<any[]>([]);
  const [orderby, setOrderby]     = useState('menu_order');
  const [query, setQuery]         = useState('');
  const [sortOpen, setSortOpen]   = useState(false);

  const SORTS = [
    { value: 'menu_order', label: 'Par défaut' },
    { value: 'popularity', label: 'Popularité' },
    { value: 'rating',     label: 'Note moyenne' },
    { value: 'date',       label: 'Plus récents' },
    { value: 'price',      label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
  ];
  const currentSort = SORTS.find(s => s.value === orderby)?.label ?? 'Trier';

  const { data: catData, isLoading: loading } = useQuery({
    queryKey: ['category-products', activeCat ?? 0, orderby],
    queryFn: async () => {
      if (activeCat) {
        return get<{ products: ApiProduct[]; subcategories: any[] }>(`/categories/${activeCat}/products?orderby=${orderby}`);
      }
      const r = await productsApi.list({ orderby });
      return { products: r.products ?? [], subcategories: [] as any[] };
    },
  });
  const products = catData?.products ?? [];
  // Subcategories belong to the parent — keep them while browsing a child
  useEffect(() => {
    if (activeCat === parentId && catData?.subcategories) setSubcats(catData.subcategories);
  }, [catData, activeCat, parentId]);

  const shown = query.trim()
    ? products.filter(p => decodeEntities(p.name).toLowerCase().includes(query.trim().toLowerCase()))
    : products;

  return (
    <Screen>
      <AppBar
        left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />}
        title={parentName ?? 'Produits'}
        right={<IconBtn icon="bag" onPress={() => nav.navigate('Cart')} />}
      />

      {/* Search within this category */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 999, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: LMX.border }}>
          <Icon name="search" size={16} color={LMX.ink50} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher dans cette catégorie…"
            placeholderTextColor={LMX.ink50}
            returnKeyType="search"
            style={{ flex: 1, fontSize: 13.5, color: LMX.ink, fontFamily: sans(400), padding: 0 }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}><Icon name="close" size={15} color={LMX.ink50} /></Pressable>
          )}
        </View>
      </View>

      {/* Subcategory selector */}
      {subcats.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
          <Chip active={activeCat === parentId} onPress={() => setActiveCat(parentId)}>Tout</Chip>
          {subcats.map(s => (
            <Chip key={s.id} active={activeCat === s.id} onPress={() => setActiveCat(s.id)}>{decodeEntities(s.name)}</Chip>
          ))}
        </ScrollView>
      )}

      {/* Result count + sort dropdown */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 12, color: LMX.ink50 }}>{loading ? '' : `${shown.length} produit${shown.length !== 1 ? 's' : ''}`}</Text>
        <Pressable onPress={() => setSortOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Icon name="sliders" size={14} color={LMX.ink70} />
          <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{currentSort}</Text>
          <Icon name="chevD" size={13} color={LMX.ink50} />
        </Pressable>
      </View>

      {/* Sort dropdown sheet */}
      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable onPress={() => setSortOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: LMX.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
              <Text style={{ fontSize: 15, fontFamily: sans(700), color: LMX.ink }}>Trier par</Text>
              <Pressable onPress={() => setSortOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={16} color={LMX.ink} /></Pressable>
            </View>
            {SORTS.map(s => {
              const active = s.value === orderby;
              return (
                <Pressable key={s.value} onPress={() => { setOrderby(s.value); setSortOpen(false); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: LMX.hairline, backgroundColor: active ? LMX.brandSoft : 'transparent' }}>
                  <Text style={{ fontSize: 14, fontFamily: sans(active ? 600 : 400), color: active ? LMX.brand : LMX.ink }}>{s.label}</Text>
                  {active && <Icon name="check" size={16} color={LMX.brand} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>
        : shown.length === 0
          ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Icon name="bag" size={48} color={LMX.ink30} />
              <Text style={{ fontSize: 15, color: LMX.ink70, fontFamily: sans(500) }}>{query.trim() ? `Aucun résultat pour « ${query.trim()} »` : 'Aucun produit trouvé'}</Text>
            </View>
          : <>
              <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {shown.map(p => (
                  <View key={p.id} style={{ width: '47.5%' }}>
                    <ProductCard
                      product={{ id: String(p.id), name: p.name, slug: p.slug, price: p.price, was: p.regular_price > p.price ? p.regular_price : null, off: p.off, cat: '', seller: p.seller, rating: p.rating, reviews: p.reviews, sold: p.sold, image: p.image } as any}
                      onPress={() => nav.navigate('ProductDetail', { productId: p.id })}
                    />
                  </View>
                ))}
              </View>
            </>
      }
    </Screen>
  );
}

function KbKey({ children, wide, flex, accent }: { children: React.ReactNode; wide?: boolean; flex?: boolean; accent?: boolean }) {
  return (
    <View style={{
      width: wide ? 56 : undefined, flex: flex ? 1 : wide ? undefined : 1, height: 38, borderRadius: 6,
      backgroundColor: accent ? LMX.accent : '#fcfcfa', alignItems: 'center', justifyContent: 'center', ...shadow('sm'),
    }}>
      {typeof children === 'string' ? <Text style={{ fontSize: 16, color: accent ? '#fff' : LMX.ink }}>{children}</Text> : children}
    </View>
  );
}

const TRENDING_SEARCHES = ['Smartphone', 'Casque Bluetooth', 'Power bank', 'Parfum', 'Machine à café', 'Soins visage', 'Smart TV', 'Polo homme'];

export function ScreenSearch() {
  const nav = useNavigation<any>();
  const [query, setQuery]   = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => { const t = setTimeout(() => setDebounced(query.trim()), 400); return () => clearTimeout(t); }, [query]);
  const { data, isFetching: searching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => productsApi.search(debounced),
    enabled: debounced.length >= 2,
  });
  const results = debounced.length >= 2 ? (data?.products ?? []) : [];

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    nav.navigate('SearchResults', { query: q });
  };

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 999, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: LMX.brand }}>
          <Icon name="search" size={18} color={LMX.ink} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch(query)}
            placeholder="Rechercher un produit, un vendeur..."
            placeholderTextColor={LMX.ink50}
            autoFocus
            returnKeyType="search"
            style={{ flex: 1, fontSize: 14, color: LMX.ink, fontFamily: sans(400), padding: 0 }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Icon name="close" size={16} color={LMX.ink50} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => nav.goBack()}>
          <Text style={{ fontSize: 14, fontFamily: sans(500), color: LMX.brand }}>Annuler</Text>
        </Pressable>
      </View>

      {searching && <ActivityIndicator color={LMX.brand} style={{ marginTop: 16 }} />}

      {query.length >= 2 && !searching ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {results.length > 0 ? (
            <>
              <Text style={{ paddingHorizontal: 16, paddingBottom: 8, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>
                {results.length} résultats
              </Text>
              <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20 }}>
                {results.map(p => (
                  <View key={p.id} style={{ width: '47.5%' }}>
                    <ProductCard
                      product={{ id: String(p.id), name: p.name, slug: p.slug, price: p.price, was: p.regular_price > p.price ? p.regular_price : null, off: p.off, cat: '', seller: p.seller, rating: p.rating, reviews: p.reviews, sold: p.sold, image: p.image } as any}
                      onPress={() => nav.navigate('ProductDetail', { productId: p.id })}
                    />
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 48, gap: 12 }}>
              <Icon name="search" size={40} color={LMX.ink30} />
              <Text style={{ fontSize: 15, color: LMX.ink70, fontFamily: sans(500) }}>Aucun résultat pour "{query}"</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>Tendances à Conakry</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TRENDING_SEARCHES.map(t => (
                <Chip key={t} onPress={() => doSearch(t)}>{t}</Chip>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

export function ScreenSearchResults() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const initialQuery: string = route.params?.query ?? '';

  const [query, setQuery]   = useState(initialQuery);
  const { data, isLoading: loading } = useQuery({
    queryKey: ['search', query.trim()],
    queryFn: () => productsApi.search(query.trim()),
    enabled: !!query.trim(),
  });
  const results = data?.products ?? [];

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <IconBtn icon="chevL" onPress={() => nav.goBack()} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surfaceAlt, borderRadius: 999, paddingHorizontal: 14, height: 42 }}>
          <Icon name="search" size={16} color={LMX.ink} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {}}
            style={{ flex: 1, fontSize: 13.5, color: LMX.ink, fontFamily: sans(500), padding: 0 }}
            returnKeyType="search"
          />
          {query.length > 0 && <Pressable onPress={() => setQuery('')}><Icon name="close" size={14} color={LMX.ink50} /></Pressable>}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : (
        <>
          <Text style={{ paddingHorizontal: 16, fontSize: 12, color: LMX.ink50, marginBottom: 12 }}>
            <Text style={{ color: LMX.ink, fontFamily: sans(600) }}>{results.length} résultats</Text> pour "{query}"
          </Text>
          {results.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Icon name="search" size={48} color={LMX.ink30} />
              <Text style={{ fontSize: 15, color: LMX.ink70, fontFamily: sans(500) }}>Aucun produit trouvé</Text>
              <Button variant="ghost" onPress={() => nav.goBack()}>Retour</Button>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {results.map(p => (
                <View key={p.id} style={{ width: '47.5%' }}>
                  <ProductCard
                    product={{ id: String(p.id), name: p.name, slug: p.slug, price: p.price, was: p.regular_price > p.price ? p.regular_price : null, off: p.off, cat: '', seller: p.seller, rating: p.rating, reviews: p.reviews, sold: p.sold, image: p.image } as any}
                    onPress={() => nav.navigate('ProductDetail', { productId: p.id })}
                  />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
