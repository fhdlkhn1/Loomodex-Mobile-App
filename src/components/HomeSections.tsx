import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, Alert, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, sans, mono, shadow, decodeEntities } from '../theme';
import { Icon, IconName } from '../Icon';
import { useCart } from '../context/CartContext';
import { friendlyError } from '../api/client';
import { Product as ApiProduct } from '../api/products';
import { HomeLayout, HomeLink, HomeSection } from '../api/home';
import { t } from '../i18n';

/**
 * App home, built from wp-admin → Loomodex → Home page (GET /home/layout): every image, title,
 * text and button comes from WordPress, so the client changes it without a new app version.
 */

const BLUE = '#0A5BFF';
const fmt = (n: number) => Math.round(n || 0).toLocaleString('fr-FR').replace(/ /g, ' ');

export function openHomeLink(nav: any, link?: HomeLink | null, title?: string) {
  if (!link) return;
  const v = String(link.value ?? '');
  switch (link.type) {
    case 'category': if (Number(v)) nav.navigate('Category', { categoryId: Number(v), categoryName: link.name || title }); break;
    case 'product': if (Number(v)) nav.navigate('ProductDetail', { productId: Number(v) }); break;
    case 'store': if (Number(v)) nav.navigate('OfferStore', { storeId: Number(v), name: link.name || title }); break;
    case 'screen': if (v) nav.navigate(v); break;
    case 'url': if (link.url || v) Linking.openURL(link.url || v).catch(() => {}); break;
  }
}

function SectionHead({ title, linkLabel, onLink }: { title: string; linkLabel?: string; onLink?: () => void }) {
  if (!title) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 22, marginBottom: 10, gap: 8 }}>
      <Text style={{ flex: 1, fontSize: 21, fontFamily: sans(800), color: LMX.navy, letterSpacing: -0.3 }}>{title}</Text>
      {!!linkLabel && !!onLink && <Pressable onPress={onLink}><Text style={{ fontSize: 13, fontFamily: sans(700), color: BLUE }}>{linkLabel}</Text></Pressable>}
    </View>
  );
}

/** The design's product card: verified label, area, delivery promise and payment lines (texts from WordPress). */
function ProductCardHome({ p, card, nav, width = 200 }: { p: ApiProduct; card: HomeLayout['card']; nav: any; width?: number }) {
  const { addToCart } = useCart();
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (p.purchasable === false || p.type === 'variable') { nav.navigate('ProductDetail', { productId: p.id }); return; }
    setBusy(true);
    try { await addToCart(p.id, 1); } catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); } finally { setBusy(false); }
  };
  const onRequest = !!p.store && (p.store.price_display === 'on_request' || !(p.price > 0));
  return (
    <Pressable onPress={() => nav.navigate('ProductDetail', { productId: p.id })}
      style={{ width, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
      <View style={{ height: width * 0.68, backgroundColor: '#F6F7F9', alignItems: 'center', justifyContent: 'center' }}>
        {p.image ? <ExpoImage source={{ uri: p.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <Icon name="package" size={30} color={LMX.ink30} />}
      </View>
      <View style={{ padding: 10, gap: 4 }}>
        {!!card.verified_label && (
          <View style={{ alignSelf: 'flex-start', backgroundColor: '#DAF5E6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontFamily: sans(600), color: '#0E8A57' }}>{card.verified_label}</Text>
          </View>
        )}
        <Text numberOfLines={2} style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink, minHeight: 36 }}>{decodeEntities(p.name)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {onRequest
            ? <Text style={{ fontSize: 14, fontFamily: sans(800), color: BLUE }}>{t('Prix sur demande')}</Text>
            : <Text style={{ fontSize: 19, fontFamily: sans(800), color: BLUE }}>{fmt(p.price)} <Text style={{ fontSize: 11 }}>GNF</Text></Text>}
          <Pressable onPress={add} disabled={busy} hitSlop={6} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: LMX.accent, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
            <Icon name="bag" size={15} color="#fff" />
          </Pressable>
        </View>
        {!!p.seller_area && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="pin" size={11} color={LMX.ink50} />
            <Text numberOfLines={1} style={{ fontSize: 12, color: LMX.ink70 }}>{p.seller_area}</Text>
          </View>
        )}
        {!p.store && !p.is_usa && (
          <>
            {!!card.delivery_text && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="truck" size={11} color={BLUE} />
                <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: sans(700), color: BLUE }}>{card.delivery_text}</Text>
              </View>
            )}
            {!!card.pay_text && <Text style={{ fontSize: 12, fontFamily: sans(700), color: LMX.ink }}>{card.pay_text}</Text>}
            {!!card.fee_text && <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>{card.fee_text}</Text>}
          </>
        )}
        {p.is_usa && !!p.delivery_estimate && <Text style={{ fontSize: 12, fontFamily: sans(600), color: LMX.navy }}>{p.delivery_estimate}</Text>}
        {!!p.store && <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: sans(600), color: LMX.navy }}>{p.store.name}</Text>}
      </View>
    </Pressable>
  );
}

/** Small tile inside a blue collection panel. */
function PanelTile({ p, nav, width }: { p: ApiProduct; nav: any; width: number }) {
  return (
    <Pressable onPress={() => nav.navigate('ProductDetail', { productId: p.id })} style={{ width, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' }}>
      <View style={{ height: width * 0.78, backgroundColor: '#F6F7F9' }}>
        {p.image ? <ExpoImage source={{ uri: p.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
      </View>
      <View style={{ padding: 7, gap: 2 }}>
        <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{decodeEntities(p.name)}</Text>
        <Text style={{ fontSize: 14, fontFamily: sans(800), color: LMX.ink }}>{p.price > 0 ? `${fmt(p.price)} ` : t('Prix sur demande')}{p.price > 0 && <Text style={{ fontSize: 10 }}>GNF</Text>}</Text>
        {!!p.seller_area && <Text numberOfLines={1} style={{ fontSize: 11, color: LMX.ink50 }}>⌖ {p.seller_area}</Text>}
      </View>
    </Pressable>
  );
}

function Countdown({ endsAt }: { endsAt?: string }) {
  const end = endsAt ? new Date(endsAt).getTime() : 0;
  const calc = () => Math.max(0, Math.floor((end - Date.now()) / 1000));
  const [s, setS] = useState(calc());
  useEffect(() => { const i = setInterval(() => setS(calc()), 1000); return () => clearInterval(i); }, [end]);
  if (!end) return null;
  const parts = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(n => String(n).padStart(2, '0'));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Text style={{ fontFamily: sans(800), color: LMX.navy }}>:</Text>}
          <View style={{ backgroundColor: LMX.navy, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}><Text style={{ color: '#fff', fontFamily: mono(700), fontSize: 15 }}>{p}</Text></View>
        </React.Fragment>
      ))}
    </View>
  );
}

const TRUST_ICON: Record<string, IconName> = { truck: 'truck', money: 'money', shield: 'shield', key: 'key', package: 'package', headset: 'headset', check: 'check', star: 'star' };
const TRUST_TINT = [LMX.brand, LMX.accent, LMX.emerald, LMX.brandDeep];

function Collection({ s, nav }: { s: HomeSection; nav: any }) {
  const { width } = useWindowDimensions();
  const panelW = width - 32 - 36;
  const tileW = (panelW - 16 - 8) / 2;
  const [page, setPage] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / (panelW + 10)));
  const panels = s.panels ?? [];
  return (
    <View>
      <SectionHead title={s.title} linkLabel={s.link_label} onLink={s.link && s.link.type !== 'none' ? () => openHomeLink(nav, s.link, s.title) : undefined} />
      {!!s.image && (
        <Pressable onPress={() => openHomeLink(nav, s.link, s.title)} style={{ marginHorizontal: 16, marginBottom: 10, borderRadius: 14, overflow: 'hidden' }}>
          <ExpoImage source={{ uri: s.image }} style={{ width: '100%', aspectRatio: 2.6 }} contentFit="cover" />
        </Pressable>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={panelW + 10} decelerationRate="fast" onScroll={onScroll} scrollEventThrottle={32}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {panels.map((p, i) => (
          <View key={i} style={{ width: panelW, backgroundColor: BLUE, borderRadius: 16, padding: 8, paddingTop: 10 }}>
            <Pressable onPress={() => openHomeLink(nav, p.link, p.title)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginBottom: 8 }}>
              {!!p.image && <ExpoImage source={{ uri: p.image }} style={{ width: 28, height: 28, borderRadius: 6 }} contentFit="cover" />}
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 19, fontFamily: sans(800), color: '#fff' }}>{p.title}</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {p.products.slice(0, 4).map(pr => <PanelTile key={pr.id} p={pr} nav={nav} width={tileW} />)}
            </View>
          </View>
        ))}
      </ScrollView>
      {panels.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 }}>
          {panels.map((_, i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i === page ? BLUE : '#C5D0E6' }} />)}
        </View>
      )}
    </View>
  );
}

function Ad({ s, nav }: { s: HomeSection; nav: any }) {
  const open = () => openHomeLink(nav, s.link, s.title);
  const button = !!s.button && (
    <Pressable onPress={open} style={{ alignSelf: 'flex-start', marginTop: 10, backgroundColor: s.style === 'light' ? BLUE : '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 }}>
      <Text style={{ fontSize: 13, fontFamily: sans(700), color: s.style === 'light' ? '#fff' : LMX.navy }}>{s.button} ›</Text>
    </Pressable>
  );
  if (s.style === 'dark') {
    return (
      <Pressable onPress={open} style={{ marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#123A7A', minHeight: 150 }}>
        <View style={{ flex: 1, padding: 14, justifyContent: 'center' }}>
          {!!s.title && <Text style={{ fontSize: 22, lineHeight: 25, fontFamily: sans(800), color: '#fff' }}>{s.title}</Text>}
          {!!s.text && <Text style={{ fontSize: 12.5, color: '#fff', opacity: 0.85, marginTop: 4 }}>{s.text}</Text>}
          {button}
        </View>
        {!!s.image && <ExpoImage source={{ uri: s.image }} style={{ width: '50%' }} contentFit="cover" />}
      </Pressable>
    );
  }
  if (s.style === 'light') {
    return (
      <Pressable onPress={open} style={{ marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E8F0FF', minHeight: 140 }}>
        {!!s.image && <ExpoImage source={{ uri: s.image }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%' }} contentFit="cover" />}
        <View style={{ padding: 16, maxWidth: '62%' }}>
          {!!s.title && <Text style={{ fontSize: 22, lineHeight: 25, fontFamily: sans(800), color: LMX.navy }}>{s.title}</Text>}
          {!!s.text && <Text style={{ fontSize: 12.5, color: LMX.ink70, marginTop: 4 }}>{s.text}</Text>}
          {button}
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={open} style={{ marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden', minHeight: 140, ...shadow('sm') }}>
      {!!s.image && <ExpoImage source={{ uri: s.image }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" />}
      <LinearGradient colors={['rgba(8,18,38,0.85)', 'rgba(8,18,38,0.35)', 'rgba(8,18,38,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 16, minHeight: 140, justifyContent: 'center' }}>
        {!!s.title && <Text style={{ fontSize: 22, lineHeight: 25, fontFamily: sans(800), color: '#fff', maxWidth: '65%' }}>{s.title}</Text>}
        {!!s.text && <Text style={{ fontSize: 12.5, color: '#fff', opacity: 0.85, marginTop: 4, maxWidth: '65%' }}>{s.text}</Text>}
        {button}
      </LinearGradient>
    </Pressable>
  );
}

export function HomeSections({ layout, nav, header }: { layout: HomeLayout; nav: any; header?: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const card = layout.card;
  return (
    <View style={{ paddingBottom: 24 }}>
      {header}
      {layout.sections.map(s => {
        switch (s.type) {
          case 'trust':
            return (
              <View key={s.id} style={{ paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 }}>
                {(s.items ?? []).map((b, i) => (
                  <View key={i} style={{ width: '49%', minHeight: 46, backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: TRUST_TINT[i % 4] + '1A', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={TRUST_ICON[b.icon] ?? 'shield'} size={14} color={TRUST_TINT[i % 4]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: sans(700), color: LMX.ink }}>{b.title}</Text>
                      {!!b.text && <Text numberOfLines={2} style={{ fontSize: 10.5, color: LMX.ink50 }}>{b.text}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'flash':
            if (!s.products?.length) return null;
            return (
              <View key={s.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 10, gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                  <Text style={{ fontSize: 21, fontFamily: sans(800), color: LMX.navy }}>{s.title}</Text>
                  <Countdown endsAt={s.ends_at} />
                  <View style={{ flex: 1 }} />
                  {!!s.link_label && <Pressable onPress={() => nav.navigate('Category')}><Text style={{ fontSize: 13, fontFamily: sans(700), color: BLUE }}>{s.link_label}</Text></Pressable>}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                  {s.products.map(p => <ProductCardHome key={p.id} p={p} card={card} nav={nav} />)}
                </ScrollView>
              </View>
            );
          case 'ad':
            return <Ad key={s.id} s={s} nav={nav} />;
          case 'categories': {
            const items = s.items ?? [];
            const size = Math.min(96, (width - 32 - 40) / 3);
            return (
              <View key={s.id}>
                {!!s.title && <SectionHead title={s.title} />}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: s.title ? 0 : 20, rowGap: 14 }}>
                  {items.map((c, i) => (
                    <Pressable key={i} onPress={() => openHomeLink(nav, c.link, c.name)} style={{ width: '33.33%', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: LMX.surfaceAlt, ...shadow('sm') }}>
                        {!!c.image && <ExpoImage source={{ uri: c.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />}
                      </View>
                      <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: sans(700), color: LMX.ink }}>{c.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          }
          case 'collection':
            return <Collection key={s.id} s={s} nav={nav} />;
          case 'rail':
            if (!s.products?.length) return null;
            return (
              <View key={s.id}>
                <SectionHead title={s.title} linkLabel={s.link_label}
                  onLink={() => (s.link && s.link.type !== 'none' ? openHomeLink(nav, s.link, s.title) : nav.navigate('Category'))} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                  {s.products.map(p => <ProductCardHome key={p.id} p={p} card={card} nav={nav} />)}
                </ScrollView>
              </View>
            );
          case 'guide':
            return (
              <View key={s.id}>
                <SectionHead title={s.title} />
                <View style={{ paddingHorizontal: 16, gap: 8 }}>
                  {(s.steps ?? []).map((st, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, padding: 12 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontFamily: sans(800) }}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{st.title}</Text>
                        {!!st.text && <Text style={{ fontSize: 12.5, color: LMX.ink70, marginTop: 2 }}>{st.text}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          case 'support':
            return (
              <View key={s.id} style={{ marginHorizontal: 16, marginTop: 22, backgroundColor: LMX.navy, borderRadius: 16, padding: 16, gap: 6 }}>
                <Text style={{ fontSize: 19, fontFamily: sans(800), color: '#fff' }}>{s.title}</Text>
                {!!s.text && <Text style={{ fontSize: 13, color: '#fff', opacity: 0.8 }}>{s.text}</Text>}
                {!!s.button && (
                  <Pressable onPress={() => openHomeLink(nav, s.link, s.title)} style={{ alignSelf: 'flex-start', marginTop: 6, backgroundColor: LMX.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}>
                    <Text style={{ color: '#fff', fontFamily: sans(700), fontSize: 13 }}>{s.button}</Text>
                  </Pressable>
                )}
              </View>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}
