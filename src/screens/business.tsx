import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Alert, TextInput, Linking, Platform, RefreshControl, AppState } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { LMX, FONT, sans, mono, fr, decodeEntities } from '../theme';
import { IMG, PRODUCTS } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Field, Toggle, MapVisual, CategoryGlyph, LoadingOverlay } from '../components';
import { Picker } from '../components/Picker';
import { useAuth } from '../context/AuthContext';
import { get, post, friendlyError, isApiError } from '../api/client';
import { ordersApi, Order, OrderTracking } from '../api/orders';
import { LiveMap } from '../components/LiveMap';
import { OrderLocationMap, OrderMapSheet, MapButton } from '../components/OrderLocationMap';
import { configApi } from '../api/config';
import { Product as ApiProduct } from '../api/products';
import { driverApi, logisticsApi, csApi, partnerApi, DeliveryOrder, LogisticsDriver, DriverSummary, LogisticsPartner } from '../api/delivery';
import { Sheet, TextArea, Pill, ErrorBanner, AmountRow, agoFr, PackedPill, NotPackedNote } from '../components/StaffKit';
import { SITE_ORIGIN } from '../api/wcfm';
import { vendorApi, VendorDashboard, MAX_PRODUCT_PHOTOS } from '../api/vendor';
import { StoreAddressForm, StoreAddressValue, EMPTY_STORE_ADDRESS } from '../components/StoreAddressForm';
import { DriversMap, driverMapState, hasPosition, DRIVER_STATE_COLOR, DriverMapState } from '../components/DriversMap';
import { t, locale } from '../i18n';
import { quoteLineLabel } from '../components/FeeBreakdown';

function Chart() {
  const pts = [10, 18, 12, 28, 22, 40, 32, 46, 38, 52, 44, 58];
  const max = 60, w = 320, h = 60;
  const sx = (i: number) => (i / (pts.length - 1)) * w;
  const sy = (v: number) => h - (v / max) * h;
  const path = pts.map((v, i) => (i === 0 ? 'M' : 'L') + sx(i) + ' ' + sy(v)).join(' ');
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Defs><SvgGrad id="cg" x1="0" x2="0" y1="0" y2="1"><Stop offset="0%" stopColor="#D94C1F" stopOpacity="0.4" /><Stop offset="100%" stopColor="#D94C1F" stopOpacity="0" /></SvgGrad></Defs>
      <Path d={area} fill="url(#cg)" />
      <Path d={path} stroke="#D94C1F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StatCard({ label, value, trend, icon, highlight }: any) {
  return (
    <View style={{ width: '47.5%', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: highlight ? LMX.ink : LMX.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 10.5, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text>
        <Icon name={icon} size={14} color={LMX.ink50} />
      </View>
      <Text style={{ fontFamily: mono(600), fontSize: 22, marginTop: 6 }}>{value}</Text>
      {!!trend && <Text style={{ fontSize: 10.5, color: highlight ? LMX.accent : LMX.ink50, marginTop: 2, fontFamily: highlight ? sans(600) : sans(500) }}>{trend}</Text>}
    </View>
  );
}

function ActionCard({ icon, label, sub }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} color={LMX.ink} /></View>
      <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontFamily: sans(600) }}>{label}</Text><Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 1 }}>{sub}</Text></View>
    </View>
  );
}

// ── Seller dashboard (plugin /vendor/dashboard) ────────────────

// Logout button for staff dashboards
// Edit contact info (name / phone) — opens the shared account-details screen
function DashboardProfileBtn() {
  const nav = useNavigation<any>();
  return <IconBtn icon="user" onPress={() => nav.navigate('AccountDetails')} />;
}

function DashboardLogoutBtn() {
  const nav = useNavigation<any>();
  const { logout } = useAuth();
  const onPress = () => Alert.alert(t('Déconnexion'), t('Voulez-vous vous déconnecter ?'), [
    { text: t('Annuler'), style: 'cancel' },
    { text: t('Déconnexion'), style: 'destructive', onPress: async () => { await logout(); nav.reset({ index: 0, routes: [{ name: 'SignIn' }] }); } },
  ]);
  return <IconBtn icon="arrowU" onPress={onPress} />;
}

function EarningsCell({ label, sub, value, color, ok }: { label: string; sub: string; value?: number; color: string; ok: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 10, color: '#fff', opacity: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text>
      <Text style={{ fontSize: 14, fontFamily: mono(600), color: ok ? color : 'rgba(255,255,255,0.5)', marginTop: 3 }}>
        {ok && value != null ? `${fr(value)} GNF` : '—'}
      </Text>
      <Text style={{ fontSize: 9.5, color: '#fff', opacity: 0.5, marginTop: 1 }}>{sub}</Text>
    </View>
  );
}

export function ScreenSeller() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [data, setData]     = useState<VendorDashboard | null>(null);
  const [loading, setLoad]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]   = useState<unknown>(null);

  const load = useCallback(async () => {
    try { const d = await vendorApi.dashboard(); setData(d); setError(null); }
    catch (e) { setError(e); setData(null); }
    finally { setLoad(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  const ok        = !!data && !error;
  const orders    = (data?.recent_orders ?? []) as Order[];
  const storeName = user?.store?.name || t('Ma boutique');
  const newOrders = data?.new_orders ?? 0;
  const noRoute   = isApiError(error) && error.status === 404 && error.code === 'rest_no_route';
  const openWebDashboard = () => Linking.openURL(`${SITE_ORIGIN}/store-manager/`).catch(() => {});
  const retry = () => { setLoad(true); load(); };

  return (
    <Screen scroll={false}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LMX.brand} colors={[LMX.brand]} />}
      >
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn icon="chevL" onPress={() => nav.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Tableau de bord vendeur')}</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>{decodeEntities(storeName)}</Text>
          </View>
          <IconBtn icon="refresh" onPress={retry} />
          <DashboardProfileBtn />
          <DashboardLogoutBtn />
        </View>
      </View>

      {loading ? (
        <View style={{ paddingTop: 60 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : (
        <>
          {!!error && (
            <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF0F0', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: LMX.rose + '33' }}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="close" size={15} color={LMX.rose} />
                <Text style={{ flex: 1, fontSize: 12, color: LMX.ink70, lineHeight: 17 }}>
                  {t('Données vendeur indisponibles : {err}', { err: friendlyError(error) })}
                  {noRoute ? '\n' + t("Vérifiez que les extensions WCFM + l'API sont actives et reconnectez-vous.") : ''}
                </Text>
              </View>
              <Button variant="soft" size="sm" icon="refresh" onPress={retry}>{t('Réessayer')}</Button>
            </View>
          )}
          {/* Earnings (vendor commission): confirmed = delivered & paid, pending = in progress */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <View style={{ backgroundColor: LMX.ink, borderRadius: LMX.r.xl, padding: 20, overflow: 'hidden' }}>
              <Text style={{ fontSize: 11, color: '#fff', opacity: 0.65, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Gains confirmés ce mois')}</Text>
              {ok ? (
                <Text style={{ fontFamily: FONT.display, fontSize: 36, color: '#fff', marginTop: 8 }}>{fr(data!.earnings?.month?.confirmed ?? 0)}<Text style={{ fontSize: 14, opacity: 0.7, fontFamily: sans(400) }}> GNF</Text></Text>
              ) : (
                <Text style={{ fontFamily: FONT.display, fontSize: 30, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>{t('Indisponible')}</Text>
              )}
              <Text style={{ fontSize: 11, color: '#fff', opacity: 0.55, marginTop: 2 }}>{t('Commandes livrées et payées')}</Text>

              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 14 }} />
              <Text style={{ fontSize: 10.5, color: '#fff', opacity: 0.75, fontFamily: sans(700), marginBottom: 8 }}>{t('Cette semaine')}</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <EarningsCell label={t('Confirmés')} sub={t('Livrés & payés')} value={data?.earnings?.week?.confirmed} color="#7BE0AE" ok={ok} />
                <EarningsCell label={t('En attente')} sub={t('En cours de livraison')} value={data?.earnings?.week?.pending} color="#FFC37A" ok={ok} />
              </View>
              <Text style={{ fontSize: 10.5, color: '#fff', opacity: 0.75, fontFamily: sans(700), marginTop: 14, marginBottom: 8 }}>{t('Ce mois')}</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <EarningsCell label={t('Confirmés')} sub={t('Livrés & payés')} value={data?.earnings?.month?.confirmed} color="#7BE0AE" ok={ok} />
                <EarningsCell label={t('En attente')} sub={t('En cours de livraison')} value={data?.earnings?.month?.pending} color="#FFC37A" ok={ok} />
              </View>
              <View style={{ marginTop: 14 }}>
                <EarningsCell label={t('Ventes brutes (mois)')} sub={t('Total des commandes, avant commission')} value={data?.gross_sales?.month} color="#fff" ok={ok} />
              </View>
            </View>
          </View>

          {/* New orders banner */}
          {newOrders > 0 && (
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Pressable onPress={() => nav.navigate('VendorOrders')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.accent, borderRadius: 14, padding: 14 }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}><Icon name="package" size={18} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: sans(700), color: '#fff' }}>{newOrders > 1 ? t('{n} nouvelles commandes', { n: newOrders }) : t('{n} nouvelle commande', { n: newOrders })}</Text>
                  <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.85, marginTop: 2 }}>{t('À traiter maintenant')}</Text>
                </View>
                <Icon name="arrowR" size={16} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Recent orders */}
          <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{t('Commandes récentes')}</Text>
              <Pressable onPress={() => nav.navigate('VendorOrders')}><Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>{t('Voir tout')}</Text></Pressable>
            </View>
            <View style={{ gap: 10 }}>
              {orders.length === 0 ? (
                <Text style={{ fontSize: 12.5, color: LMX.ink50 }}>{t("Aucune commande pour l'instant.")}</Text>
              ) : orders.map(o => (
                <Pressable key={o.id} onPress={() => nav.navigate('VendorOrders')} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 12, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="package" size={18} color={LMX.ink} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>#{o.number} · {o.billing?.first_name} {o.billing?.last_name}</Text>
                    <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{t('{n} article(s)', { n: o.item_count })} · {t(o.status_label)}</Text>
                  </View>
                  <Text style={{ fontFamily: mono(600), fontSize: 12.5 }}>{fr(o.total)}<Text style={{ fontSize: 9, color: LMX.ink50 }}> GNF</Text></Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Manage */}
          <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600), marginBottom: 10 }}>{t('Gérer ma boutique')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { icon: 'package' as const,    label: 'Commandes',          to: 'VendorOrders' },
                { icon: 'storefront' as const, label: 'Mes produits',       to: 'VendorProducts' },
                { icon: 'plus' as const,       label: 'Ajouter un produit', to: 'AddProduct' },
                { icon: 'settings' as const,   label: 'Boutique',           to: 'VendorStore' },
              ].map(a => (
                <Pressable key={a.to} onPress={() => nav.navigate(a.to)} style={{ width: '47.5%', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={a.icon} size={18} color={LMX.ink} /></View>
                  <Text style={{ flex: 1, fontSize: 12.5, fontFamily: sans(600) }}>{t(a.label)}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Advanced → website */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <Pressable onPress={openWebDashboard} style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: LMX.hairline }}>
              <Icon name="storefront" size={18} color={LMX.brand} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{t('Retraits, rapports & réglages')}</Text>
                <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{t('Gérer sur le site web')}</Text>
              </View>
              <Icon name="arrowR" size={15} color={LMX.ink50} />
            </Pressable>
          </View>
        </>
      )}
      </ScrollView>
    </Screen>
  );
}

// ── Vendor: my products (list / edit / delete) ─────────────────
export function ScreenVendorProducts() {
  const nav = useNavigation<any>();
  const [items, setItems]   = useState<ApiProduct[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await get<{ products: ApiProduct[] }>('/vendor/products', true); setItems(r.products ?? []); }
    catch (e) { setError(friendlyError(e, t('Erreur de chargement.'))); }
    finally { setLoad(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  const del = (p: ApiProduct) => {
    Alert.alert(t('Supprimer'), t('Supprimer « {name} » ?', { name: decodeEntities(p.name) }), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Supprimer'), style: 'destructive', onPress: async () => {
        try { await post(`/vendor/products/${p.id}/delete`, {}, true); load(); }
        catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t('Échec de la suppression.'))); }
      }},
    ]);
  };

  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="plus" onPress={() => nav.navigate('AddProduct')}>{t('Ajouter un produit')}</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Mes produits')} />
      {loading ? (
        <View style={{ paddingTop: 50 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : error ? (
        <View style={{ alignItems: 'center', paddingTop: 44, gap: 10, paddingHorizontal: 32 }}>
          <Icon name="close" size={40} color={LMX.rose} />
          <Text style={{ fontSize: 13.5, color: LMX.ink70, textAlign: 'center' }}>{error}</Text>
          <Button variant="ghost" size="md" onPress={() => { setLoad(true); load(); }}>{t('Réessayer')}</Button>
        </View>
      ) : items.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 50, gap: 12 }}>
          <Icon name="storefront" size={44} color={LMX.ink30} />
          <Text style={{ fontSize: 14, color: LMX.ink70 }}>{t("Aucun produit pour l'instant.")}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {items.map(p => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 12, borderWidth: 1, borderColor: LMX.border }}>
              {p.image
                ? <Image source={{ uri: p.image }} style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: LMX.surfaceAlt }} />
                : <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bag" size={18} color={LMX.ink30} /></View>}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600) }}>{decodeEntities(p.name)}</Text>
                <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{fr(p.price)} GNF · {p.in_stock ? t('En stock') : t('Rupture')}</Text>
              </View>
              <Pressable onPress={() => nav.navigate('ProductDetail', { productId: p.id })} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="eye" size={15} color={LMX.ink} /></Pressable>
              <Pressable onPress={() => nav.navigate('VendorEditProduct', { product: p })} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="pencil" size={15} color={LMX.ink} /></Pressable>
              <Pressable onPress={() => del(p)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={15} color={LMX.rose} /></Pressable>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

// ── Product video (uploaded file or YouTube / Vimeo link) ──────
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_LINK_RE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\/.+/i;

interface ProductVideo {
  /** Remote URL: an uploaded file or a YouTube/Vimeo link ('' = none). */
  url: string;
  id?: number;
  /** Picked from the library, uploaded on save. */
  local?: { uri: string; name: string; type?: string; size?: number };
}

const isLinkVideo = (url: string) => VIDEO_LINK_RE.test(url);

/** Uploads a picked video if needed → the fields the create/update endpoints expect. */
async function resolveVideo(v: ProductVideo): Promise<{ video_url: string; video_id?: number }> {
  if (v.local) {
    const r = await vendorApi.uploadMedia(v.local.uri, { name: v.local.name, type: v.local.type });
    return { video_url: r.url, video_id: r.id };
  }
  return v.id ? { video_url: v.url, video_id: v.id } : { video_url: v.url };
}

async function pickImageUris(remaining: number): Promise<string[]> {
  if (remaining <= 0) return [];
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) { Alert.alert(t('Permission requise'), t("Autorisez l'accès aux photos pour ajouter des images.")); return []; }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: 0.7 });
  return res.canceled ? [] : res.assets.map(a => a.uri).slice(0, remaining);
}

function ProductVideoField({ value, onChange, uploading }: { value: ProductVideo; onChange: (v: ProductVideo) => void; uploading: boolean }) {
  const [link, setLink] = useState('');

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('Permission requise'), t("Autorisez l'accès à vos vidéos.")); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: false, quality: 1 });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    if (a.fileSize && a.fileSize > MAX_VIDEO_BYTES) {
      Alert.alert(t('Vidéo trop lourde'), t('Cette vidéo fait {mb} Mo. La taille maximale est de 50 Mo : raccourcissez-la ou utilisez un lien YouTube / Vimeo.', { mb: Math.round(a.fileSize / 1048576) }));
      return;
    }
    const ext = (a.uri.split('.').pop() || 'mp4').toLowerCase();
    onChange({ url: '', local: { uri: a.uri, name: a.fileName || `video-${Date.now()}.${ext.length <= 4 ? ext : 'mp4'}`, type: a.mimeType ?? undefined, size: a.fileSize ?? undefined } });
  };

  const addLink = () => {
    let url = link.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (!isLinkVideo(url)) { Alert.alert(t('Lien invalide'), t('Collez un lien YouTube ou Vimeo (ex. https://youtu.be/…).')); return; }
    onChange({ url });
    setLink('');
  };

  const remove = () => onChange({ url: '' });
  const has = !!value.local || !!value.url;

  return (
    <View>
      <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>{t('Vidéo du produit')} <Text style={{ color: LMX.ink50 }}>{t('(optionnel)')}</Text></Text>
      {has ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, padding: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}>
            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="eye" size={18} color="#fff" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>
              {uploading ? t('Téléversement de la vidéo…') : value.local ? t('Vidéo sélectionnée') : isLinkVideo(value.url) ? t('Lien vidéo') : t('Vidéo actuelle')}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>
              {value.local
                ? `${value.local.name}${value.local.size ? ` · ${(value.local.size / 1048576).toFixed(1)} Mo` : ''} · ${t("envoyée à l'enregistrement")}`
                : value.url}
            </Text>
          </View>
          {!uploading && (
            <Pressable onPress={remove} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={15} color={LMX.rose} />
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Pressable onPress={pickVideo} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', backgroundColor: LMX.surface }}>
            <Icon name="plus" size={16} color={LMX.ink70} />
            <Text style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink70 }}>{t('Choisir une vidéo (max 50 Mo)')}</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surface, paddingHorizontal: 14, justifyContent: 'center' }}>
              <TextInput value={link} onChangeText={setLink} placeholder={t('ou collez un lien YouTube / Vimeo')} placeholderTextColor={LMX.ink50} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={{ fontSize: 13.5, color: LMX.ink, fontFamily: sans(400), padding: 0 }} />
            </View>
            <Button variant="soft" size="md" onPress={addLink} disabled={!link.trim()}>{t('Ajouter')}</Button>
          </View>
        </View>
      )}
    </View>
  );
}

export function ScreenVendorEditProduct() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const product: ApiProduct = route.params?.product;
  const [name, setName]               = useState(decodeEntities(product?.name ?? ''));
  const [description, setDescription] = useState(decodeEntities(product?.description ?? ''));
  const [price, setPrice]             = useState(String(Math.round(product?.price ?? 0)));
  const [stock, setStock]             = useState('');
  const [published, setPublished]     = useState(true);
  const [bulky, setBulky]             = useState(!!product?.bulky);
  // Each slot is an existing image (has id) or a newly picked one (uri only, uploaded on save)
  const [slots, setSlots] = useState<{ id?: number; uri: string }[]>(
    (product?.image_ids ?? []).map((id, i) => ({ id, uri: (product?.images ?? [])[i] ?? '' })).filter(s => s.uri)
  );
  const [video, setVideo]     = useState<ProductVideo>({ url: product?.video ?? '' });
  const [saving, setSaving]   = useState(false);
  const [progress, setProgress] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);

  const pickImages = async () => {
    const uris = await pickImageUris(MAX_PRODUCT_PHOTOS - slots.length);
    if (uris.length) setSlots(prev => [...prev, ...uris.map(uri => ({ uri }))].slice(0, MAX_PRODUCT_PHOTOS));
  };

  const save = async () => {
    const p = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (!name.trim()) { Alert.alert(t('Nom requis'), t('Entrez le nom.')); return; }
    if (!p || p <= 0) { Alert.alert(t('Prix invalide'), t('Entrez un prix valide.')); return; }
    setSaving(true);
    try {
      // Build the full ordered image set (upload any new photos, keep existing IDs)
      const image_ids: number[] = [];
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.id) { image_ids.push(s.id); continue; }
        setProgress(t('Téléversement photo {i}/{n}…', { i: i + 1, n: slots.length }));
        const up = await vendorApi.uploadMedia(s.uri);
        image_ids.push(up.id);
        setSlots(prev => prev.map((x, idx) => (idx === i ? { id: up.id, uri: x.uri } : x)));
      }
      if (video.local) { setProgress(t('Téléversement de la vidéo…')); setVideoUploading(true); }
      const videoFields = await resolveVideo(video);
      setVideoUploading(false);
      if (video.local) setVideo({ url: videoFields.video_url, id: videoFields.video_id });
      setProgress(t('Enregistrement…'));
      await post(`/vendor/products/${product.id}/update`, {
        name, description, price: p,
        stock: stock ? parseInt(stock, 10) : undefined,
        status: published ? 'publish' : 'draft',
        bulky,
        image_ids, // full ordered set; empty clears all
        ...videoFields, // video_url '' clears the video
      }, true);
      Alert.alert(t('Enregistré'), t('Produit mis à jour.'), [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t("Échec de l'enregistrement."))); }
    finally { setSaving(false); setProgress(''); setVideoUploading(false); }
  };

  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="check" onPress={save} disabled={saving}>{saving ? (progress || t('Enregistrement...')) : t('Enregistrer')}</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Modifier le produit')} />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 14 }}>
        {/* Photos — add / remove / reorder (first = main) */}
        <View>
          <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>{t('Photos')} ({slots.length}/{MAX_PRODUCT_PHOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {slots.map((s, i) => (
              <View key={s.uri + i} style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: LMX.surfaceAlt }}>
                <Image source={{ uri: s.uri }} style={{ width: '100%', height: '100%' }} />
                <Pressable onPress={() => setSlots(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={12} color="#fff" /></Pressable>
                {i === 0 && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: LMX.brand, paddingVertical: 2, alignItems: 'center' }}><Text style={{ fontSize: 8, color: '#fff', fontFamily: sans(700) }}>{t('PRINCIPALE')}</Text></View>}
              </View>
            ))}
            {slots.length < MAX_PRODUCT_PHOTOS && (
              <Pressable onPress={pickImages} style={{ width: 84, height: 84, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: LMX.surface }}>
                <Icon name="plus" size={22} color={LMX.ink70} />
                <Text style={{ fontSize: 10, color: LMX.ink70, fontFamily: sans(600) }}>{t('Ajouter')}</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        <ProductVideoField value={video} onChange={setVideo} uploading={videoUploading} />

        <Field label={t('Nom du produit')} value={name} onChangeText={setName} />
        <Field label={t('Description')} value={description} onChangeText={setDescription} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label={t('Prix (GNF)')} value={price} onChangeText={setPrice} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label={t('Stock')} value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder={t('Inchangé')} /></View>
        </View>
        <View style={{ backgroundColor: LMX.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{t('Publié')}</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{t('Visible par les clients')}</Text>
          </View>
          <Pressable onPress={() => setPublished(v => !v)}>
            <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: published ? LMX.emerald : LMX.ink10, justifyContent: 'center' }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', marginLeft: published ? 20 : 2 }} />
            </View>
          </Pressable>
        </View>
        <BulkySwitch value={bulky} onChange={setBulky} />
      </View>
    </Screen>
  );
}

// ── Vendor: orders ─────────────────────────────────────────────
const VENDOR_STAGES: { key: string; label: string }[] = [
  { key: 'processing', label: 'En préparation' },
  { key: 'packed', label: 'Emballé' },
  { key: 'ready-dispatch', label: 'Confirmée' },
];

export function ScreenVendorOrders() {
  const nav = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await get<{ orders: Order[] }>('/vendor/orders', true); setOrders(r.orders ?? []); }
    catch (e) { setError(friendlyError(e, t('Erreur de chargement.'))); }
    finally { setLoad(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Commandes')} right={<IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />} />
      {loading ? (
        <View style={{ paddingTop: 50 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : error ? (
        <View style={{ alignItems: 'center', paddingTop: 44, gap: 10, paddingHorizontal: 32 }}>
          <Icon name="close" size={40} color={LMX.rose} />
          <Text style={{ fontSize: 13.5, color: LMX.ink70, textAlign: 'center' }}>{error}</Text>
          <Button variant="ghost" size="md" onPress={() => { setLoad(true); load(); }}>{t('Réessayer')}</Button>
        </View>
      ) : orders.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 50, gap: 12 }}>
          <Icon name="package" size={44} color={LMX.ink30} />
          <Text style={{ fontSize: 14, color: LMX.ink70 }}>{t('Aucune commande.')}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {orders.map(o => (
            <Pressable key={o.id} onPress={() => nav.navigate('VendorOrder', { order: o })} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: mono(600), fontSize: 13 }}>#{o.number}</Text>
                  <Text style={{ fontSize: 10, color: LMX.brand, fontFamily: sans(700), textTransform: 'uppercase' }}>{t(o.status_label)}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600), marginTop: 4 }}>{o.billing?.first_name} {o.billing?.last_name}</Text>
                <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{t('{n} article(s)', { n: o.item_count })} · {fr(o.total)} GNF</Text>
              </View>
              <Icon name="chevR" size={16} color={LMX.ink50} />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

// ── Vendor: order detail (full info + status) ──────────────────
export function ScreenVendorOrder() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [order, setOrder] = useState<Order | undefined>(route.params?.order);
  const [busy, setBusy]   = useState(false);
  const [pickupCode, setPickupCode] = useState('');

  if (!order) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Commande')} />
        <View style={{ padding: 24 }}><Text style={{ color: LMX.ink50 }}>{t('Commande introuvable.')}</Text></View>
      </Screen>
    );
  }

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      const res = await post<{ order: Order }>(`/vendor/orders/${order.id}/status`, { status }, true);
      const updated = res?.order ?? { ...order, status, status_label: status };
      setOrder(updated);
      Alert.alert(t('Statut mis à jour'), t('La commande est maintenant : {status}.', { status: t(updated.status_label) }));
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t('Échec de la mise à jour.'))); }
    finally { setBusy(false); }
  };

  // Store marks the parcel packed / ready for pickup (a flag — the order status does not change).
  const togglePacked = async () => {
    const packed = !order.packed_at;
    setBusy(true);
    try {
      const res = await vendorApi.markPacked(order.id, packed);
      if (res?.order) setOrder(res.order);
      Alert.alert(packed ? t('Colis prêt') : t('Marque retirée'), res?.message || '');
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t('Échec de la mise à jour.'))); }
    finally { setBusy(false); }
  };
  const packedTime = order.packed_at
    ? new Date(order.packed_at.replace(' ', 'T')).toLocaleString(locale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  // Store verifies the driver's pickup code to hand over the order.
  const verifyPickup = async () => {
    const code = pickupCode.trim();
    if (code.length < 4) { Alert.alert(t('Code requis'), t('Saisissez le code à 4 chiffres communiqué par le livreur.')); return; }
    setBusy(true);
    try {
      const res = await post<{ order: Order }>(`/vendor/orders/${order!.id}/verify-pickup`, { code }, true);
      if (res?.order) setOrder(res.order);
      setPickupCode('');
      Alert.alert(t('Ramassage confirmé'), t('Le livreur est vérifié. La commande lui a été remise.'));
    } catch (e) {
      const wrongCode = isApiError(e) && e.kind === 'api';
      Alert.alert(wrongCode ? t('Code incorrect') : t('Vérification impossible'), friendlyError(e, t('Le code du livreur est incorrect.')));
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <LoadingOverlay visible={busy} message={t('Traitement…')} />
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Commande #{n}', { n: order.number })} />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        {/* Status + total */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
          <View>
            <Text style={{ fontSize: 10, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Statut')}</Text>
            <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.brand, marginTop: 2 }}>{t(order.status_label)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Total')}</Text>
            <Text style={{ fontFamily: mono(700), fontSize: 16, marginTop: 2 }}>{fr(order.total)} GNF</Text>
          </View>
        </View>

        {/* Packed / ready for pickup — tells logistics, the partner and the driver the parcel can be collected. */}
        {(order.can_mark_packed || !!order.packed_at) && (
          <View style={{ backgroundColor: order.packed_at ? LMX.emeraldSoft : LMX.accentSoft, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: (order.packed_at ? LMX.emerald : LMX.accent) + '55', padding: 16, gap: 8 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(700), color: LMX.ink }}>
              {order.packed_at ? `✓ ${t('Emballée et prête pour le ramassage')}` : `📦 ${t('Le colis est-il prêt ?')}`}
            </Text>
            <Text style={{ fontSize: 11.5, color: LMX.ink70, lineHeight: 16 }}>
              {order.packed_at
                ? `${t('Emballée le {time}.', { time: packedTime })} ${t("Le livreur et l'équipe de livraison sont prévenus.")}`
                : t('Marquez la commande comme emballée quand le colis est prêt, pour que le livreur vienne au bon moment.')}
            </Text>
            {order.can_mark_packed && (
              <Button variant={order.packed_at ? 'ghost' : 'accent'} size="md" icon={order.packed_at ? undefined : 'check'} onPress={togglePacked} disabled={busy}>
                {order.packed_at ? t('Annuler « emballée »') : t('Marquer comme emballée')}
              </Button>
            )}
          </View>
        )}

        {/* Pickup verification — store enters the DRIVER's code to confirm his identity and
            hand over the order. Proves he's the driver Loomodex assigned. */}
        {order.pickup_pending && (
          <View style={{ backgroundColor: LMX.accentSoft, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.accent + '55', padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 12, fontFamily: sans(700), color: LMX.ink }}>📦 {t('Vérifier le livreur')}</Text>
            <Text style={{ fontSize: 11.5, color: LMX.ink70, lineHeight: 16 }}>
              {t('Demandez au livreur son code de ramassage à 4 chiffres et saisissez-le pour lui remettre la commande.')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surface, paddingHorizontal: 14, justifyContent: 'center' }}>
                <TextInput value={pickupCode} onChangeText={setPickupCode} keyboardType="number-pad" maxLength={4} placeholder="••••" placeholderTextColor={LMX.ink50} style={{ fontFamily: mono(600), fontSize: 18, letterSpacing: 6, color: LMX.ink, padding: 0 }} />
              </View>
              <Button variant="accent" size="md" icon="check" onPress={verifyPickup} disabled={busy || pickupCode.trim().length < 4}>{t('Confirmer')}</Button>
            </View>
          </View>
        )}

        {/* Order info — customer phone/address are hidden from the store for privacy;
            delivery contact & location are handled by the Loomodex delivery side. */}
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, gap: 10 }}>
          <LogiRow icon="user" label={t('Client')} value={order.billing?.first_name || '—'} />
          {!!order.payment_method && <LogiRow icon="money" label={t('Paiement')} value={order.payment_method} />}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: LMX.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Icon name="shield" size={13} color={LMX.ink50} />
            <Text style={{ flex: 1, fontSize: 10.5, color: LMX.ink50, lineHeight: 14 }}>{t('Coordonnées client gérées par la livraison Loomodex.')}</Text>
          </View>
        </View>

        {/* Driver / pickup — so the vendor can follow who collected the order and when */}
        {!!order.driver && (
          <View style={{ backgroundColor: LMX.brandSoft, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.brand + '33', padding: 14, gap: 8 }}>
            <Text style={{ fontSize: 11, color: LMX.brandDeep, textTransform: 'uppercase', fontFamily: sans(700) }}>{t('Livraison')}</Text>
            <LogiRow icon="bike" label={t('Livreur')} value={order.driver.name || '—'} />
            {!!order.pickup_time && <LogiRow icon="check" label={t('Récupéré')} value={new Date(order.pickup_time.replace(' ', 'T')).toLocaleString(locale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />}
            {!order.pickup_time && <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{t('En attente de récupération par le livreur.')}</Text>}
            {/* Driver assigned and on his way to the store: own pin + his live position (in-app). */}
            {!order.pickup_time && order.status === 'assigned-driver' && (
              <OrderLocationMap orderId={order.id} viewer="store" status={order.status} height={240} />
            )}
            {!!order.driver.phone && (
              <Pressable onPress={() => call(order.driver!.phone)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border }}>
                <Icon name="phone" size={14} color={LMX.ink} /><Text style={{ fontSize: 12, fontFamily: sans(600) }}>{t('Appeler le livreur')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Items */}
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>{t('Articles')}</Text>
          {(order.items ?? []).map(it => (
            <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
              <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink }}>{decodeEntities(it.name)} × {it.qty}</Text>
              <Text style={{ fontFamily: mono(600), fontSize: 12.5, color: LMX.ink70 }}>{fr(it.total)} GNF</Text>
            </View>
          ))}
        </View>

        {/* Status actions — the store controls the order only until a driver takes over.
            Once assigned/picked up, the delivery flow owns it and the store can't change it. */}
        {(!!order.driver || ['assigned-driver', 'out-delivery', 'driver-arrived', 'otp-pending', 'otp-verified', 'completed'].includes(order.status)) ? (
          <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="shield" size={16} color={LMX.ink50} />
            <Text style={{ flex: 1, fontSize: 12, color: LMX.ink70, lineHeight: 16 }}>
              {t('Commande prise en charge par le livreur. Le statut est désormais géré par la livraison et ne peut plus être modifié depuis la boutique.')}
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>{t('Mettre à jour le statut')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {VENDOR_STAGES.map(s => {
                const active = order.status === s.key;
                return (
                  <Pressable key={s.key} onPress={() => !active && setStatus(s.key)} disabled={busy} style={{ flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', backgroundColor: active ? LMX.brand : LMX.surfaceAlt, borderWidth: 1, borderColor: active ? LMX.brand : LMX.border }}>
                    <Text style={{ fontSize: 10.5, fontFamily: sans(600), color: active ? '#fff' : LMX.ink70 }}>{t(s.label)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

// ── Vendor: store settings (address + GPS pin + policies) ──────
export function ScreenVendorStore() {
  const nav = useNavigation<any>();
  const [name, setName]         = useState('');
  const [shipping, setShipping] = useState('');
  const [refund, setRefund]     = useState('');
  const [addr, setAddr]         = useState<StoreAddressValue>(EMPTY_STORE_ADDRESS);
  const [savedAddress, setSavedAddress] = useState('');
  const [pinConfirmed, setPinConfirmed] = useState(true);
  const [mapsKey, setMapsKey]   = useState('');
  const [loading, setLoad]      = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoad(true); setLoadError(null);
    vendorApi.store()
      .then(d => {
        setName(d.name ?? ''); setShipping(d.shipping_policy ?? ''); setRefund(d.refund_policy ?? '');
        const l = d.location;
        if (l) {
          setAddr({
            zone: l.zone ?? '', commune: l.commune ?? '', commune_name: l.commune_name ?? '',
            neighborhood: l.neighborhood ?? '', landmark: l.landmark ?? '', lat: l.lat ?? null, lng: l.lng ?? null,
          });
          setSavedAddress(l.address ?? '');
        }
        setPinConfirmed(true);
      })
      .catch(e => setLoadError(friendlyError(e)))
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => {
    load();
    configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {});
  }, [load]);

  const hasAddr = !!(addr.zone || addr.commune || addr.neighborhood || addr.landmark.trim());
  const hasPin  = addr.lat != null && addr.lng != null;

  const doSave = async () => {
    setSaving(true);
    try {
      const res = await vendorApi.updateStore({
        shipping_policy: shipping, refund_policy: refund,
        ...(hasAddr ? { zone: addr.zone, commune: addr.commune, commune_name: addr.commune_name, neighborhood: addr.neighborhood, landmark: addr.landmark.trim() } : {}),
        ...(hasPin ? { lat: addr.lat, lng: addr.lng } : {}),
      });
      if (res?.location) setSavedAddress(res.location.address ?? '');
      setPinConfirmed(true);
      Alert.alert(t('Enregistré'), res?.message || t('Boutique mise à jour.'), [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t("Échec de l'enregistrement."))); }
    finally { setSaving(false); }
  };

  const save = () => {
    if (hasAddr) {
      const missing =
        !addr.zone             ? t('la zone') :
        !addr.commune          ? t('la commune') :
        !addr.neighborhood     ? t('le quartier') :
        !addr.landmark.trim()  ? t('le point de repère') : '';
      if (missing) { Alert.alert(t('Adresse incomplète'), t('Veuillez renseigner {field}.', { field: missing })); return; }
    }
    if (hasPin && !pinConfirmed) {
      Alert.alert(t('Position non validée'), t('Le pin du magasin a été déplacé. Valider cette position ?'), [
        { text: t('Annuler'), style: 'cancel' },
        { text: t('Valider et enregistrer'), onPress: () => { setPinConfirmed(true); doSave(); } },
      ]);
      return;
    }
    doSave();
  };

  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="check" onPress={save} disabled={saving || loading || !!loadError}>{saving ? t('Enregistrement...') : t('Enregistrer')}</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Ma boutique')} />
      {loading ? <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} /></View> : loadError ? (
        <View style={{ alignItems: 'center', paddingTop: 44, gap: 10, paddingHorizontal: 32 }}>
          <Icon name="close" size={40} color={LMX.rose} />
          <Text style={{ fontSize: 13.5, color: LMX.ink70, textAlign: 'center' }}>{loadError}</Text>
          <Button variant="ghost" size="md" onPress={load}>{t('Réessayer')}</Button>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 14 }}>
          {!!name && <Text style={{ fontSize: 16, fontFamily: sans(700), color: LMX.ink }}>{decodeEntities(name)}</Text>}

          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="storefront" size={16} color={LMX.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontFamily: sans(700), color: LMX.ink }}>{t('Adresse de la boutique')}</Text>
                <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 1 }}>{t("Le livreur s'en sert pour venir récupérer vos commandes.")}</Text>
              </View>
            </View>
            {!!savedAddress && (
              <View style={{ flexDirection: 'row', gap: 7, backgroundColor: LMX.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
                <Icon name="pin" size={13} color={LMX.ink50} />
                <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70, lineHeight: 16 }}>{t('Actuelle : {addr}', { addr: decodeEntities(savedAddress) })}</Text>
              </View>
            )}
            <StoreAddressForm value={addr} onChange={setAddr} confirmed={pinConfirmed} onConfirmedChange={setPinConfirmed} mapsKey={mapsKey} />
          </View>

          <Field label={t('Politique de livraison')} value={shipping} onChangeText={setShipping} placeholder={t('Décrivez vos délais et conditions de livraison')} />
          <Field label={t('Politique de remboursement')} value={refund} onChangeText={setRefund} placeholder={t('Décrivez vos conditions de retour / remboursement')} />
        </View>
      )}
    </Screen>
  );
}


/** "Colis volumineux": adds the bulky surcharge to the delivery quote. */
function BulkySwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={{ backgroundColor: LMX.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="package" size={15} color={LMX.ink} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{t('Colis volumineux')}</Text>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{t('Article encombrant ou lourd : un supplément de livraison s’applique')}</Text>
      </View>
      <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: value ? LMX.emerald : LMX.ink10, justifyContent: 'center' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', marginLeft: value ? 20 : 2 }} />
      </View>
    </Pressable>
  );
}

function ProductToggle({ icon, label, sub, on, last }: any) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={15} color={LMX.ink} /></View>
      <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontFamily: sans(600) }}>{label}</Text><Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{sub}</Text></View>
      <Toggle on={on} />
    </View>
  );
}

export function ScreenAddProduct() {
  const nav = useNavigation<any>();
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]             = useState('');
  const [stock, setStock]             = useState('');
  const [categoryId, setCategoryId]   = useState('');
  const [bulky, setBulky]             = useState(false);
  const [cats, setCats]               = useState<any[]>([]);
  const [images, setImages]           = useState<string[]>([]);
  const [video, setVideo]             = useState<ProductVideo>({ url: '' });
  const [saving, setSaving]           = useState(false);
  const [progress, setProgress]       = useState('');
  const [videoUploading, setVideoUploading] = useState(false);

  useEffect(() => {
    get<{ categories: any[] }>('/categories').then(r => setCats(r.categories ?? [])).catch(() => {});
  }, []);

  const pickImages = async () => {
    const uris = await pickImageUris(MAX_PRODUCT_PHOTOS - images.length);
    if (uris.length) setImages(prev => [...prev, ...uris].slice(0, MAX_PRODUCT_PHOTOS));
  };

  const submit = async () => {
    const p = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (!name.trim())  { Alert.alert(t('Nom requis'), t('Entrez le nom du produit.')); return; }
    if (!p || p <= 0)  { Alert.alert(t('Prix invalide'), t('Entrez un prix valide.')); return; }
    setSaving(true);
    try {
      // Upload images to the media library first → collect attachment IDs.
      // Errors surface (instead of silently creating an imageless product).
      const imageIds: number[] = [];
      for (let i = 0; i < images.length; i++) {
        setProgress(t('Téléversement photo {i}/{n}…', { i: i + 1, n: images.length }));
        imageIds.push((await vendorApi.uploadMedia(images[i])).id);
      }
      if (video.local) { setProgress(t('Téléversement de la vidéo…')); setVideoUploading(true); }
      const videoFields = await resolveVideo(video);
      setVideoUploading(false);
      if (video.local) setVideo({ url: videoFields.video_url, id: videoFields.video_id });
      setProgress(t('Publication…'));
      await post('/vendor/products/create', {
        name, description, price: p,
        stock: stock ? parseInt(stock, 10) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        bulky,
        image_ids: imageIds,
        ...(videoFields.video_url ? videoFields : {}),
      }, true);
      Alert.alert(t('Publié'), t('Votre produit a été publié.'), [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e) {
      Alert.alert(t('Erreur'), friendlyError(e, t('Échec de la publication.')));
    } finally { setSaving(false); setProgress(''); setVideoUploading(false); }
  };

  return (
    <Screen footer={
      <Button full variant="accent" size="lg" icon="check" onPress={submit} disabled={saving}>
        {saving ? (progress || t('Publication...')) : t('Publier le produit')}
      </Button>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Ajouter un produit')} />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 14 }}>
        {/* Gallery */}
        <View>
          <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>{t('Photos')} ({images.length}/{MAX_PRODUCT_PHOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {images.map((uri, i) => (
              <View key={uri + i} style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: LMX.surfaceAlt }}>
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                <Pressable onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="close" size={12} color="#fff" />
                </Pressable>
                {i === 0 && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: LMX.brand, paddingVertical: 2, alignItems: 'center' }}><Text style={{ fontSize: 8, color: '#fff', fontFamily: sans(700) }}>{t('PRINCIPALE')}</Text></View>}
              </View>
            ))}
            {images.length < MAX_PRODUCT_PHOTOS && (
              <Pressable onPress={pickImages} style={{ width: 84, height: 84, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: LMX.surface }}>
                <Icon name="plus" size={22} color={LMX.ink70} />
                <Text style={{ fontSize: 10, color: LMX.ink70, fontFamily: sans(600) }}>{t('Ajouter')}</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        <ProductVideoField value={video} onChange={setVideo} uploading={videoUploading} />

        <Field label={t('Nom du produit') + ' *'} value={name} onChangeText={setName} placeholder={t('ex. Sac à main en cuir')} />
        <Field label={t('Description')} value={description} onChangeText={setDescription} placeholder={t('Décrivez votre produit')} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label={t('Prix (GNF)') + ' *'} value={price} onChangeText={setPrice} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label={t('Stock')} value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder={t('Optionnel')} /></View>
        </View>
        <Picker
          label={t('Catégorie')} value={categoryId} onChange={setCategoryId}
          placeholder={t('Sélectionner une catégorie')}
          options={cats.map(c => ({ value: String(c.id), label: decodeEntities(c.name ?? c.label ?? '') }))}
        />
        <BulkySwitch value={bulky} onChange={setBulky} />
      </View>
    </Screen>
  );
}

function DriverStat({ value, label }: { value: string; label: string }) {
  return <View><Text style={{ fontFamily: mono(600), fontSize: 16, color: '#fff' }}>{value}</Text><Text style={{ fontSize: 9.5, color: '#fff', opacity: 0.65, marginTop: 2, textTransform: 'uppercase', fontFamily: sans(600) }}>{label}</Text></View>;
}

// ── Driver dashboard (JWT /driver/*) ───────────────────────────
const DRIVER_TABS: { key: 'active' | 'history' | 'failed'; label: string; icon: any }[] = [
  { key: 'active',  label: 'Actives',  icon: 'bike' },
  { key: 'history', label: 'Livrées',  icon: 'check' },
  { key: 'failed',  label: 'Échecs',   icon: 'close' },
];

const call     = (phone?: string) => { if (phone) Linking.openURL(`tel:${phone}`).catch(() => {}); };
const whatsapp = (num?: string) => { const c = (num || '').replace(/[^0-9]/g, ''); if (c) Linking.openURL(`https://wa.me/${c}`).catch(() => {}); };

// sms: URL differs between platforms (iOS uses & before body, Android uses ?)
const smsLink = (phone: string, body: string) => {
  const num = (phone || '').replace(/[^0-9+]/g, '');
  const sep = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${num}${sep}body=${encodeURIComponent(body)}`;
};

/**
 * Ask the recipient to share their live location. Fires the automatic Twilio SMS if it's
 * configured; otherwise lets the driver / logistics manager send the link themselves —
 * open their SMS app pre-filled, or copy it for WhatsApp / any messenger.
 */
async function promptSendLocation(orderId: number) {
  try {
    const res = await driverApi.requestLocation(orderId);
    const msg = `Loomodex : partagez votre position exacte pour votre livraison en un tap : ${res.url}`;
    const copy = { text: t('Copier le lien'), onPress: async () => { await Clipboard.setStringAsync(res.url); Alert.alert(t('Copié'), t('Lien copié. Collez-le dans WhatsApp ou un autre message.')); } };
    const wa = { text: 'WhatsApp', onPress: () => {
      const num = (res.phone || '').replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`).catch(() => {});
    } };
    if (res.sms_sent) {
      Alert.alert(
        t('Demande envoyée'),
        t("Un SMS avec le lien de partage de position a été envoyé au {phone}. Sa position apparaîtra sur la carte dès qu'il l'aura partagé.\n\nVous pouvez aussi lui envoyer le lien vous-même :", { phone: res.phone }),
        [copy, wa, { text: 'OK', style: 'cancel' }]
      );
      return;
    }
    Alert.alert(
      t('Envoyer le lien de position'),
      t("Le SMS automatique n'est pas activé. Envoyez ce lien au destinataire ({phone}) :", { phone: res.phone }),
      [
        { text: t('Ouvrir SMS'), onPress: () => Linking.openURL(smsLink(res.phone, msg)).catch(() => {}) },
        copy,
        wa,
        { text: t('Annuler'), style: 'cancel' },
      ]
    );
  } catch (e) {
    Alert.alert(t('Envoi impossible'), friendlyError(e, t('Réessayez dans un instant.')));
  }
}

// Share the secure tracking link with the customer (copy / WhatsApp)
const copyTrackLink = async (o: DeliveryOrder) => {
  if (!o.track_url) return;
  await Clipboard.setStringAsync(o.track_url);
  Alert.alert(t('Copié'), t('Lien de suivi copié. Vous pouvez le coller au client.'));
};
const shareTrackWhatsApp = (o: DeliveryOrder) => {
  if (!o.track_url) return;
  const phone = (o.whatsapp || o.customer_phone || '').replace(/[^0-9]/g, '');
  const msg = `Bonjour, suivez votre commande #${o.number} en direct : ${o.track_url}`;
  const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  Linking.openURL(url).catch(() => {});
};

function TrackShareRow({ o }: { o: DeliveryOrder }) {
  if (!o.track_url) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable onPress={() => copyTrackLink(o)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt, borderWidth: 1, borderColor: LMX.border }}>
        <Icon name="receipt" size={14} color={LMX.ink} /><Text style={{ fontSize: 11.5, fontFamily: sans(600) }}>{t('Copier le lien')}</Text>
      </Pressable>
      <Pressable onPress={() => shareTrackWhatsApp(o)} style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: '#25D366' }}>
        <Icon name="phone" size={14} color="#fff" /><Text style={{ fontSize: 11.5, fontFamily: sans(600), color: '#fff' }}>{t('Partager le suivi')}</Text>
      </Pressable>
    </View>
  );
}

export function ScreenDriver() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [tab, setTab]         = useState<'active' | 'history' | 'failed'>('active');
  const [orders, setOrders]   = useState<DeliveryOrder[]>([]);
  const [summary, setSummary] = useState<DriverSummary | null>(null);
  const [loading, setLoad]    = useState(true);
  const [busyId, setBusy]     = useState<number | null>(null);
  const [otpInputs, setOtp]   = useState<Record<number, string>>({});
  const [available, setAvailable] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  const load = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([
        driverApi.orders(tab === 'active' ? undefined : tab),
        driverApi.summary(),
      ]);
      setOrders(o.orders ?? []);
      setSummary(s);
      setAvailable(s?.available !== false);
    } catch {}
    finally { setLoad(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', st => setAppActive(st === 'active'));
    return () => sub.remove();
  }, []);

  const toggleAvailable = async () => {
    const next = !available;
    setSwitching(true);
    setAvailable(next);
    try {
      const r = await driverApi.setAvailability(next);
      setAvailable(r?.available ?? next);
    } catch (e) {
      setAvailable(!next);
      Alert.alert(t('Erreur'), friendlyError(e, t('Impossible de changer votre disponibilité.')));
    } finally { setSwitching(false); }
  };

  // Broadcast live GPS while a delivery is in progress
  const inProgress = orders.some(o => ['out-delivery', 'driver-arrived'].includes(o.status));

  // While available and the app is open, report the position every ~60 s even without an
  // order so logistics can see who is nearby. Active deliveries use the faster watch below.
  useEffect(() => {
    if (!available || !appActive || inProgress) return;
    let cancelled = false;
    let granted = false;
    const send = async () => {
      if (!granted || cancelled) return;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) driverApi.updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? 0).catch(() => {});
      } catch {}
    };
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      granted = status === 'granted';
      send();
    })();
    const t = setInterval(send, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, [available, appActive, inProgress]);

  useEffect(() => {
    if (!inProgress || !appActive) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 12000, distanceInterval: 20 },
        pos => { driverApi.updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? 0).catch(() => {}); }
      );
    })();
    return () => { cancelled = true; if (sub) sub.remove(); };
  }, [inProgress, appActive]);

  const advance = async (o: DeliveryOrder, to: 'out-delivery' | 'driver-arrived') => {
    setBusy(o.id);
    try { await driverApi.updateStatus(o.id, to); await load(); }
    catch (e: any) { Alert.alert(t('Erreur'), e?.message ?? t('Action impossible.')); }
    finally { setBusy(null); }
  };

  const verifyOtp = async (o: DeliveryOrder) => {
    const code = (otpInputs[o.id] ?? '').trim();
    if (code.length < 4) { Alert.alert(t('Code requis'), t('Entrez le code à 4 chiffres communiqué par le client.')); return; }
    setBusy(o.id);
    try {
      const res = await ordersApi.verifyOtp(o.id, code);
      if (res.verified) { Alert.alert(t('Confirmé'), t('Livraison confirmée avec succès.')); setOtp(p => ({ ...p, [o.id]: '' })); await load(); }
      else Alert.alert(t('Code incorrect'), res.message ?? t('Veuillez réessayer.'));
    } catch (e: any) {
      Alert.alert(t('Code incorrect'), e?.message ?? t('Veuillez réessayer.'));
    } finally { setBusy(null); }
  };

  return (
    <Screen>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LMX.navy, alignItems: 'center', justifyContent: 'center' }}><Icon name="truck" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: sans(700) }}>{t('Tableau de bord livreur')}</Text>
            <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 1 }}>{`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || t('Livreur')}</Text>
          </View>
          <IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />
          <DashboardProfileBtn />
          <DashboardLogoutBtn />
        </View>
      </View>

      {/* Availability switch — unavailable = no new assignments, current orders stay */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <Pressable onPress={toggleAvailable} disabled={switching} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: available ? LMX.emerald + '66' : LMX.border, padding: 14, opacity: switching ? 0.7 : 1 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: available ? LMX.emerald : LMX.ink30 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{available ? t('Disponible') : t('Indisponible')}</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{available ? t('Vous pouvez recevoir de nouvelles commandes') : t('Touchez pour redevenir disponible')}</Text>
          </View>
          {switching ? <ActivityIndicator size="small" color={LMX.brand} /> : (
            <View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: available ? LMX.emerald : LMX.ink10, justifyContent: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', marginLeft: available ? 22 : 2 }} />
            </View>
          )}
        </Pressable>
        {!available && (
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: LMX.accentSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: LMX.accent + '44' }}>
            <Icon name="bell" size={14} color={LMX.accent} />
            <Text style={{ flex: 1, fontSize: 12, color: LMX.ink, fontFamily: sans(600) }}>{t('Vous ne recevrez pas de nouvelles commandes')}</Text>
          </View>
        )}
      </View>

      {/* Stats: Active / Today / Total / Failed */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
        <DriverStatCard value={summary?.active_count ?? 0}    label={t('Actives')} />
        <DriverStatCard value={summary?.trips_today ?? 0}     label={t("Aujourd'hui")} />
        <DriverStatCard value={summary?.total_delivered ?? 0} label={t('Total')} color={LMX.emerald} />
        <DriverStatCard value={summary?.failed_count ?? 0}    label={t('Échecs')} color={LMX.rose} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
        {DRIVER_TABS.map(tb => {
          const on = tab === tb.key;
          return (
            <Pressable key={tb.key} onPress={() => { setTab(tb.key); setLoad(true); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: on ? (tb.key === 'failed' ? LMX.rose : LMX.brand) : LMX.surface, borderWidth: 1, borderColor: on ? 'transparent' : LMX.border }}>
              <Icon name={tb.icon} size={13} color={on ? '#fff' : LMX.ink70} />
              <Text style={{ fontSize: 12, fontFamily: sans(700), color: on ? '#fff' : LMX.ink70 }}>{t(tb.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : orders.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 44, gap: 12 }}>
          <Icon name={tab === 'failed' ? 'close' : tab === 'history' ? 'check' : 'bike'} size={42} color={LMX.ink30} />
          <Text style={{ fontSize: 14, color: LMX.ink70 }}>
            {tab === 'active' ? t('Aucune livraison active.') : tab === 'history' ? t('Aucune livraison terminée.') : t('Aucun échec de livraison.')}
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 10 }}>
          {tab === 'active'
            ? orders.map(o => <DriverOrderRow key={o.id} o={o} onPress={() => nav.navigate('DriverOrder', { order: o })} />)
            : orders.map(o => <DriverDoneCard key={o.id} o={o} failed={tab === 'failed'} />)}
        </View>
      )}
    </Screen>
  );
}

function DriverStatCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: LMX.surface, borderRadius: 14, borderWidth: 1, borderColor: LMX.border, paddingVertical: 12, alignItems: 'center' }}>
      <Text style={{ fontFamily: mono(700), fontSize: 18, color: color ?? LMX.ink }}>{value}</Text>
      <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase', marginTop: 3 }}>{label}</Text>
    </View>
  );
}

function DriverInfoRow({ icon, children, color }: { icon: any; children: React.ReactNode; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <View style={{ marginTop: 1 }}><Icon name={icon} size={14} color={color ?? LMX.ink50} /></View>
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Text style={{ fontSize: 12.5, color: LMX.ink, lineHeight: 17 }}>{children}</Text> : children}</View>
    </View>
  );
}

function DriverOrderRow({ o, onPress }: { o: DeliveryOrder; onPress: () => void }) {
  const st = STATUS_STYLE[o.status] ?? { label: o.status_label, color: LMX.brand };
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: mono(600), fontSize: 13 }}>#{o.number}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: st.color + '1A' }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: st.color }} />
            <Text style={{ fontSize: 9.5, fontFamily: sans(700), color: st.color, textTransform: 'uppercase' }}>{t(st.label)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 }}>
          {!!o.customer_avatar && <Image source={{ uri: o.customer_avatar }} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: LMX.surfaceAlt }} />}
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{o.customer_name || t('Client')}</Text>
        </View>
        <Text numberOfLines={1} style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{o.zone_label || o.commune || o.city || 'Conakry'} · {fr(o.total)} GNF</Text>
      </View>
      <Icon name="chevR" size={16} color={LMX.ink50} />
    </Pressable>
  );
}

// Pickup: driver enters the code the store reads to them → confirms collection.
// Driver DISPLAYS his pickup code — he tells it to the store, who enters it to release the
// order. The order advances (to "on the way") when the store verifies it.
function PickupCodeDisplay({ code, onRefresh, refreshing }: { code?: string | null; onRefresh?: () => void; refreshing?: boolean }) {
  return (
    <View style={{ backgroundColor: LMX.accentSoft, borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: LMX.accent + '55', alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color: LMX.accent, textTransform: 'uppercase', fontFamily: sans(700), letterSpacing: 0.5 }}>{t('Votre code de ramassage')}</Text>
      {code ? (
        <>
          <Text style={{ fontFamily: mono(700), fontSize: 34, letterSpacing: 10, color: LMX.ink }}>{code}</Text>
          <Text style={{ fontSize: 11.5, color: LMX.ink70, textAlign: 'center', lineHeight: 16 }}>
            {t('Donnez ce code au magasin. Il le saisit pour vérifier votre identité et vous remettre la commande.')}
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink, marginVertical: 6 }}>{t('Code en cours de génération…')}</Text>
          {!!onRefresh && (
            <Pressable onPress={onRefresh} disabled={refreshing} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border, opacity: refreshing ? 0.6 : 1 }}>
              {refreshing ? <ActivityIndicator size="small" color={LMX.accent} /> : <Icon name="refresh" size={14} color={LMX.ink} />}
              <Text style={{ fontSize: 12, fontFamily: sans(600), color: LMX.ink }}>{t('Actualiser')}</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

function DriverActiveCard({ o, busy, otp, onOtp, onAdvance, onVerify, onLocationRequest, onRefreshPickup, refreshingPickup }: {
  o: DeliveryOrder; busy: boolean; otp: string;
  onOtp: (v: string) => void;
  onAdvance: (o: DeliveryOrder, to: 'out-delivery' | 'driver-arrived') => void;
  onVerify: (o: DeliveryOrder) => void;
  onLocationRequest: (o: DeliveryOrder) => void;
  onRefreshPickup?: () => void;
  refreshingPickup?: boolean;
}) {
  const st = STATUS_STYLE[o.status] ?? { label: o.status_label, color: LMX.brand };
  const showOtp = ['driver-arrived', 'otp-pending'].includes(o.status);

  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.number}</Text>
          <PackedPill packedAt={o.packed_at} status={o.status} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: st.color + '1A' }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: st.color }} />
          <Text style={{ fontSize: 10, fontFamily: sans(700), color: st.color, textTransform: 'uppercase' }}>{t(st.label)}</Text>
        </View>
      </View>

      <View style={{ padding: 14, gap: 11 }}>
        {o.status === 'assigned-driver' && <NotPackedNote packedAt={o.packed_at} status={o.status} audience="driver" />}
        {o.customer_avatar ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image source={{ uri: o.customer_avatar }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: LMX.surfaceAlt }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase' }}>{t('Client')}</Text>
              <Text style={{ fontSize: 13, fontFamily: sans(700), color: LMX.ink, marginTop: 1 }}>{o.customer_name || t('Client')}</Text>
            </View>
          </View>
        ) : (
          <DriverInfoRow icon="user"><Text style={{ fontSize: 13, fontFamily: sans(700) }}>{o.customer_name || t('Client')}</Text></DriverInfoRow>
        )}
        {!!o.zone_label && <DriverInfoRow icon="pin">{o.zone_label}</DriverInfoRow>}

        {/* Pickup */}
        <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(700), textTransform: 'uppercase', marginBottom: 3 }}>📦 {t('Adresse de retrait')}</Text>
          {!!o.pickup?.store && <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.ink }}>{decodeEntities(o.pickup.store)}</Text>}
          <Text style={{ fontSize: 12, color: LMX.ink70, marginTop: 1 }}>{o.pickup?.address || t('Adresse du vendeur indisponible')}</Text>
        </View>

        {/* Delivery */}
        <View style={{ backgroundColor: '#EAF1FF', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 9.5, color: LMX.brand, fontFamily: sans(700), textTransform: 'uppercase', marginBottom: 3 }}>📍 {t('Adresse de livraison')}</Text>
          <Text style={{ fontSize: 12.5, color: LMX.ink }}>{o.delivery_address || [o.commune, o.neighborhood].filter(Boolean).join(' — ') || 'Conakry'}</Text>
        </View>
        {!!o.landmark && <DriverInfoRow icon="pin" color={LMX.accent}>{o.landmark}</DriverInfoRow>}

        {/* Send Location Request — SMSes the recipient a one-tap link. Only useful
            once the driver is actually en route, so it appears from that point. */}
        {['out-delivery', 'driver-arrived', 'otp-pending'].includes(o.status) && (
          <Pressable
            onPress={() => onLocationRequest(o)}
            disabled={busy}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: LMX.accent,
              backgroundColor: LMX.accentSoft, opacity: busy ? 0.6 : 1,
            }}
          >
            <Icon name="location" size={15} color={LMX.accent} />
            <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.accent }}>
              {t('Demander la position')}
            </Text>
          </Pressable>
        )}

        {/* Payment */}
        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: o.payment === 'cod' ? '#FFF4E5' : LMX.emeraldSoft }}>
          <Icon name={o.payment === 'cod' ? 'money' : 'wallet'} size={13} color={o.payment === 'cod' ? LMX.accent : LMX.emerald} />
          <Text style={{ fontSize: 11.5, fontFamily: sans(700), color: o.payment === 'cod' ? LMX.accent : LMX.emerald }}>
            {o.payment === 'cod' ? `${t('Paiement à la livraison')} · ${fr(o.total)} GNF` : t('Déjà payé')}
          </Text>
        </View>

        {/* Items */}
        <View style={{ gap: 3 }}>
          {o.items.map((it, i) => (
            <Text key={i} style={{ fontSize: 12, color: LMX.ink70 }}>{decodeEntities(it.name)} × {it.qty}</Text>
          ))}
        </View>

        {/* Contact buttons — the driver talks to the recipient, who may not be the buyer */}
        {!!(o.recipient_phone || o.customer_phone) && (
          <>
            {o.recipient_is_customer === false && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: LMX.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }}>
                <Icon name="user" size={13} color={LMX.accent} />
                <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70, fontFamily: sans(500) }}>
                  {t('Destinataire différent du client')} · {o.recipient_phone}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => call(o.recipient_phone || o.customer_phone)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 10, backgroundColor: LMX.brand }}>
                <Icon name="phone" size={15} color="#fff" /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: '#fff' }}>{t('Appeler')}</Text>
              </Pressable>
              <Pressable onPress={() => whatsapp(o.whatsapp || o.recipient_phone || o.customer_phone)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 10, backgroundColor: '#25D366' }}>
                <Icon name="phone" size={15} color="#fff" /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: '#fff' }}>WhatsApp</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Stage action — pickup now requires the store's code before "on the way" */}
        {o.status === 'assigned-driver' && (
          <PickupCodeDisplay code={o.pickup_otp} onRefresh={onRefreshPickup} refreshing={refreshingPickup} />
        )}
        {o.status === 'out-delivery' && (
          <Button full variant="primary" size="md" icon="pin" onPress={() => onAdvance(o, 'driver-arrived')} disabled={busy}>{t('Je suis arrivé')}</Button>
        )}
        {showOtp && (
          <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 12, padding: 12, gap: 10 }}>
            <Text style={{ fontSize: 12, fontFamily: sans(700) }}>🔒 {t('Code de livraison')}</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50 }}>{t('Demandez au client le code à 4 chiffres reçu par SMS.')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surface, paddingHorizontal: 14, justifyContent: 'center' }}>
                <TextInput value={otp} onChangeText={onOtp} keyboardType="number-pad" maxLength={6} placeholder="••••" placeholderTextColor={LMX.ink50} style={{ fontFamily: mono(600), fontSize: 18, letterSpacing: 6, color: LMX.ink, padding: 0 }} />
              </View>
              <Button variant="accent" size="md" icon="check" onPress={() => onVerify(o)} disabled={busy}>{t('Vérifier')}</Button>
            </View>
            {o.otp_attempts > 0 && <Text style={{ fontSize: 10.5, color: LMX.rose }}>{t('{n} tentative(s) utilisée(s)', { n: o.otp_attempts })}</Text>}
          </View>
        )}
      </View>
    </View>
  );
}

function RouteFooter({ eta, located, label }: { eta: { duration: string; distance: string } | null; located: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: LMX.surface }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: LMX.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="truck" size={16} color={LMX.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontFamily: sans(700), color: LMX.ink }}>
          {eta ? `${eta.distance}${eta.duration ? ` · ${eta.duration}` : ''}` : (located ? t("Calcul de l'itinéraire…") : t('Localisation en cours…'))}
        </Text>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 1 }}>{label}</Text>
      </View>
    </View>
  );
}

// Driver order detail — full info + actions (status, OTP). Navigation stays in the app:
// before pickup the map routes to the store, after pickup to the customer.
export function ScreenDriverOrder() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [order, setOrder] = useState<DeliveryOrder | undefined>(route.params?.order);
  const [busy, setBusy]   = useState(false);
  const [otp, setOtp]     = useState('');
  const [custLoc, setCustLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapsKey, setMapsKey] = useState('');
  const [eta, setEta] = useState<{ duration: string; distance: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const beforePickup = order?.status === 'assigned-driver';
  const active = !!order && ['out-delivery', 'driver-arrived', 'otp-pending'].includes(order.status);
  const stage: 'store' | 'customer' = beforePickup ? 'store' : 'customer';

  useEffect(() => { configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {}); }, []);
  useEffect(() => { setEta(null); }, [stage]);

  const orderId = order?.id;
  const refreshOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const r = await driverApi.orders();
      const fresh = (r.orders ?? []).find(x => x.id === orderId);
      if (fresh) setOrder(fresh);
    } catch {}
  }, [orderId]);

  // Before pickup: re-read the order so the pickup code appears and the screen switches to
  // the customer route as soon as the store verifies the code.
  useEffect(() => {
    if (!beforePickup) return;
    const i = setInterval(refreshOrder, 20000);
    return () => clearInterval(i);
  }, [beforePickup, refreshOrder]);

  // Poll the customer's shared live location so the driver can navigate to them
  useEffect(() => {
    if (!orderId) return;
    const load = () => ordersApi.tracking(orderId)
      .then(t => {
        // Prefer the customer's live shared location; fall back to the exact pin from checkout
        const c = (t.customer?.lat != null && t.customer?.lng != null) ? t.customer
                : (t.destination?.lat != null && t.destination?.lng != null) ? t.destination
                : null;
        if (c) setCustLoc({ lat: c.lat as number, lng: c.lng as number });
      })
      .catch(() => {});
    load();
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, [orderId]);

  // Driver's own live GPS — drives the in-app map AND keeps broadcasting to logistics.
  const tracking = beforePickup || active;
  useEffect(() => {
    if (!tracking) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 8000, distanceInterval: 15 },
        pos => {
          setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          driverApi.updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? 0).catch(() => {});
        }
      );
    })();
    return () => { cancelled = true; if (sub) sub.remove(); };
  }, [tracking]);

  if (!order) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Commande')} />
        <View style={{ padding: 24 }}><Text style={{ color: LMX.ink50 }}>{t('Commande introuvable.')}</Text></View>
      </Screen>
    );
  }

  const advance = async (o: DeliveryOrder, to: 'out-delivery' | 'driver-arrived') => {
    setBusy(true);
    try { const res = await driverApi.updateStatus(o.id, to); if (res?.order) setOrder(res.order); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t('Action impossible.'))); }
    finally { setBusy(false); }
  };

  // Addresses in Guinea are often imprecise — SMS the recipient a one-tap link. Their
  // shared position lands in the same field the tracking poll above already reads, so
  // the map/navigation updates on its own within ~20s.
  const requestLocation = async (o: DeliveryOrder) => {
    setBusy(true);
    try { await promptSendLocation(o.id); }
    finally { setBusy(false); }
  };

  const verifyOtp = async (o: DeliveryOrder) => {
    if (otp.trim().length < 4) { Alert.alert(t('Code requis'), t('Entrez le code à 4 chiffres communiqué par le client.')); return; }
    setBusy(true);
    try {
      const res = await ordersApi.verifyOtp(o.id, otp.trim());
      if (res.verified) { Alert.alert(t('Confirmé'), t('Livraison confirmée avec succès.'), [{ text: 'OK', onPress: () => nav.goBack() }]); }
      else Alert.alert(t('Code incorrect'), res.message ?? t('Veuillez réessayer.'));
    } catch (e) { Alert.alert(t('Code incorrect'), friendlyError(e, t('Veuillez réessayer.'))); }
    finally { setBusy(false); }
  };

  const refreshPickup = async () => { setRefreshing(true); await refreshOrder(); setRefreshing(false); };

  const pk = order.pickup;
  const storeLL = pk && pk.lat != null && pk.lng != null ? { lat: pk.lat, lng: pk.lng } : null;
  const storeAddress = [pk?.landmark, pk?.neighborhood, pk?.commune, pk?.zone_label].filter(Boolean).join(', ') || pk?.address || '';

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Commande #{n}', { n: order.number })} right={<IconBtn icon="refresh" onPress={refreshPickup} />} />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        {stage === 'store' ? (
          storeLL && mapsKey ? (
            <View style={{ borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border }}>
              <LiveMap
                key="store"
                mapsKey={mapsKey}
                driver={myPos}
                destination={storeLL}
                destinationLabel={decodeEntities(pk?.store) || t('Magasin')}
                destinationColor={LMX.accent}
                height={260}
                onEta={setEta}
              />
              <RouteFooter eta={eta} located={!!myPos} label={t('Itinéraire vers le magasin')} />
            </View>
          ) : (
            <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, gap: 8 }}>
              <Text style={{ fontSize: 11, color: LMX.accent, textTransform: 'uppercase', fontFamily: sans(700) }}>{t('Itinéraire vers le magasin')}</Text>
              {!!pk?.store && <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{decodeEntities(pk.store)}</Text>}
              <Text style={{ fontSize: 12.5, color: LMX.ink70, lineHeight: 18 }}>{storeAddress || t('Adresse du vendeur indisponible')}</Text>
              {!storeLL && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: LMX.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
                  <Icon name="pin" size={13} color={LMX.accent} />
                  <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70 }}>{t("Le magasin n'a pas encore enregistré sa position GPS")}</Text>
                </View>
              )}
              {!!pk?.phone && (
                <Pressable onPress={() => call(pk.phone)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt, borderWidth: 1, borderColor: LMX.border }}>
                  <Icon name="phone" size={14} color={LMX.ink} /><Text style={{ fontSize: 12, fontFamily: sans(600) }}>{t('Appeler le magasin')}</Text>
                </Pressable>
              )}
            </View>
          )
        ) : (
          !!mapsKey && (custLoc || order.delivery_address) && (
            <View style={{ borderRadius: LMX.r.lg, overflow: 'hidden', borderWidth: 1, borderColor: LMX.border }}>
              <LiveMap
                key="customer"
                mapsKey={mapsKey}
                driver={myPos}
                destination={custLoc ? { lat: custLoc.lat, lng: custLoc.lng } : { address: order.delivery_address, city: order.city }}
                height={260}
                onEta={setEta}
              />
              <RouteFooter eta={eta} located={!!myPos} label={t('Itinéraire vers le client')} />
            </View>
          )
        )}
        <DriverActiveCard o={order} busy={busy} otp={otp} onOtp={setOtp} onAdvance={advance} onVerify={verifyOtp} onLocationRequest={requestLocation} onRefreshPickup={refreshPickup} refreshingPickup={refreshing} />
      </View>
    </Screen>
  );
}


function DriverDoneCard({ o, failed }: { o: DeliveryOrder; failed: boolean }) {
  const color = failed ? LMX.rose : LMX.emerald;
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, borderLeftWidth: 3, borderLeftColor: color, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.number}</Text>
        <Text style={{ fontSize: 11, fontFamily: sans(700), color }}>{failed ? t('Échec') : t('Livrée')}</Text>
      </View>
      <Text style={{ fontSize: 12.5, color: LMX.ink, marginTop: 6 }}>{o.customer_name}</Text>
      <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{[o.commune, o.neighborhood].filter(Boolean).join(' — ') || o.city}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50 }}>{o.delivery_time || o.date || ''}</Text>
        <Text style={{ fontFamily: mono(700), fontSize: 13, color: LMX.accent }}>{fr(o.total)} GNF</Text>
      </View>
    </View>
  );
}

// ── Logistics dashboard (JWT /logistics/*) ─────────────────────
const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  'processing':      { label: 'En préparation', color: LMX.amber },
  'ready-dispatch':  { label: 'À assigner',     color: LMX.accent },
  'assigned-driver': { label: 'Assignée',       color: LMX.brand },
  'out-delivery':    { label: 'En route',       color: LMX.brandDeep },
  'driver-arrived':  { label: 'Arrivé',         color: LMX.brandDeep },
  'otp-pending':     { label: 'Code en attente', color: LMX.accent },
  'otp-verified':    { label: 'Livrée',         color: LMX.emerald },
  'completed':       { label: 'Livrée',         color: LMX.emerald },
  'delivery-failed': { label: 'Échec',          color: LMX.rose },
};

const OTP_COLOR: Record<string, string> = {
  none: LMX.ink50, pending: LMX.amber, verified: LMX.emerald,
  blocked: LMX.rose, expired: LMX.rose, overridden: LMX.brand,
};

function LogiRow({ icon, label, value }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={13} color={LMX.ink70} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase' }}>{label}</Text>
        <Text style={{ fontSize: 12.5, color: LMX.ink, marginTop: 2, lineHeight: 17 }}>{value}</Text>
      </View>
    </View>
  );
}


function LogisticsCard({ o, drivers, partners, onAssigned }: { o: DeliveryOrder; drivers: LogisticsDriver[]; partners: LogisticsPartner[]; onAssigned: () => void }) {
  const nav = useNavigation<any>();
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const [partnerSheet, setPartnerSheet] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const st = STATUS_STYLE[o.status] ?? { label: o.status_label, color: LMX.ink50 };
  const orderPartner = o.partner_id || '';
  const canTransfer = ['processing', 'ready-dispatch', 'assigned-driver'].includes(o.status) && !o.pickup_time;

  const transfer = (partnerId: string, name: string) => {
    if (partnerId === orderPartner) { setPartnerSheet(false); return; }
    Alert.alert(t('Attribuer à un partenaire'), t('La commande {n} sera confiée à {p}. Le partenaire et le livreur actuels perdront immédiatement l’accès à cette commande (le code de retrait sera régénéré).', { n: o.number, p: name }), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Confirmer'), onPress: async () => {
        setBusy(true);
        try { await logisticsApi.assignPartner(o.id, partnerId); setPartnerSheet(false); onAssigned(); }
        catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t("Impossible d'attribuer la commande."))); }
        finally { setBusy(false); }
      } },
    ]);
  };

  const assign = async (driverId: number) => {
    setBusy(true);
    try { await logisticsApi.assignDriver(o.id, driverId); setOpen(false); onAssigned(); }
    catch (e) {
      if (isApiError(e) && (e.status === 409 || e.code === 'driver_unavailable')) {
        Alert.alert(t('Livreur indisponible'), e.message || t('Ce livreur est indisponible.'));
        onAssigned();
      } else {
        Alert.alert(t('Erreur'), friendlyError(e, t("Impossible d'assigner.")));
      }
    }
    finally { setBusy(false); }
  };

  const canAssign   = ['processing', 'ready-dispatch'].includes(o.status);
  const canResend   = ['assigned-driver', 'out-delivery', 'driver-arrived', 'otp-pending'].includes(o.status);
  const canOverride = ['blocked', 'expired'].includes(o.otp_status);

  const resendOtp = async () => {
    setBusy(true);
    try { await logisticsApi.sendOtp(o.id); Alert.alert(t('OTP envoyé'), t('Le code a été (re)envoyé au client.')); onAssigned(); }
    catch (e: any) { Alert.alert(t('Erreur'), e?.message ?? t('Envoi impossible.')); }
    finally { setBusy(false); }
  };
  const override = () => {
    Alert.alert(t('Forcer la livraison'), t('Marquer comme livré sans code OTP ?'), [
      { text: t('Annuler'), style: 'cancel' },
      { text: t('Confirmer'), style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await logisticsApi.overrideOtp(o.id); onAssigned(); }
        catch (e: any) { Alert.alert(t('Erreur'), e?.message ?? t('Action impossible.')); }
        finally { setBusy(false); }
      }},
    ]);
  };

  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: o.status === 'delivery-failed' ? LMX.rose : LMX.border, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.number}</Text>
            <Text style={{ fontSize: 10.5, color: LMX.ink50, fontFamily: mono(400) }}>· {fr(o.total)} GNF</Text>
          </View>
          <Pill label={o.partner_name || 'Loomodex'} color={orderPartner ? LMX.brandDeep : LMX.ink70} icon="truck" />
          <PackedPill packedAt={o.packed_at} status={o.status} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: st.color + '1A' }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: st.color }} />
          <Text style={{ fontSize: 10, fontFamily: sans(700), color: st.color, textTransform: 'uppercase' }}>{t(st.label)}</Text>
        </View>
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        <NotPackedNote packedAt={o.packed_at} status={o.status} />
        <LogiRow icon="user" label={t('Client')} value={`${o.customer_name} · ${o.customer_phone}`} />
        <LogiRow icon="storefront" label={t('Retrait')} value={[o.pickup?.store, o.pickup?.address].filter(Boolean).join(' · ') || t('Vendeur')} />
        <LogiRow icon="pin" label={t('Livraison')} value={o.delivery_address || [o.address, o.neighborhood, o.city].filter(Boolean).join(', ') || 'Conakry'} />
        <LogiRow icon="money" label={t('Paiement')} value={`${o.payment_method} · ${fr(o.total)} GNF`} />
        <MapButton onPress={() => setMapOpen(true)} />
        {/* OTP status + code (see OTP) */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="shield" size={13} color={LMX.ink70} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase' }}>{t('Code OTP')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: (OTP_COLOR[o.otp_status] ?? LMX.ink50) + '22' }}>
                <Text style={{ fontSize: 10, fontFamily: sans(700), color: OTP_COLOR[o.otp_status] ?? LMX.ink50, textTransform: 'uppercase' }}>{o.otp_status}</Text>
              </View>
              {!!o.otp_code && <Text style={{ fontFamily: mono(700), fontSize: 15, color: LMX.ink, letterSpacing: 3 }}>{o.otp_code}</Text>}
            </View>
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 14, paddingBottom: 4 }}>
        <TrackShareRow o={o} />
      </View>
      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: LMX.hairline, gap: 10 }}>
        {o.driver_name ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 9.5, fontFamily: sans(700) }}>{o.driver_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text></View>
            <Text style={{ flex: 1, fontSize: 12, fontFamily: sans(600) }}>{o.driver_name}</Text>
            <Pressable onPress={() => nav.navigate('DriverLocate', { orderId: o.id, number: o.number })} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: LMX.brand }}>
              <Icon name="pin" size={13} color="#fff" /><Text style={{ fontSize: 11.5, fontFamily: sans(600), color: '#fff' }}>{t('Position')}</Text>
            </Pressable>
          </View>
        ) : canAssign ? (
          <>
            <Pressable onPress={() => setOpen(v => !v)} style={{ height: 44, borderRadius: 12, backgroundColor: LMX.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="bike" size={15} color="#fff" /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: '#fff' }}>{t('Assigner un livreur')}</Text><Icon name={open ? 'chevU' : 'chevD'} size={13} color="#fff" />
            </Pressable>
            {open && (
              <View style={{ gap: 6, opacity: busy ? 0.6 : 1 }}>
                {drivers.length === 0 ? (
                  <Text style={{ fontSize: 12, color: LMX.ink50, textAlign: 'center', paddingVertical: 8 }}>{orderPartner ? t('Aucun livreur de ce partenaire.') : t('Aucun livreur disponible.')}</Text>
                ) : [...drivers].sort((a, b) => Number(b.available !== false) - Number(a.available !== false)).map(d => {
                  const avail = d.available !== false;
                  return (
                    <Pressable key={d.id} onPress={() => assign(d.id)} disabled={busy || !avail} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: LMX.surfaceAlt, opacity: avail ? 1 : 0.5 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: DRIVER_STATE_COLOR[driverMapState(d)] }} />
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600) }}>{d.name}</Text>
                        <Text numberOfLines={1} style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 1 }}>
                          {hasPosition(d) ? `GPS ${agoFr(d.loc_at)}` : t('Position inconnue')} · {d.active_count !== 1 ? t('{n} actives', { n: d.active_count }) : t('{n} active', { n: d.active_count })}
                        </Text>
                      </View>
                      <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: avail ? LMX.emeraldSoft : LMX.ink10 }}>
                        <Text style={{ fontSize: 9.5, fontFamily: sans(700), color: avail ? LMX.emerald : LMX.ink50, textTransform: 'uppercase' }}>{avail ? t('Disponible') : t('Indisponible')}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{t('En attente de confirmation du support.')}</Text>
        )}
        {canTransfer && (
          <Pressable onPress={() => setPartnerSheet(true)} disabled={busy} style={{ height: 40, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="truck" size={14} color={LMX.ink} /><Text style={{ fontSize: 12, fontFamily: sans(600), color: LMX.ink }}>{t('Attribuer à un partenaire')}</Text>
          </Pressable>
        )}
      </View>

      <OrderMapSheet order={mapOpen ? o : null} onClose={() => setMapOpen(false)} />

      <Sheet visible={partnerSheet} title={t('Attribuer à un partenaire')} subtitle={t('Commande {n}', { n: o.number })} onClose={() => setPartnerSheet(false)}>
        {[{ id: '', name: t('Loomodex (interne)') }, ...partners.filter(p => p.active || p.id === orderPartner).map(p => ({ id: p.id, name: p.name }))].map(p => {
          const current = p.id === orderPartner;
          return (
            <Pressable key={p.id || 'internal'} onPress={() => transfer(p.id, p.name)} disabled={busy || current}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12, backgroundColor: current ? LMX.brandSoft : LMX.surfaceAlt, opacity: busy ? 0.6 : 1 }}>
              <Icon name={p.id ? 'truck' : 'storefront'} size={15} color={LMX.ink} />
              <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{p.name}</Text>
              {current && <Text style={{ fontSize: 10.5, fontFamily: sans(700), color: LMX.brand, textTransform: 'uppercase' }}>{t('actuel')}</Text>}
            </Pressable>
          );
        })}
      </Sheet>

      {(canResend || canOverride || !!o.driver_name) && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {!!o.driver_name && (
            <Button variant="ghost" size="md" style={{ flex: 1, minWidth: 150 }} icon="pin"
              onPress={async () => { setBusy(true); try { await promptSendLocation(o.id); } finally { setBusy(false); } }} disabled={busy}>
              {t('Demander position')}
            </Button>
          )}
          {canResend && <Button variant="ghost" size="md" style={{ flex: 1 }} icon="arrowR" onPress={resendOtp} disabled={busy}>{t('Renvoyer OTP')}</Button>}
          {canOverride && <Button variant="accent" size="md" style={{ flex: 1 }} icon="shield" onPress={override} disabled={busy}>{t('Forcer')}</Button>}
        </View>
      )}
    </View>
  );
}

// Order map viewer (logistics / admin): store + customer + the driver's live position.
export function ScreenDriverLocate() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: number = route.params?.orderId;
  const number: string = route.params?.number ?? '';
  const [track, setTrack] = useState<OrderTracking | null>(null);
  const [nonce, setNonce] = useState(0);

  const d = track?.driver;

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={`${t('Livreur')} · ${number || '#' + orderId}`} right={<IconBtn icon="refresh" onPress={() => setNonce(n => n + 1)} />} />
      <View style={{ paddingHorizontal: 16 }}>
        {!!orderId && <OrderLocationMap key={nonce} orderId={orderId} viewer="staff" height={300} pollMs={15000} onTrack={setTrack} />}
      </View>
      {!!d && (
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bike" size={18} color={LMX.ink} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>{d.name || t('Livreur')}</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{track?.status_label ? t(track.status_label) : ''}{d.updated ? ` · ${t('maj {n} min', { n: Math.max(0, Math.round((Date.now() / 1000 - d.updated) / 60)) })}` : ''}</Text>
            </View>
            {!!d.phone && <Pressable onPress={() => Linking.openURL(`tel:${d.phone}`)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={18} color="#fff" /></Pressable>}
          </View>
        </View>
      )}
      {!!track && !d?.lat && track.active && (
        <Text style={{ fontSize: 11.5, color: LMX.ink50, textAlign: 'center', paddingHorizontal: 24, paddingTop: 12 }}>{t('En attente de la position du livreur en direct…')}</Text>
      )}
    </Screen>
  );
}

const LOGI_STATUS_OPTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'processing', label: 'En préparation' },
  { value: 'ready-dispatch', label: 'À assigner' },
  { value: 'assigned-driver', label: 'Assignée' },
  { value: 'out-delivery', label: 'En route' },
  { value: 'driver-arrived', label: 'Arrivé' },
  { value: 'otp-pending', label: 'OTP en attente' },
  { value: 'delivery-failed', label: 'Échec' },
];

export function ScreenLogistics() {
  const nav = useNavigation<any>();
  const [orders, setOrders]   = useState<DeliveryOrder[]>([]);
  const [counts, setCounts]   = useState<Record<string, number>>({});
  const [drivers, setDrivers] = useState<LogisticsDriver[]>([]);
  const [loading, setLoad]    = useState(true);
  const [fStatus, setFStatus] = useState('');
  const [fZone, setFZone]     = useState('');
  const [fDriver, setFDriver] = useState('');
  const [fPartner, setFPartner] = useState<string | null>(null);
  const [partners, setPartners] = useState<LogisticsPartner[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [o, s, d] = await Promise.all([logisticsApi.orders(), logisticsApi.stats(), logisticsApi.drivers()]);
      setOrders(o.orders ?? []);
      setCounts(s.counts ?? {});
      setDrivers(d.drivers ?? []);
      setError(null);
    } catch (e) { setError(friendlyError(e)); }
    finally { setLoad(false); setRefreshing(false); }
    logisticsApi.partners().then(r => setPartners(r.partners ?? [])).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  const tiles = [
    { id: 'preparing',       label: 'Préparation', color: LMX.amber },
    { id: 'ready_dispatch',  label: 'À assigner',  color: LMX.accent },
    { id: 'assigned',        label: 'Assignées',   color: LMX.brand },
    { id: 'in_route',        label: 'En route',    color: LMX.brandDeep },
    { id: 'delivered_today', label: 'Livrées auj.',color: LMX.emerald },
    { id: 'failed',          label: 'Échecs',      color: LMX.rose },
  ];

  const zoneOpts = [
    { value: '', label: t('Toutes les zones') },
    ...Array.from(new Map(orders.filter(o => o.zone).map(o => [o.zone, { value: o.zone, label: o.zone_label || o.zone }])).values()),
  ];
  const driverOpts = [{ value: '', label: t('Tous les livreurs') }, ...drivers.map(d => ({ value: String(d.id), label: d.name }))];

  const shown = orders.filter(o =>
    (!fStatus || o.status === fStatus) &&
    (!fZone || o.zone === fZone) &&
    (!fDriver || String(o.driver_id) === fDriver) &&
    (fPartner === null || (o.partner_id || '') === fPartner)
  );
  const hasFilter = !!(fStatus || fZone || fDriver || fPartner !== null);
  const partnerChips: { id: string | null; label: string }[] = [
    { id: null, label: t('Tous') },
    { id: '', label: 'Loomodex' },
    ...partners.map(p => ({ id: p.id, label: p.name })),
  ];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={LMX.brand} />}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn icon="chevL" onPress={() => nav.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Logistique')}</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>{t('Hub Conakry')}</Text>
          </View>
          <IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />
          <DashboardProfileBtn />
          <DashboardLogoutBtn />
        </View>
      </View>

      {/* Stats (6, grouped like the website) */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tiles.map(c => (
          <View key={c.id} style={{ width: '31.5%', backgroundColor: LMX.surface, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: LMX.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.color }} /><Text style={{ fontFamily: mono(600), fontSize: 20 }}>{counts[c.id] ?? 0}</Text></View>
            <Text style={{ fontSize: 10, color: LMX.ink50, marginTop: 4, fontFamily: sans(600) }}>{t(c.label)}</Text>
          </View>
        ))}
      </View>

      {/* Drivers map entry */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Pressable onPress={() => nav.navigate('DriversMap')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.navy, borderRadius: 14, padding: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={17} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontFamily: sans(700), color: '#fff' }}>{t('Carte des livreurs')}</Text>
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.7, marginTop: 2 }}>
              {t('{a} disponible(s) · {b} localisé(s)', { a: drivers.filter(d => d.available !== false).length, b: drivers.filter(hasPosition).length })}
            </Text>
          </View>
          <Icon name="arrowR" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Partners & incidents entries */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', gap: 8 }}>
        {[
          { icon: 'truck' as const, label: t('Partenaires'), sub: t('{n} actif(s)', { n: partners.filter(p => p.active).length }), route: 'LogisticsPartners' },
          { icon: 'msg' as const, label: t('Incidents'), sub: t('Signalements partenaires'), route: 'LogisticsIncidents' },
        ].map(e => (
          <Pressable key={e.route} onPress={() => nav.navigate(e.route)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: LMX.border }}>
            <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={e.icon} size={15} color={LMX.ink} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.ink }}>{e.label}</Text>
              <Text numberOfLines={1} style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 1 }}>{e.sub}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {!!error && <View style={{ paddingHorizontal: 16, paddingTop: 10 }}><ErrorBanner message={error} onRetry={() => { setLoad(true); load(); }} /></View>}

      {/* Partner filter */}
      {partners.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {partnerChips.map(c => {
            const on = fPartner === c.id;
            return (
              <Pressable key={c.id ?? 'all'} onPress={() => setFPartner(c.id)} style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: on ? LMX.ink : LMX.surface, borderWidth: on ? 0 : 1, borderColor: LMX.border }}>
                <Text style={{ fontSize: 12, fontFamily: sans(600), color: on ? '#fff' : LMX.ink }}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Filters: status / zone / driver */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Picker label={t('Statut')} value={fStatus} onChange={setFStatus} options={LOGI_STATUS_OPTS.map(s => ({ value: s.value, label: t(s.label) }))} placeholder={t('Tous')} /></View>
        <View style={{ flex: 1 }}><Picker label={t('Zone')} value={fZone} onChange={setFZone} options={zoneOpts} placeholder={t('Toutes')} /></View>
        <View style={{ flex: 1 }}><Picker label={t('Livreur')} value={fDriver} onChange={setFDriver} options={driverOpts} placeholder={t('Tous')} /></View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{t('Commandes')} · {shown.length}</Text>
        {hasFilter && (
          <Pressable onPress={() => { setFStatus(''); setFZone(''); setFDriver(''); setFPartner(null); }}>
            <Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>{t('Effacer les filtres')}</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : shown.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 30, gap: 10 }}>
          <Icon name="truck" size={40} color={LMX.ink30} />
          <Text style={{ fontSize: 13, color: LMX.ink50 }}>{hasFilter ? t('Aucune commande pour ce filtre.') : t('Aucune commande en cours.')}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}>
          {shown.map(o => (
            <LogisticsCard key={o.id} o={o} partners={partners} onAssigned={load}
              drivers={drivers.filter(d => (d.partner_id || '') === (o.partner_id || ''))} />
          ))}
        </View>
      )}
    </Screen>
  );
}

// ── Customer Support dashboard (JWT /cs/*) ─────────────────────
export function ScreenCS() {
  const nav = useNavigation<any>();
  const [tab, setTab]       = useState<'pending' | 'history'>('pending');
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [counts, setCounts] = useState<{ awaiting: number; confirmed_today: number; rejected_today: number }>({ awaiting: 0, confirmed_today: 0, rejected_today: 0 });
  const [loading, setLoad]  = useState(true);
  const [busyId, setBusy]   = useState<number | null>(null);
  const [query, setQuery]   = useState('');
  const [rejectFor, setRejectFor] = useState<DeliveryOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adjustFor, setAdjustFor] = useState<DeliveryOrder | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');

  const load = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([
        csApi.orders(tab === 'history' ? 'history' : undefined),
        csApi.stats(),
      ]);
      setOrders(o.orders ?? []);
      setCounts(s.counts);
    } catch {}
    finally { setLoad(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  const confirm = async (o: DeliveryOrder) => {
    setBusy(o.id);
    try { await csApi.confirmOrder(o.id); await load(); }
    catch (e) {
      if (isApiError(e) && e.code === 'fee_not_confirmed') {
        Alert.alert(t('Frais de livraison non confirmés'), o.fee_status === 'awaiting_customer'
          ? t('Le client doit d’abord accepter les nouveaux frais de livraison. La commande pourra être confirmée ensuite.')
          : t('Confirmez ou ajustez d’abord les frais de livraison de cette commande, puis confirmez-la.'));
        load();
      } else {
        Alert.alert(t('Erreur'), friendlyError(e, t('Action impossible.')));
      }
    }
    finally { setBusy(null); }
  };

  const reject = (o: DeliveryOrder) => { setRejectReason(''); setRejectFor(o); };
  const submitReject = async () => {
    const o = rejectFor;
    if (!o) return;
    if (!rejectReason.trim()) { Alert.alert(t('Motif requis'), t('Indiquez le motif du rejet.')); return; }
    setBusy(o.id);
    try { await csApi.rejectOrder(o.id, rejectReason.trim()); setRejectFor(null); await load(); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t('Action impossible.'))); }
    finally { setBusy(null); }
  };

  const confirmFee = async (o: DeliveryOrder) => {
    setBusy(o.id);
    try { await csApi.confirmFee(o.id); await load(); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t('Action impossible.'))); }
    finally { setBusy(null); }
  };
  const openAdjust = (o: DeliveryOrder) => { setAdjAmount(String(Math.round(o.delivery_quote?.total ?? 0))); setAdjReason(''); setAdjustFor(o); };
  const submitAdjust = async () => {
    const o = adjustFor;
    if (!o) return;
    const a = parseInt(adjAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(a) || a < 0) { Alert.alert(t('Montant invalide'), t('Entrez un montant valide.')); return; }
    if (!adjReason.trim()) { Alert.alert(t('Motif requis'), t('Expliquez au client pourquoi les frais changent.')); return; }
    setBusy(o.id);
    try {
      await csApi.adjustFee(o.id, a, adjReason.trim());
      setAdjustFor(null);
      Alert.alert(t('Frais ajustés'), t('Le client a été notifié et doit accepter les nouveaux frais.'));
      await load();
    } catch (e) { Alert.alert(t('Erreur'), friendlyError(e, t('Action impossible.'))); }
    finally { setBusy(null); }
  };

  const addNote = (o: DeliveryOrder) => {
    Alert.prompt?.(t('Ajouter une note'), t('Note interne pour {n}', { n: o.number }), async (text?: string) => {
      if (!text?.trim()) return;
      setBusy(o.id);
      try { await csApi.addNote(o.id, text.trim()); Alert.alert(t('Note ajoutée')); }
      catch (e: any) { Alert.alert(t('Erreur'), e?.message ?? t('Action impossible.')); }
      finally { setBusy(null); }
    });
  };

  const q = query.trim().toLowerCase();
  const shown = q
    ? orders.filter(o => `${o.number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(q))
    : orders;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn icon="chevL" onPress={() => nav.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Support client')}</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>{t('Confirmation des commandes')}</Text>
          </View>
          <IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />
          <DashboardProfileBtn />
          <DashboardLogoutBtn />
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
        <DriverStatCard value={counts.awaiting} label={t('À confirmer')} />
        <DriverStatCard value={counts.confirmed_today} label={t('Confirmées auj.')} color={LMX.emerald} />
        <DriverStatCard value={counts.rejected_today} label={t('Rejetées auj.')} color={LMX.rose} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
        {(['pending', 'history'] as const).map(k => {
          const on = tab === k;
          return (
            <Pressable key={k} onPress={() => { setTab(k); setLoad(true); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: on ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: on ? 'transparent' : LMX.border }}>
              <Text style={{ fontSize: 12, fontFamily: sans(700), color: on ? '#fff' : LMX.ink70 }}>{k === 'pending' ? t('À confirmer') : t('Confirmées / Annulées')}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 999, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: LMX.border }}>
          <Icon name="search" size={16} color={LMX.ink50} />
          <TextInput value={query} onChangeText={setQuery} placeholder={t('Commande, nom, téléphone…')} placeholderTextColor={LMX.ink50} style={{ flex: 1, fontSize: 13.5, color: LMX.ink, fontFamily: sans(400), padding: 0 }} />
          {query.length > 0 && <Pressable onPress={() => setQuery('')}><Icon name="close" size={15} color={LMX.ink50} /></Pressable>}
        </View>
      </View>

      {loading ? (
        <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : shown.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
          <Icon name="checkCircle" size={44} color={LMX.emerald} />
          <Text style={{ fontSize: 14, color: LMX.ink70 }}>{tab === 'pending' ? t('Aucune commande en attente.') : t("Aucune commande dans l'historique.")}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 10 }}>
          {shown.map(o => (
            <View key={o.id} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
                <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.number}</Text>
                <Text style={{ fontSize: 11, color: LMX.brand, fontFamily: sans(600) }}>{t(o.status_label)}</Text>
              </View>
              <View style={{ padding: 14, gap: 10 }}>
                <LogiRow icon="user" label={t('Client')} value={o.customer_name} />
                <LogiRow icon="pin" label={t('Adresse')} value={o.delivery_address || [o.address, o.neighborhood, o.city].filter(Boolean).join(', ') || 'Conakry'} />
                {!!o.landmark && <LogiRow icon="pin" label={t('Repère')} value={o.landmark} />}
                <LogiRow icon="money" label={t('Paiement')} value={`${o.payment_method} · ${fr(o.total)} GNF`} />
              </View>

              {o.fee_status === 'awaiting_customer' && (
                <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                  <Pill label={t("En attente d'acceptation du client")} color={LMX.amber} icon="money" />
                </View>
              )}

              {o.fee_status === 'pending_review' && (
                <View style={{ marginHorizontal: 14, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: LMX.amber + '66', backgroundColor: '#FFFBEB', padding: 12, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="truck" size={14} color={LMX.amber} />
                    <Text style={{ flex: 1, fontSize: 12.5, fontFamily: sans(700), color: LMX.ink }}>{t('Frais de livraison à vérifier')}</Text>
                  </View>
                  {!!o.delivery_quote && (
                    <>
                      <Text style={{ fontSize: 11, color: LMX.ink70 }}>
                        {o.delivery_quote.reliable ? t('Distance : {d} km', { d: o.delivery_quote.distance_km }) : t('Estimation approximative · {d} km', { d: o.delivery_quote.distance_km })}
                      </Text>
                      {o.delivery_quote.lines.map(l => <AmountRow key={l.key} label={quoteLineLabel(l)} amount={l.amount} />)}
                      <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 2 }} />
                      <AmountRow label={t('Total livraison')} amount={o.delivery_quote.total} bold color={LMX.accent} />
                    </>
                  )}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Button variant="soft" size="sm" style={{ flex: 1 }} icon="pencil" onPress={() => openAdjust(o)} disabled={busyId === o.id}>{t('Ajuster les frais')}</Button>
                    <Button variant="primary" size="sm" style={{ flex: 1 }} icon="check" onPress={() => confirmFee(o)} disabled={busyId === o.id}>{t('Confirmer les frais')}</Button>
                  </View>
                </View>
              )}

              {/* Contact */}
              {!!o.customer_phone && (
                <View style={{ paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => call(o.customer_phone)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt }}>
                    <Icon name="phone" size={14} color={LMX.ink} /><Text style={{ fontSize: 12, fontFamily: sans(600) }}>{t('Appeler')}</Text>
                  </Pressable>
                  {!!o.whatsapp && (
                    <Pressable onPress={() => whatsapp(o.whatsapp)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: '#25D366' }}>
                      <Icon name="phone" size={14} color="#fff" /><Text style={{ fontSize: 12, fontFamily: sans(600), color: '#fff' }}>WhatsApp</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => addNote(o)} style={{ width: 44, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="receipt" size={15} color={LMX.ink} />
                  </Pressable>
                </View>
              )}

              {/* Share tracking link */}
              <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                <TrackShareRow o={o} />
              </View>

              {/* Actions (pending only) */}
              {tab === 'pending' && (
                <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: LMX.hairline, flexDirection: 'row', gap: 10 }}>
                  <Button variant="ghost" size="md" style={{ flex: 1 }} onPress={() => reject(o)} disabled={busyId === o.id}>{t('Rejeter')}</Button>
                  <Button variant="accent" size="md" style={{ flex: 1.4 }} icon="check" onPress={() => confirm(o)} disabled={busyId === o.id}>{t('Confirmer')}</Button>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Sheet visible={!!rejectFor} title={t('Rejeter la commande')} subtitle={rejectFor ? t('Commande {n}', { n: rejectFor.number }) : undefined} onClose={() => setRejectFor(null)}
        footer={<Button variant="primary" full onPress={submitReject} disabled={busyId != null}>{t('Rejeter la commande')}</Button>}>
        <TextArea label={t('Motif du rejet (envoyé au client)')} value={rejectReason} onChangeText={setRejectReason} lines={3} placeholder={t('Ex. : article en rupture de stock, client injoignable…')} />
      </Sheet>

      <Sheet visible={!!adjustFor} title={t('Ajuster les frais')} subtitle={adjustFor ? t('Commande {n} · frais actuels {a} GNF', { n: adjustFor.number, a: fr(Math.round(adjustFor.delivery_quote?.total ?? 0)) }) : undefined} onClose={() => setAdjustFor(null)}
        footer={<Button variant="accent" full icon="check" onPress={submitAdjust} disabled={busyId != null}>{t('Envoyer au client')}</Button>}>
        <TextArea label={t('Nouveaux frais de livraison (GNF)')} value={adjAmount} onChangeText={setAdjAmount} keyboardType="number-pad" lines={1} />
        <TextArea label={t('Motif (visible par le client)')} value={adjReason} onChangeText={setAdjReason} lines={3} placeholder={t('Ex. : adresse plus éloignée que prévu')} />
        <Text style={{ fontSize: 11.5, color: LMX.ink50, lineHeight: 17 }}>{t('Le client devra accepter ces frais avant que la commande puisse être confirmée.')}</Text>
      </Sheet>
    </Screen>
  );
}

// ── Drivers map (logistics): every driver's last position + availability ──
const STATE_LABEL: Record<DriverMapState, string> = {
  fresh: 'Disponible',
  stale: 'Disponible · position ancienne',
  off:   'Indisponible',
};

export function ScreenDriversMap() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const partnerScope = route.params?.scope === 'partner';
  const [drivers, setDrivers]   = useState<LogisticsDriver[]>([]);
  const [mapsKey, setMapsKey]   = useState('');
  const [loading, setLoad]      = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [selectedId, setSelected] = useState<number | null>(null);
  const [, setTick]             = useState(0);

  const load = useCallback(async () => {
    try { const r = await (partnerScope ? partnerApi.drivers() : logisticsApi.drivers()); setDrivers(r.drivers ?? []); setError(null); }
    catch (e) { setError(friendlyError(e)); }
    finally { setLoad(false); setTick(t => t + 1); }
  }, [partnerScope]);

  useEffect(() => { configApi.get().then(c => setMapsKey(c.google_maps_key ?? '')).catch(() => {}); }, []);
  useFocusEffect(useCallback(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]));

  const located  = drivers.filter(hasPosition);
  const order: Record<DriverMapState, number> = { fresh: 0, stale: 1, off: 2 };
  const sorted   = [...drivers].sort((a, b) => order[driverMapState(a)] - order[driverMapState(b)] || a.name.localeCompare(b.name));
  const selected = drivers.find(d => d.id === selectedId) ?? null;

  return (
    <Screen scroll={false}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={partnerScope ? t('Carte de mes livreurs') : t('Carte des livreurs')} right={<IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />} />
      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 12, gap: 10 }}>
        {!!error && (
          <View style={{ backgroundColor: '#FFF0F0', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: LMX.rose + '33' }}>
            <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70 }}>{error}</Text>
            <Pressable onPress={() => { setLoad(true); load(); }}><Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>{t('Réessayer')}</Text></Pressable>
          </View>
        )}

        {mapsKey ? (
          <DriversMap mapsKey={mapsKey} drivers={drivers} selectedId={selectedId} onSelect={setSelected} style={{ flex: 1, minHeight: 240 }} />
        ) : (
          <View style={{ flex: 1, minHeight: 200, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {loading ? <ActivityIndicator color={LMX.brand} /> : <Text style={{ fontSize: 12.5, color: LMX.ink50 }}>{t('Carte indisponible.')}</Text>}
          </View>
        )}

        {/* Legend */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {(['fresh', 'stale', 'off'] as DriverMapState[]).map(k => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: DRIVER_STATE_COLOR[k] }} />
              <Text style={{ fontSize: 10.5, color: LMX.ink70 }}>{k === 'fresh' ? t('Disponible') : k === 'stale' ? t('Position > 10 min') : t('Indisponible')}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 10.5, color: LMX.ink50 }}>· {t('{a}/{b} localisés · actualisé toutes les 30 s', { a: located.length, b: drivers.length })}</Text>
        </View>

        {/* Selected driver */}
        {selected && (
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: DRIVER_STATE_COLOR[driverMapState(selected)], padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {selected.avatar
              ? <Image source={{ uri: selected.avatar }} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: LMX.surfaceAlt }} />
              : <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bike" size={18} color={LMX.ink} /></View>}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontFamily: sans(700), color: LMX.ink }}>{selected.name}</Text>
              <Text style={{ fontSize: 11, color: DRIVER_STATE_COLOR[driverMapState(selected)], fontFamily: sans(600), marginTop: 2 }}>{t(STATE_LABEL[driverMapState(selected)])}</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 1 }}>
                {hasPosition(selected) ? t('Mise à jour {ago}', { ago: agoFr(selected.loc_at) }) : t('Position inconnue')}
                {selected.current_order ? ` · ${t('Commande {n}', { n: selected.current_order })}` : ` · ${t('Aucune commande en cours')}`}
              </Text>
            </View>
            {!!selected.phone && (
              <Pressable onPress={() => call(selected.phone)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="phone" size={17} color="#fff" />
              </Pressable>
            )}
          </View>
        )}

        {/* List */}
        <ScrollView style={{ maxHeight: 230 }} contentContainerStyle={{ gap: 6 }} showsVerticalScrollIndicator={false}>
          {!loading && drivers.length === 0 && <Text style={{ fontSize: 12, color: LMX.ink50, textAlign: 'center', paddingVertical: 10 }}>{t('Aucun livreur.')}</Text>}
          {sorted.map(d => {
            const st = driverMapState(d);
            const on = d.id === selectedId;
            return (
              <Pressable key={d.id} onPress={() => setSelected(d.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: on ? LMX.brandSoft : LMX.surface, borderWidth: 1, borderColor: on ? LMX.brand + '55' : LMX.border }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: DRIVER_STATE_COLOR[st] }} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink }}>{d.name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 1 }}>
                    {hasPosition(d) ? agoFr(d.loc_at) : t('Position inconnue')}{d.current_order ? ` · ${d.current_order}` : ''}{!partnerScope && d.partner_name ? ` · ${d.partner_name}` : ''}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontFamily: sans(700), color: st === 'off' ? LMX.ink50 : LMX.emerald, textTransform: 'uppercase' }}>{st === 'off' ? t('Indispo.') : t('Dispo.')}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Screen>
  );
}
