import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ImageBackground, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono, shadow } from '../theme';
import { IMG, CATEGORIES as STATIC_CATS, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { CategoryGlyph } from '../Icon';
import {
  Screen, AppBar, IconBtn, Button, ProductCard, SectionHeader, CategoryChip, Chip, ActivePill,
} from '../components';
import { productsApi, Product as ApiProduct } from '../api/products';
import { get } from '../api/client';

function TimePill({ v }: { v: string }) {
  return (
    <View style={{ backgroundColor: LMX.navy, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 }}>
      <Text style={{ fontFamily: sans(700), fontSize: 11, color: '#fff' }}>{v}</Text>
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
  const [cats, setCats]           = useState<any[]>(STATIC_CATS);
  const [flashDeals, setFlash]    = useState<ApiProduct[]>([]);
  const [newArrivals, setNew]     = useState<ApiProduct[]>([]);
  const [trending, setTrending]   = useState<ApiProduct[]>([]);
  const [featured, setFeatured]   = useState<ApiProduct[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, fRes, nRes, tRes, ftRes] = await Promise.allSettled([
          get<{ categories: any[] }>('/categories'),
          productsApi.flashDeals(),
          productsApi.newArrivals(),
          productsApi.trending(),
          productsApi.featured(),
        ]);
        if (cRes.status === 'fulfilled' && cRes.value.categories?.length) setCats(cRes.value.categories);
        if (fRes.status === 'fulfilled') setFlash(fRes.value.products ?? []);
        if (nRes.status === 'fulfilled') setNew(nRes.value.products ?? []);
        if (tRes.status === 'fulfilled') setTrending(tRes.value.products ?? []);
        if (ftRes.status === 'fulfilled') setFeatured(ftRes.value.products ?? []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  return { cats, flashDeals, newArrivals, trending, featured, loading };
}

// Map API product to the shape ProductCard expects
function apiToCard(p: ApiProduct) {
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    price: p.price,
    was: p.regular_price > p.price ? p.regular_price : null,
    off: p.off,
    cat: String(p.categories?.[0] ?? ''),
    seller: p.seller,
    rating: p.rating,
    reviews: p.reviews,
    sold: p.sold,
    image: p.image,
  };
}

export function ScreenHome() {
  const nav = useNavigation<any>();
  const { cats, flashDeals, newArrivals, trending, featured, loading } = useHomeData();

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
        <Image source={require('../../assets/logo.png')} style={{ width: 130, height: 38 }} resizeMode="contain" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surface }}>
            <Icon name="pin" size={12} color={LMX.brand} />
            <View>
              <Text style={{ fontSize: 8.5, color: LMX.ink50, fontFamily: sans(500) }}>Livrer à</Text>
              <Text style={{ fontSize: 11, fontFamily: sans(700), color: LMX.ink }}>Kaloum, Conakry</Text>
            </View>
            <Icon name="chevD" size={10} color={LMX.ink50} />
          </Pressable>
          <Pressable style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={18} color={LMX.ink} />
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: LMX.surface }}>
        <Pressable onPress={() => nav.navigate('Search')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.bg, borderRadius: 999, paddingHorizontal: 16, height: 46, borderWidth: 1, borderColor: LMX.border }}>
          <Icon name="search" size={17} color={LMX.ink50} />
          <Text style={{ flex: 1, fontSize: 13.5, color: LMX.ink50, fontFamily: sans(400) }}>Rechercher un produit, un vendeur...</Text>
          <Icon name="mic" size={17} color={LMX.ink50} />
        </Pressable>
      </View>

      {/* Hero Banner — full width photo with text overlay */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 }}>
        <View style={{ borderRadius: 18, overflow: 'hidden', ...shadow('md') }}>
          <ImageBackground
            source={require('../../assets/banner.jpg')}
            style={{ width: '100%', height: 220 }}
            resizeMode="cover"
          >
            {/* Left-to-right dark overlay so text is readable */}
            <LinearGradient
              colors={['rgba(11,31,58,0.95)', 'rgba(11,31,58,0.7)', 'rgba(11,31,58,0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 14 }}
            >
              {/* Logo */}
              <Image
                source={require('../../assets/logo.png')}
                style={{ width: 110, height: 30, marginBottom: 8 }}
                resizeMode="contain"
              />

              {/* Headline */}
              <Text style={{ fontFamily: sans(700), fontSize: 16, color: '#fff', lineHeight: 22 }}>
                VOS ACHATS,{'\n'}
                <Text style={{ color: '#FF7A00' }}>LIVRÉS AVEC{'\n'}</Text>
                SOIN ET <Text style={{ color: '#FF7A00' }}>SOURIRE !</Text>
              </Text>

              {/* Feature list */}
              <View style={{ marginTop: 8, gap: 5 }}>
                {[
                  { icon: 'truck',  label: 'Livraison Rapide' },
                  { icon: 'shield', label: 'Service Fiable' },
                  { icon: 'key',    label: 'Paiement Sécurisé' },
                ].map(item => (
                  <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: '#FF7A00', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={item.icon as any} size={7} color="#FF7A00" />
                    </View>
                    <Text style={{ fontSize: 10, color: '#fff', fontFamily: sans(500) }}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* Confiance Garantie badge — bottom right */}
              <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: '#FF7A00', borderRadius: 10, padding: 8, alignItems: 'center', width: 70 }}>
                <Icon name="shield" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: sans(700), fontSize: 7, textAlign: 'center', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>CONFIANCE{'\n'}GARANTIE</Text>
              </View>

            </LinearGradient>
          </ImageBackground>
        </View>
      </View>

      {/* Dot indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 8, paddingBottom: 4, backgroundColor: LMX.bg }}>
        {[0,1,2,3,4].map(i => (
          <View key={i} style={{ width: i === 0 ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === 0 ? LMX.accent : LMX.border }} />
        ))}
      </View>

      {/* Categories */}
      <View style={{ backgroundColor: LMX.surface, paddingTop: 14, paddingBottom: 14, marginTop: 6 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          {cats.map((cat: any) => {
            const slug = cat.slug ?? cat.id;
            const hue  = hueMap[slug] ?? cat.hue ?? '#F0F4FF';
            const label = cat.name ?? cat.label ?? slug;
            return (
              <Pressable key={cat.id ?? cat.slug} onPress={() => nav.navigate('Category', { categoryId: cat.id, categoryName: label })} style={{ alignItems: 'center', width: 78, paddingHorizontal: 2 }}>
                {cat.image
                  ? <Image source={{ uri: cat.image }} style={{ width: 58, height: 58, borderRadius: 14, marginBottom: 6 }} />
                  : (
                    <View style={{ width: 58, height: 58, borderRadius: 14, backgroundColor: hue, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <CategoryGlyph id={slug} size={28} />
                    </View>
                  )
                }
                <Text style={{ fontSize: 10, fontFamily: sans(600), color: LMX.ink, textAlign: 'center', lineHeight: 13 }}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Flash Deals */}
      <View style={{ backgroundColor: LMX.surface, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={{ fontSize: 18 }}>⚡</Text>
            <Text style={{ fontSize: 16, fontFamily: sans(700), color: LMX.ink }}>Flash deals</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 }}>
              <TimePill v="08" /><Text style={{ color: LMX.ink50, fontSize: 11 }}>:</Text>
              <TimePill v="45" /><Text style={{ color: LMX.ink50, fontSize: 11 }}>:</Text>
              <TimePill v="22" />
            </View>
          </View>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} onPress={() => nav.navigate('Category')}>
            <Text style={{ fontSize: 12, fontFamily: sans(500), color: LMX.brand }}>Voir tout</Text>
            <Icon name="chevR" size={12} color={LMX.brand} />
          </Pressable>
        </View>
        {loading
          ? <ActivityIndicator color={LMX.brand} style={{ paddingBottom: 16 }} />
          : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
              {flashDeals.length > 0
                ? flashDeals.map(p => <View key={p.id} style={{ width: 160 }}><ProductCard product={apiToCard(p) as any} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} /></View>)
                : PRODUCTS.slice(0, 5).map(p => <View key={p.id} style={{ width: 160 }}><ProductCard product={p as any} onPress={() => nav.navigate('ProductDetail')} /></View>)
              }
            </ScrollView>
          )
        }
      </View>

      {/* New Arrivals */}
      <View style={{ backgroundColor: LMX.surface, marginTop: 8 }}>
        <SectionRow icon="🆕" title="Nouveautés" onViewAll={() => nav.navigate('Category')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
          {newArrivals.length > 0
            ? newArrivals.map(p => <View key={p.id} style={{ width: 160 }}><ProductCard product={apiToCard(p) as any} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} /></View>)
            : PRODUCTS.slice(0, 5).map(p => <View key={p.id} style={{ width: 160 }}><ProductCard product={p as any} onPress={() => nav.navigate('ProductDetail')} /></View>)
          }
        </ScrollView>
      </View>

      {/* Premium Selection */}
      <View style={{ backgroundColor: LMX.surface, marginTop: 8 }}>
        <SectionRow icon="💎" title="Sélection Premium" onViewAll={() => nav.navigate('Category')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
          {featured.length > 0
            ? featured.map(p => <View key={p.id} style={{ width: 160 }}><ProductCard product={apiToCard(p) as any} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} /></View>)
            : PRODUCTS.slice(5, 10).map(p => <View key={p.id} style={{ width: 160 }}><ProductCard product={p as any} onPress={() => nav.navigate('ProductDetail')} /></View>)
          }
        </ScrollView>
      </View>

      {/* Trending */}
      <View style={{ backgroundColor: LMX.surface, marginTop: 8 }}>
        <SectionRow icon="🚀" title="Tendances" onViewAll={() => nav.navigate('Category')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
          {trending.length > 0
            ? trending.map(p => <View key={p.id} style={{ width: 160 }}><ProductCard product={apiToCard(p) as any} onPress={() => nav.navigate('ProductDetail', { productId: p.id })} /></View>)
            : PRODUCTS.slice(0, 5).map(p => <View key={p.id} style={{ width: 160 }}><ProductCard product={p as any} onPress={() => nav.navigate('ProductDetail')} /></View>)
          }
        </ScrollView>
      </View>

      {/* Recommended */}
      <View style={{ backgroundColor: LMX.surface, marginTop: 8, marginBottom: 8 }}>
        <SectionRow icon="⭐" title="Recommandés" onViewAll={() => nav.navigate('Category')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
          {PRODUCTS.slice(10).map(p => (
            <View key={p.id} style={{ width: 160 }}>
              <ProductCard product={p as any} onPress={() => nav.navigate('ProductDetail')} />
            </View>
          ))}
        </ScrollView>
      </View>

    </Screen>
  );
}

export function ScreenCategories() {
  const nav = useNavigation<any>();
  const groups = [
    { ...STATIC_CATS[0], items: ['Smartphones', 'Feature phones', 'Cases', 'Chargers'] },
    { ...STATIC_CATS[2], items: ['Audio', 'TV & Video', 'Wearables', 'Power & charge', 'Cameras'] },
    { ...STATIC_CATS[5], items: ['Laptops', 'Desktops', 'Monitors', 'Accessories'] },
    { ...STATIC_CATS[1], items: ['Men', 'Women', 'Kids', 'Bags', 'Shoes'] },
    { ...STATIC_CATS[3], items: ['Skincare', 'Fragrance', 'Make-up', 'Hair care'] },
    { ...STATIC_CATS[4], items: ['Kitchen', 'Living', 'Décor', 'Storage'] },
  ];
  return (
    <Screen>
      <AppBar left={<View style={{ width: 38 }} />} title="All categories" right={<IconBtn icon="search" onPress={() => nav.navigate('Search')} />} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surfaceAlt, borderRadius: 999, paddingHorizontal: 14, height: 44 }}>
          <Icon name="search" size={16} color={LMX.ink70} />
          <Text style={{ fontSize: 13, color: LMX.ink50 }}>Search categories</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
        <LinearGradient colors={['#F37524', '#C44A0E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: LMX.r.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.85, textTransform: 'uppercase', fontFamily: sans(600) }}>This week</Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 22, color: '#fff', marginTop: 6 }}>Ramadan essentials</Text>
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.85, marginTop: 4 }}>Curated finds for the table & home</Text>
          </View>
          <Icon name="arrowR" size={20} color="#fff" />
        </LinearGradient>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {groups.map(g => (
          <Pressable key={g.id} onPress={() => nav.navigate('Category')} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
            <View style={{ width: 54, height: 54, borderRadius: 14, backgroundColor: g.hue, alignItems: 'center', justifyContent: 'center' }}>
              <CategoryGlyph id={g.id} size={26} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontFamily: sans(600) }}>{g.label}</Text>
                <Icon name="chevR" size={14} color={LMX.ink50} />
              </View>
              <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2, marginBottom: 8 }}>{g.sub}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {g.items.map((t: string) => (
                  <View key={t} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: LMX.surfaceAlt }}>
                    <Text style={{ fontSize: 10.5, color: LMX.ink70, fontFamily: sans(500) }}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

export function ScreenCategory() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const categoryId: number | undefined   = route.params?.categoryId;
  const categoryName: string | undefined = route.params?.categoryName;

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading]   = useState(true);
  const [orderby, setOrderby]   = useState('date');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (categoryId) {
          const res = await get<{ products: ApiProduct[]; category: any }>(`/categories/${categoryId}/products?orderby=${orderby}`);
          setProducts(res.products ?? []);
        } else {
          const res = await productsApi.list({ orderby });
          setProducts(res.products ?? []);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [categoryId, orderby]);

  return (
    <Screen>
      <AppBar
        left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />}
        title={categoryName ?? 'Produits'}
        right={<><IconBtn icon="search" onPress={() => nav.navigate('Search')} /><IconBtn icon="bag" onPress={() => nav.navigate('Cart')} /></>}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
        <Chip active={orderby === 'date'} onPress={() => setOrderby('date')}>Nouveaux</Chip>
        <Chip active={orderby === 'popularity'} onPress={() => setOrderby('popularity')}>Populaires</Chip>
        <Chip active={orderby === 'price'} onPress={() => setOrderby('price')}>Prix ↑</Chip>
        <Chip active={orderby === 'price-desc'} onPress={() => setOrderby('price-desc')}>Prix ↓</Chip>
      </View>
      {loading
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>
        : products.length === 0
          ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Icon name="bag" size={48} color={LMX.ink30} />
              <Text style={{ fontSize: 15, color: LMX.ink70, fontFamily: sans(500) }}>Aucun produit trouvé</Text>
            </View>
          : <>
              <Text style={{ paddingHorizontal: 16, fontSize: 12, color: LMX.ink50, marginBottom: 10 }}>
                <Text style={{ color: LMX.ink, fontFamily: sans(600) }}>{products.length} produits</Text>
              </Text>
              <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {products.map(p => (
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
  const [results, setRes]   = useState<ApiProduct[]>([]);
  const [searching, setSrch]= useState(false);

  useEffect(() => {
    if (query.length < 2) { setRes([]); return; }
    const timer = setTimeout(async () => {
      setSrch(true);
      try {
        const data = await productsApi.search(query);
        setRes(data.products ?? []);
      } catch {}
      finally { setSrch(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

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
  const [results, setRes]   = useState<ApiProduct[]>([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    if (!query.trim()) { setLoad(false); return; }
    (async () => {
      setLoad(true);
      try {
        const data = await productsApi.search(query);
        setRes(data.products ?? []);
      } catch {}
      finally { setLoad(false); }
    })();
  }, [query]);

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
