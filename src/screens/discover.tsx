import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { LMX, FONT, sans, mono, shadow } from '../theme';
import { IMG, CATEGORIES, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { CategoryGlyph } from '../Icon';
import {
  Screen, AppBar, IconBtn, Button, ProductCard, SectionHeader, CategoryChip, Chip, ActivePill,
} from '../components';

function Swoosh({ width = 240, height = 80 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 240 80" style={{ position: 'absolute', bottom: -10, left: -20 }}>
      <Defs>
        <SvgGrad id="sw" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0%" stopColor="#F37524" stopOpacity="0" />
          <Stop offset="40%" stopColor="#F37524" />
          <Stop offset="100%" stopColor="#0EA5E9" />
        </SvgGrad>
      </Defs>
      <Path d="M0 60 Q 80 10, 160 30 T 240 20" stroke="url(#sw)" strokeWidth="3" fill="none" strokeLinecap="round" opacity={0.5} />
    </Svg>
  );
}

function LifestyleBanner({ cat, sub, slug, bg, dark }: { cat: string; sub: string; slug: string; bg: string; dark?: boolean }) {
  const text = dark ? LMX.ink : '#fff';
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 18, padding: 12, minHeight: 130, justifyContent: 'space-between', overflow: 'hidden' }}>
      <View>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: text }}>{cat}</Text>
        <Text style={{ fontSize: 10.5, color: text, opacity: 0.7, marginTop: 4 }}>{sub}</Text>
      </View>
      <View style={{ position: 'absolute', right: -10, bottom: -10, width: 80, height: 80, borderRadius: 14, overflow: 'hidden', transform: [{ rotate: '-8deg' }], ...shadow('md') }}>
        <Image source={{ uri: IMG(slug) }} style={{ width: '100%', height: '100%' }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
        <Text style={{ fontSize: 11, fontFamily: sans(600), color: text }}>Shop</Text>
        <Icon name="arrowR" size={11} color={text} />
      </View>
    </View>
  );
}

function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text style={{ fontFamily: FONT.display, fontSize: 24, color: '#fff' }}>{value}</Text>
      <Text style={{ fontSize: 10, color: '#fff', opacity: 0.6, marginTop: 4, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text>
    </View>
  );
}

function Testimonial({ initials, name, loc, body }: { initials: string; name: string; loc: string; body: string }) {
  return (
    <View style={{ width: 260, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, borderRadius: LMX.r.lg, padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 1, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={12} color={LMX.amber} />)}
      </View>
      <Text numberOfLines={3} style={{ fontSize: 12.5, color: LMX.ink70, lineHeight: 18 }}>"{body}"</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: LMX.hairline }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 11, fontFamily: sans(600) }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontFamily: sans(600) }}>{name}</Text>
          <Text style={{ fontSize: 10.5, color: LMX.ink50 }}>{loc}</Text>
        </View>
      </View>
    </View>
  );
}

function TrustItem({ icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={LMX.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{title}</Text>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{sub}</Text>
      </View>
    </View>
  );
}

function TimePill({ v }: { v: string }) {
  return (
    <View style={{ backgroundColor: LMX.ink, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
      <Text style={{ fontFamily: mono(600), fontSize: 11, color: '#fff' }}>{v}</Text>
    </View>
  );
}

export function ScreenHome() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => nav.navigate('Main')}><Text style={{ fontFamily: FONT.display, fontSize: 30, color: LMX.ink }}>Loomo<Text style={{ color: LMX.accent }}>dex</Text></Text></Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: LMX.surfaceAlt, borderWidth: 1, borderColor: LMX.border }}>
          <Icon name="pin" size={13} color={LMX.brand} />
          <View>
            <Text style={{ fontSize: 9, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Deliver to</Text>
            <Text style={{ fontSize: 11.5, fontFamily: sans(600), marginTop: 2 }}>Kaloum, Conakry</Text>
          </View>
          <Icon name="chevD" size={11} color={LMX.ink50} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => nav.navigate('Search')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 999, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: LMX.border }}>
          <Icon name="search" size={18} color={LMX.ink70} />
          <Text style={{ flex: 1, fontSize: 14, color: LMX.ink50 }}>Search products, sellers…</Text>
          <View style={{ width: 1, height: 22, backgroundColor: LMX.hairline }} />
          <Icon name="mic" size={18} color={LMX.ink70} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <LinearGradient colors={['#0F1620', '#102A43', '#0B7FB5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
          <View style={{ flex: 1 }}>
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: LMX.accent }}>
              <Text style={{ fontSize: 9, fontFamily: sans(700), color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6 }}>Limited time</Text>
            </View>
            <Text style={{ fontFamily: FONT.display, fontSize: 26, color: '#fff', marginTop: 8, lineHeight: 28 }}>Up to 50% off{'\n'}<Text style={{ color: '#F8A776' }}>electronics</Text></Text>
            <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.75, marginTop: 6 }}>Pay on delivery · 24h to your door</Text>
          </View>
          <View style={{ width: 110, height: 110, borderRadius: 18, overflow: 'hidden', transform: [{ rotate: '6deg' }], ...shadow('md') }}>
            <Image source={{ uri: IMG('wireless-bluetooth-headphones-pro') }} style={{ width: '100%', height: '100%' }} />
          </View>
          <Swoosh />
        </LinearGradient>
      </View>

      <SectionHeader title="Browse categories" action="See all" onAction={() => nav.navigate('Categories')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 24 }}>
        {CATEGORIES.map((c, i) => <CategoryChip key={c.id} cat={c} active={i === 0} onPress={() => nav.navigate('Category')} />)}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 24, flexDirection: 'row', gap: 10 }}>
        <LifestyleBanner cat="Phones" sub="Latest models" slug="smartphone-pro-max-128gb" bg="#1E2230" />
        <LifestyleBanner cat="Fashion" sub="Trending fits" slug="womens-genuine-leather-handbag" bg="#E5DDF0" dark />
        <LifestyleBanner cat="Beauty" sub="Skincare & more" slug="premium-perfume-gift-set" bg="#F0DAD8" dark />
      </View>

      {/* Flash deals */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="flame" size={18} color={LMX.accent} />
            <Text style={{ fontSize: 17, fontFamily: sans(600) }}>Flash deals</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>Ends in</Text>
            <TimePill v="08" /><Text style={{ color: LMX.ink50 }}>:</Text><TimePill v="45" /><Text style={{ color: LMX.ink50 }}>:</Text><TimePill v="22" />
          </View>
        </View>
        <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500) }}>View all ›</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 24 }}>
        {[PRODUCTS[1], PRODUCTS[7], PRODUCTS[11], PRODUCTS[12], PRODUCTS[2]].map(p => (
          <View key={p.id} style={{ width: 156 }}><ProductCard product={p} onPress={() => nav.navigate('ProductDetail')} /></View>
        ))}
      </ScrollView>

      {/* Explore */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
        <Text style={{ fontSize: 17, fontFamily: sans(600), marginBottom: 12 }}>Explore products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 14 }}>
          {['Popular', 'New Arrivals', 'Best Sellers', 'For You'].map((t, i) => (
            <View key={t} style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: i === 0 ? LMX.ink : 'transparent', borderWidth: i === 0 ? 0 : 1, borderColor: LMX.border }}>
              <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: i === 0 ? '#fff' : LMX.ink70 }}>{t}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {[PRODUCTS[10], PRODUCTS[13], PRODUCTS[4], PRODUCTS[7]].map(p => (
          <View key={p.id} style={{ width: '47.5%' }}><ProductCard product={p} onPress={() => nav.navigate('ProductDetail')} /></View>
        ))}
      </View>

      <SectionHeader title="From our customers" subtitle="Verified buyers across Guinea" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 8 }}>
        <Testimonial initials="AM" name="Amadou M." loc="Conakry" body="Fast delivery and great quality products. Loomodex is now my go-to marketplace for electronics!" />
        <Testimonial initials="FB" name="Fatoumata B." loc="Kindia" body="I love the variety of fashion items. Prices are affordable and paying with Mobile Money is super convenient." />
        <Testimonial initials="IK" name="Ibrahim K." loc="Verified Seller" body="As a seller, the platform is very easy to use. I can manage my store and track orders effortlessly." />
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <LinearGradient colors={['#0F1620', '#0B7FB5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: LMX.r.lg, padding: 18, flexDirection: 'row', justifyContent: 'space-between' }}>
          <BigStat value="10K+" label="Products" />
          <BigStat value="5K+" label="Buyers" />
          <BigStat value="500+" label="Sellers" />
          <BigStat value="24/7" label="Support" />
        </LinearGradient>
      </View>

      <View style={{ margin: 16, padding: 18, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <TrustItem icon="truck" title="24–48h" sub="Delivery in Conakry" />
          <TrustItem icon="money" title="Pay on delivery" sub="Inspect first" />
        </View>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <TrustItem icon="shield" title="OTP verified" sub="Secure handoff" />
          <TrustItem icon="refresh" title="Easy returns" sub="14-day policy" />
        </View>
      </View>
    </Screen>
  );
}

export function ScreenCategories() {
  const nav = useNavigation<any>();
  const groups = [
    { ...CATEGORIES[0], items: ['Smartphones', 'Feature phones', 'Cases', 'Chargers'] },
    { ...CATEGORIES[2], items: ['Audio', 'TV & Video', 'Wearables', 'Power & charge', 'Cameras'] },
    { ...CATEGORIES[5], items: ['Laptops', 'Desktops', 'Monitors', 'Accessories'] },
    { ...CATEGORIES[1], items: ['Men', 'Women', 'Kids', 'Bags', 'Shoes'] },
    { ...CATEGORIES[3], items: ['Skincare', 'Fragrance', 'Make-up', 'Hair care'] },
    { ...CATEGORIES[4], items: ['Kitchen', 'Living', 'Décor', 'Storage'] },
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
                {g.items.map(t => (
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
  const nav = useNavigation<any>();
  const items = PRODUCTS.filter(p => p.cat === 'electronics' || p.cat === 'phones').slice(0, 6);
  return (
    <Screen>
      <AppBar
        left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />}
        title="Electronics"
        right={<><IconBtn icon="search" onPress={() => nav.navigate('Search')} /><IconBtn icon="bag" badge={3} onPress={() => nav.navigate('Cart')} /></>}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
        <Chip active>All · 12</Chip><Chip>Audio</Chip><Chip>TV & Video</Chip><Chip>Wearables</Chip><Chip>Power & Charge</Chip>
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
        <Chip icon="sliders" onPress={() => nav.navigate('FilterSheet')}>Filter</Chip>
        <Chip icon="chevD">Popular</Chip>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', backgroundColor: LMX.surface, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: LMX.border }}>
          <View style={{ width: 30, height: 26, borderRadius: 8, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="grid" size={14} color="#fff" /></View>
          <View style={{ width: 30, height: 26, alignItems: 'center', justifyContent: 'center' }}><Icon name="list" size={14} color={LMX.ink50} /></View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 14 }}>
        <ActivePill>Under 500 000 GNF</ActivePill><ActivePill>Free delivery</ActivePill><ActivePill>4★ & up</ActivePill>
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 12, color: LMX.ink50, marginBottom: 10 }}>Showing <Text style={{ color: LMX.ink, fontFamily: sans(600) }}>12 results</Text> · sorted by Popular</Text>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {items.map(p => <View key={p.id} style={{ width: '47.5%' }}><ProductCard product={p} onPress={() => nav.navigate('ProductDetail')} /></View>)}
      </View>
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

export function ScreenSearch() {
  const nav = useNavigation<any>();
  const rows = ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')];
  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 999, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: LMX.ink }}>
          <Icon name="search" size={18} color={LMX.ink} />
          <Text style={{ flex: 1, fontSize: 14, color: LMX.ink, fontFamily: sans(500) }}>headphone</Text>
          <Icon name="close" size={16} color={LMX.ink50} />
        </View>
        <Pressable onPress={() => nav.goBack()}><Text style={{ fontSize: 14, fontFamily: sans(500), color: LMX.ink }}>Cancel</Text></Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={{ paddingHorizontal: 16, paddingBottom: 8, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Suggestions</Text>
        {['headphones pro wireless', 'headphone bluetooth noise cancelling', 'headphone case', 'headphone stand wood'].map((q, i) => (
          <Pressable key={i} onPress={() => nav.navigate('SearchResults')} style={{ paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: LMX.hairline }}>
            <Icon name="search" size={16} color={LMX.ink50} />
            <Text style={{ flex: 1, fontSize: 14 }}><Text style={{ fontFamily: sans(600) }}>headphone</Text><Text style={{ color: LMX.ink70 }}>{q.slice('headphone'.length)}</Text></Text>
            <Icon name="arrowDownLeft" size={16} color={LMX.ink50} />
          </Pressable>
        ))}
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>Trending in Conakry</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Smartphone', 'Sneakers', 'Power bank', 'Perfume', 'Espresso machine', 'Skincare', 'Smart TV', 'Polo shirt'].map(t => (
              <Chip key={t} onPress={() => nav.navigate('SearchResults')}>{t}</Chip>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={{ backgroundColor: '#D7D4CB', paddingTop: 8, paddingBottom: 24, paddingHorizontal: 4 }}>
        {rows.map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 5, justifyContent: 'center', marginBottom: 9, paddingHorizontal: i === 1 ? 18 : i === 2 ? 28 : 6 }}>
            {i === 2 && <KbKey wide><Icon name="chevU" size={16} color={LMX.ink} /></KbKey>}
            {r.map(k => <KbKey key={k}>{k}</KbKey>)}
            {i === 2 && <KbKey wide><Icon name="close" size={14} color={LMX.ink} /></KbKey>}
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 6 }}>
          <KbKey wide>123</KbKey><KbKey flex>space</KbKey><KbKey wide accent>search</KbKey>
        </View>
      </View>
    </Screen>
  );
}

export function ScreenSearchResults() {
  const nav = useNavigation<any>();
  const results = [PRODUCTS[1], PRODUCTS[7], PRODUCTS[4], PRODUCTS[12], PRODUCTS[3], PRODUCTS[13]];
  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <IconBtn icon="chevL" onPress={() => nav.goBack()} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surfaceAlt, borderRadius: 999, paddingHorizontal: 14, height: 42 }}>
          <Icon name="search" size={16} color={LMX.ink} />
          <Text style={{ flex: 1, fontSize: 13.5, color: LMX.ink, fontFamily: sans(500) }}>headphone</Text>
          <Icon name="close" size={14} color={LMX.ink50} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 12, color: LMX.ink50, flex: 1 }}><Text style={{ color: LMX.ink, fontFamily: sans(600) }}>142 results</Text> for "headphone"</Text>
        <Chip icon="sliders" onPress={() => nav.navigate('FilterSheet')}>Filter · 3</Chip>
        <Chip icon="chevD">Popular</Chip>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 14 }}>
        <ActivePill>Audio</ActivePill><ActivePill>50K – 500K GNF</ActivePill><ActivePill>4★ & up</ActivePill><ActivePill>Free delivery</ActivePill>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ backgroundColor: LMX.brandSoft, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkle" size={14} color={LMX.brandDeep} />
          <Text style={{ flex: 1, fontSize: 12, fontFamily: sans(600), color: LMX.brandDeep }}>Did you mean "wireless headphones"?</Text>
          <Icon name="chevR" size={12} color={LMX.brandDeep} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {results.map(p => <View key={p.id} style={{ width: '47.5%' }}><ProductCard product={p} onPress={() => nav.navigate('ProductDetail')} /></View>)}
      </View>
      <Text style={{ paddingVertical: 24, textAlign: 'center', fontSize: 12, color: LMX.ink50 }}>— End of page 1 of 6 —</Text>
    </Screen>
  );
}
