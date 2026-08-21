import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Alert, TextInput, Linking, Platform } from 'react-native';
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
import { get, post } from '../api/client';
import { ordersApi, Order, OrderTracking } from '../api/orders';
import { LiveMap } from '../components/LiveMap';
import { Product as ApiProduct } from '../api/products';
import { driverApi, logisticsApi, csApi, DeliveryOrder, LogisticsDriver, DriverSummary } from '../api/delivery';
import { wcfmApi, WcfmOrder, WcfmSalesStats, SITE_ORIGIN, uploadMedia } from '../api/wcfm';

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
interface VendorDashboard {
  earnings: { week: number; month: number };
  gross_sales: { week: number; month: number };
  currency: string;
  total_products: number;
  total_orders: number;
  new_orders: number;
  recent_orders: Order[];
}

// Logout button for staff dashboards
// Edit contact info (name / phone) — opens the shared account-details screen
function DashboardProfileBtn() {
  const nav = useNavigation<any>();
  return <IconBtn icon="user" onPress={() => nav.navigate('AccountDetails')} />;
}

function DashboardLogoutBtn() {
  const nav = useNavigation<any>();
  const { logout } = useAuth();
  const onPress = () => Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Déconnexion', style: 'destructive', onPress: async () => { await logout(); nav.reset({ index: 0, routes: [{ name: 'SignIn' }] }); } },
  ]);
  return <IconBtn icon="arrowU" onPress={onPress} />;
}

export function ScreenSeller() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [data, setData]     = useState<VendorDashboard | null>(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const d = await get<VendorDashboard>('/vendor/dashboard', true); setData(d); }
    catch (e: any) { setError(e?.message ?? 'Erreur de chargement.'); }
    finally { setLoad(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  const orders    = data?.recent_orders ?? [];
  const storeName = user?.store?.name || 'Ma boutique';
  const newOrders = data?.new_orders ?? 0;
  const openWebDashboard = () => Linking.openURL(`${SITE_ORIGIN}/store-manager/`).catch(() => {});

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn icon="chevL" onPress={() => nav.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Tableau de bord vendeur</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>{decodeEntities(storeName)}</Text>
          </View>
          <IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />
          <DashboardProfileBtn />
          <DashboardLogoutBtn />
        </View>
      </View>

      {loading ? (
        <View style={{ paddingTop: 60 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : (
        <>
          {!!error && (
            <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF0F0', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: LMX.rose + '33' }}>
              <Icon name="close" size={15} color={LMX.rose} />
              <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70, lineHeight: 16 }}>Données vendeur indisponibles : {error}. Vérifiez que les extensions WCFM + l'API sont actives et reconnectez-vous.</Text>
            </View>
          )}
          {/* Earnings (WCFM commission) */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <View style={{ backgroundColor: LMX.ink, borderRadius: LMX.r.xl, padding: 20, overflow: 'hidden' }}>
              <Text style={{ fontSize: 11, color: '#fff', opacity: 0.65, textTransform: 'uppercase', fontFamily: sans(600) }}>Gains ce mois</Text>
              <Text style={{ fontFamily: FONT.display, fontSize: 36, color: '#fff', marginTop: 8 }}>{fr(data?.earnings?.month ?? 0)}<Text style={{ fontSize: 14, opacity: 0.7, fontFamily: sans(400) }}> GNF</Text></Text>
              <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}>
                <View>
                  <Text style={{ fontSize: 10, color: '#fff', opacity: 0.6, textTransform: 'uppercase' }}>Cette semaine</Text>
                  <Text style={{ fontSize: 13, fontFamily: mono(600), color: '#7BE0AE', marginTop: 2 }}>{fr(data?.earnings?.week ?? 0)} GNF</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 10, color: '#fff', opacity: 0.6, textTransform: 'uppercase' }}>Ventes brutes (mois)</Text>
                  <Text style={{ fontSize: 13, fontFamily: mono(600), color: '#fff', marginTop: 2 }}>{fr(data?.gross_sales?.month ?? 0)} GNF</Text>
                </View>
              </View>
            </View>
          </View>

          {/* New orders banner */}
          {newOrders > 0 && (
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Pressable onPress={() => nav.navigate('VendorOrders')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.accent, borderRadius: 14, padding: 14 }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}><Icon name="package" size={18} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: sans(700), color: '#fff' }}>{newOrders} nouvelle{newOrders > 1 ? 's' : ''} commande{newOrders > 1 ? 's' : ''}</Text>
                  <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.85, marginTop: 2 }}>À traiter maintenant</Text>
                </View>
                <Icon name="arrowR" size={16} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Recent orders */}
          <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Commandes récentes</Text>
              <Pressable onPress={() => nav.navigate('VendorOrders')}><Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>Voir tout</Text></Pressable>
            </View>
            <View style={{ gap: 10 }}>
              {orders.length === 0 ? (
                <Text style={{ fontSize: 12.5, color: LMX.ink50 }}>Aucune commande pour l'instant.</Text>
              ) : orders.map(o => (
                <Pressable key={o.id} onPress={() => nav.navigate('VendorOrders')} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 12, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="package" size={18} color={LMX.ink} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>#{o.number} · {o.billing?.first_name} {o.billing?.last_name}</Text>
                    <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{o.item_count} article(s) · {o.status_label}</Text>
                  </View>
                  <Text style={{ fontFamily: mono(600), fontSize: 12.5 }}>{fr(o.total)}<Text style={{ fontSize: 9, color: LMX.ink50 }}> GNF</Text></Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Manage */}
          <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600), marginBottom: 10 }}>Gérer ma boutique</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { icon: 'package' as const,    label: 'Commandes',          to: 'VendorOrders' },
                { icon: 'storefront' as const, label: 'Mes produits',       to: 'VendorProducts' },
                { icon: 'plus' as const,       label: 'Ajouter un produit', to: 'AddProduct' },
                { icon: 'settings' as const,   label: 'Boutique',           to: 'VendorStore' },
              ].map(a => (
                <Pressable key={a.to} onPress={() => nav.navigate(a.to)} style={{ width: '47.5%', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 14, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={a.icon} size={18} color={LMX.ink} /></View>
                  <Text style={{ flex: 1, fontSize: 12.5, fontFamily: sans(600) }}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Advanced → website */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <Pressable onPress={openWebDashboard} style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: LMX.hairline }}>
              <Icon name="storefront" size={18} color={LMX.brand} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>Retraits, rapports & réglages</Text>
                <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>Gérer sur le site web</Text>
              </View>
              <Icon name="arrowR" size={15} color={LMX.ink50} />
            </Pressable>
          </View>
        </>
      )}
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
    catch (e: any) { setError(e?.message ?? 'Erreur de chargement.'); }
    finally { setLoad(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  const del = (p: ApiProduct) => {
    Alert.alert('Supprimer', `Supprimer « ${decodeEntities(p.name)} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await post(`/vendor/products/${p.id}/delete`, {}, true); load(); }
        catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Échec.'); }
      }},
    ]);
  };

  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="plus" onPress={() => nav.navigate('AddProduct')}>Ajouter un produit</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Mes produits" />
      {loading ? (
        <View style={{ paddingTop: 50 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : error ? (
        <View style={{ alignItems: 'center', paddingTop: 44, gap: 10, paddingHorizontal: 32 }}>
          <Icon name="close" size={40} color={LMX.rose} />
          <Text style={{ fontSize: 13.5, color: LMX.ink70, textAlign: 'center' }}>{error}</Text>
          <Button variant="ghost" size="md" onPress={() => { setLoad(true); load(); }}>Réessayer</Button>
        </View>
      ) : items.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 50, gap: 12 }}>
          <Icon name="storefront" size={44} color={LMX.ink30} />
          <Text style={{ fontSize: 14, color: LMX.ink70 }}>Aucun produit pour l'instant.</Text>
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
                <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{fr(p.price)} GNF · {p.in_stock ? 'En stock' : 'Rupture'}</Text>
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

export function ScreenVendorEditProduct() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const product: ApiProduct = route.params?.product;
  const [name, setName]               = useState(decodeEntities(product?.name ?? ''));
  const [description, setDescription] = useState(decodeEntities(product?.description ?? ''));
  const [price, setPrice]             = useState(String(Math.round(product?.price ?? 0)));
  const [stock, setStock]             = useState('');
  const [published, setPublished]     = useState(true);
  // Each slot is an existing image (has id) or a newly picked one (uri only, uploaded on save)
  const [slots, setSlots] = useState<{ id?: number; uri: string }[]>(
    (product?.image_ids ?? []).map((id, i) => ({ id, uri: (product?.images ?? [])[i] ?? '' })).filter(s => s.uri)
  );
  const [saving, setSaving]   = useState(false);
  const [progress, setProgress] = useState('');

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission requise', 'Autorisez l\'accès aux photos.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 8, quality: 0.7 });
    if (!res.canceled) setSlots(prev => [...prev, ...res.assets.map(a => ({ uri: a.uri }))].slice(0, 8));
  };

  const save = async () => {
    const p = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (!name.trim()) { Alert.alert('Nom requis', 'Entrez le nom.'); return; }
    if (!p || p <= 0) { Alert.alert('Prix invalide', 'Entrez un prix valide.'); return; }
    setSaving(true);
    try {
      // Build the full ordered image set (upload any new photos, keep existing IDs)
      const image_ids: number[] = [];
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.id) { image_ids.push(s.id); continue; }
        setProgress(`Téléversement photo ${i + 1}…`);
        image_ids.push(await uploadMedia(s.uri));
      }
      setProgress('Enregistrement…');
      await post(`/vendor/products/${product.id}/update`, {
        name, description, price: p,
        stock: stock ? parseInt(stock, 10) : undefined,
        status: published ? 'publish' : 'draft',
        image_ids, // full ordered set; empty clears all
      }, true);
      Alert.alert('Enregistré', 'Produit mis à jour.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Échec.'); }
    finally { setSaving(false); setProgress(''); }
  };

  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="check" onPress={save} disabled={saving}>{saving ? (progress || 'Enregistrement...') : 'Enregistrer'}</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Modifier le produit" />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 14 }}>
        {/* Photos — add / remove / reorder (first = main) */}
        <View>
          <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>Photos ({slots.length}/8)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {slots.map((s, i) => (
              <View key={s.uri + i} style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: LMX.surfaceAlt }}>
                <Image source={{ uri: s.uri }} style={{ width: '100%', height: '100%' }} />
                <Pressable onPress={() => setSlots(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={12} color="#fff" /></Pressable>
                {i === 0 && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: LMX.brand, paddingVertical: 2, alignItems: 'center' }}><Text style={{ fontSize: 8, color: '#fff', fontFamily: sans(700) }}>PRINCIPALE</Text></View>}
              </View>
            ))}
            {slots.length < 8 && (
              <Pressable onPress={pickImages} style={{ width: 84, height: 84, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: LMX.surface }}>
                <Icon name="plus" size={22} color={LMX.ink70} />
                <Text style={{ fontSize: 10, color: LMX.ink70, fontFamily: sans(600) }}>Ajouter</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        <Field label="Nom du produit" value={name} onChangeText={setName} />
        <Field label="Description" value={description} onChangeText={setDescription} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Prix (GNF)" value={price} onChangeText={setPrice} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="Inchangé" /></View>
        </View>
        <View style={{ backgroundColor: LMX.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Publié</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>Visible par les clients</Text>
          </View>
          <Pressable onPress={() => setPublished(v => !v)}>
            <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: published ? LMX.emerald : LMX.ink10, justifyContent: 'center' }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', marginLeft: published ? 20 : 2 }} />
            </View>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

// ── Vendor: orders ─────────────────────────────────────────────
const VENDOR_STAGES: { key: string; label: string }[] = [
  { key: 'processing', label: 'En préparation' },
  { key: 'packed', label: 'Emballé' },
  { key: 'ready-dispatch', label: 'Prêt' },
];

export function ScreenVendorOrders() {
  const nav = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const r = await get<{ orders: Order[] }>('/vendor/orders', true); setOrders(r.orders ?? []); }
    catch (e: any) { setError(e?.message ?? 'Erreur de chargement.'); }
    finally { setLoad(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Commandes" right={<IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />} />
      {loading ? (
        <View style={{ paddingTop: 50 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : error ? (
        <View style={{ alignItems: 'center', paddingTop: 44, gap: 10, paddingHorizontal: 32 }}>
          <Icon name="close" size={40} color={LMX.rose} />
          <Text style={{ fontSize: 13.5, color: LMX.ink70, textAlign: 'center' }}>{error}</Text>
          <Button variant="ghost" size="md" onPress={() => { setLoad(true); load(); }}>Réessayer</Button>
        </View>
      ) : orders.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 50, gap: 12 }}>
          <Icon name="package" size={44} color={LMX.ink30} />
          <Text style={{ fontSize: 14, color: LMX.ink70 }}>Aucune commande.</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {orders.map(o => (
            <Pressable key={o.id} onPress={() => nav.navigate('VendorOrder', { order: o })} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: mono(600), fontSize: 13 }}>#{o.number}</Text>
                  <Text style={{ fontSize: 10, color: LMX.brand, fontFamily: sans(700), textTransform: 'uppercase' }}>{o.status_label}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600), marginTop: 4 }}>{o.billing?.first_name} {o.billing?.last_name}</Text>
                <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{o.item_count} article(s) · {fr(o.total)} GNF</Text>
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
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Commande" />
        <View style={{ padding: 24 }}><Text style={{ color: LMX.ink50 }}>Commande introuvable.</Text></View>
      </Screen>
    );
  }

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      const res = await post<{ order: Order }>(`/vendor/orders/${order.id}/status`, { status }, true);
      const updated = res?.order ?? { ...order, status, status_label: status };
      setOrder(updated);
      Alert.alert('Statut mis à jour', `La commande est maintenant : ${updated.status_label}.`);
    } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Échec de la mise à jour.'); }
    finally { setBusy(false); }
  };

  // Store verifies the driver's pickup code to hand over the order.
  const verifyPickup = async () => {
    const code = pickupCode.trim();
    if (code.length < 4) { Alert.alert('Code requis', 'Saisissez le code à 4 chiffres communiqué par le livreur.'); return; }
    setBusy(true);
    try {
      const res = await post<{ order: Order }>(`/vendor/orders/${order!.id}/verify-pickup`, { code }, true);
      if (res?.order) setOrder(res.order);
      setPickupCode('');
      Alert.alert('Ramassage confirmé', 'Le livreur est vérifié. La commande lui a été remise.');
    } catch (e: any) {
      Alert.alert('Code incorrect', e?.message ?? 'Le code du livreur est incorrect.');
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <LoadingOverlay visible={busy} message="Traitement…" />
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={`Commande #${order.number}`} />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        {/* Status + total */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
          <View>
            <Text style={{ fontSize: 10, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Statut</Text>
            <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.brand, marginTop: 2 }}>{order.status_label}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Total</Text>
            <Text style={{ fontFamily: mono(700), fontSize: 16, marginTop: 2 }}>{fr(order.total)} GNF</Text>
          </View>
        </View>

        {/* Pickup verification — store enters the DRIVER's code to confirm his identity and
            hand over the order. Proves he's the driver Loomodex assigned. */}
        {order.pickup_pending && (
          <View style={{ backgroundColor: LMX.accentSoft, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.accent + '55', padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 12, fontFamily: sans(700), color: LMX.ink }}>📦 Vérifier le livreur</Text>
            <Text style={{ fontSize: 11.5, color: LMX.ink70, lineHeight: 16 }}>
              Demandez au livreur son code de ramassage à 4 chiffres et saisissez-le pour lui remettre la commande.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surface, paddingHorizontal: 14, justifyContent: 'center' }}>
                <TextInput value={pickupCode} onChangeText={setPickupCode} keyboardType="number-pad" maxLength={4} placeholder="••••" placeholderTextColor={LMX.ink50} style={{ fontFamily: mono(600), fontSize: 18, letterSpacing: 6, color: LMX.ink, padding: 0 }} />
              </View>
              <Button variant="accent" size="md" icon="check" onPress={verifyPickup} disabled={busy || pickupCode.trim().length < 4}>Confirmer</Button>
            </View>
          </View>
        )}

        {/* Order info — customer phone/address are hidden from the store for privacy;
            delivery contact & location are handled by the Loomodex delivery side. */}
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14, gap: 10 }}>
          <LogiRow icon="user" label="Client" value={order.billing?.first_name || '—'} />
          {!!order.payment_method && <LogiRow icon="money" label="Paiement" value={order.payment_method} />}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: LMX.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Icon name="shield" size={13} color={LMX.ink50} />
            <Text style={{ flex: 1, fontSize: 10.5, color: LMX.ink50, lineHeight: 14 }}>Coordonnées client gérées par la livraison Loomodex.</Text>
          </View>
        </View>

        {/* Driver / pickup — so the vendor can follow who collected the order and when */}
        {!!order.driver && (
          <View style={{ backgroundColor: LMX.brandSoft, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.brand + '33', padding: 14, gap: 8 }}>
            <Text style={{ fontSize: 11, color: LMX.brandDeep, textTransform: 'uppercase', fontFamily: sans(700) }}>Livraison</Text>
            <LogiRow icon="bike" label="Livreur" value={order.driver.name || '—'} />
            {!!order.pickup_time && <LogiRow icon="check" label="Récupéré" value={new Date(order.pickup_time.replace(' ', 'T')).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />}
            {!order.pickup_time && <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>En attente de récupération par le livreur.</Text>}
            {!!order.driver.phone && (
              <Pressable onPress={() => call(order.driver!.phone)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: LMX.surface, borderWidth: 1, borderColor: LMX.border }}>
                <Icon name="phone" size={14} color={LMX.ink} /><Text style={{ fontSize: 12, fontFamily: sans(600) }}>Appeler le livreur</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Items */}
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
          <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 8 }}>Articles</Text>
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
              Commande prise en charge par le livreur. Le statut est désormais géré par la livraison et ne peut plus être modifié depuis la boutique.
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>Mettre à jour le statut</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {VENDOR_STAGES.map(s => {
                const active = order.status === s.key;
                return (
                  <Pressable key={s.key} onPress={() => !active && setStatus(s.key)} disabled={busy} style={{ flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', backgroundColor: active ? LMX.brand : LMX.surfaceAlt, borderWidth: 1, borderColor: active ? LMX.brand : LMX.border }}>
                    <Text style={{ fontSize: 10.5, fontFamily: sans(600), color: active ? '#fff' : LMX.ink70 }}>{s.label}</Text>
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

// ── Vendor: store settings (policies) ──────────────────────────
export function ScreenVendorStore() {
  const nav = useNavigation<any>();
  const [name, setName]         = useState('');
  const [shipping, setShipping] = useState('');
  const [refund, setRefund]     = useState('');
  const [loading, setLoad]      = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    get<{ name: string; shipping_policy: string; refund_policy: string }>('/vendor/store', true)
      .then(d => { setName(d.name ?? ''); setShipping(d.shipping_policy ?? ''); setRefund(d.refund_policy ?? ''); })
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await post('/vendor/store/update', { shipping_policy: shipping, refund_policy: refund }, true);
      Alert.alert('Enregistré', 'Politiques mises à jour.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Échec.'); }
    finally { setSaving(false); }
  };

  return (
    <Screen footer={<Button full variant="accent" size="lg" icon="check" onPress={save} disabled={saving || loading}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Ma boutique" />
      {loading ? <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} /></View> : (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 14 }}>
          {!!name && <Text style={{ fontSize: 16, fontFamily: sans(700), color: LMX.ink }}>{decodeEntities(name)}</Text>}
          <Field label="Politique de livraison" value={shipping} onChangeText={setShipping} placeholder="Décrivez vos délais et conditions de livraison" />
          <Field label="Politique de remboursement" value={refund} onChangeText={setRefund} placeholder="Décrivez vos conditions de retour / remboursement" />
        </View>
      )}
    </Screen>
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
  const [cats, setCats]               = useState<any[]>([]);
  const [images, setImages]           = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);
  const [progress, setProgress]       = useState('');

  useEffect(() => {
    get<{ categories: any[] }>('/categories').then(r => setCats(r.categories ?? [])).catch(() => {});
  }, []);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission requise', 'Autorisez l\'accès aux photos pour ajouter des images.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.7,
    });
    if (!res.canceled) {
      const uris = res.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris].slice(0, 6));
    }
  };

  const submit = async () => {
    const p = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (!name.trim())  { Alert.alert('Nom requis', 'Entrez le nom du produit.'); return; }
    if (!p || p <= 0)  { Alert.alert('Prix invalide', 'Entrez un prix valide.'); return; }
    setSaving(true);
    try {
      // Upload images to the media library first → collect attachment IDs.
      // Errors surface (instead of silently creating an imageless product).
      const imageIds: number[] = [];
      for (let i = 0; i < images.length; i++) {
        setProgress(`Téléversement photo ${i + 1}/${images.length}…`);
        imageIds.push(await uploadMedia(images[i]));
      }
      setProgress('Publication…');
      await post('/vendor/products/create', {
        name, description, price: p,
        stock: stock ? parseInt(stock, 10) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        image_ids: imageIds,
      }, true);
      Alert.alert('Publié', 'Votre produit a été publié.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Échec de la publication.');
    } finally { setSaving(false); setProgress(''); }
  };

  return (
    <Screen footer={
      <Button full variant="accent" size="lg" icon="check" onPress={submit} disabled={saving}>
        {saving ? (progress || 'Publication...') : 'Publier le produit'}
      </Button>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Ajouter un produit" />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 14 }}>
        {/* Gallery */}
        <View>
          <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>Photos ({images.length}/6)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {images.map((uri, i) => (
              <View key={uri + i} style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: LMX.surfaceAlt }}>
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                <Pressable onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="close" size={12} color="#fff" />
                </Pressable>
                {i === 0 && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: LMX.brand, paddingVertical: 2, alignItems: 'center' }}><Text style={{ fontSize: 8, color: '#fff', fontFamily: sans(700) }}>PRINCIPALE</Text></View>}
              </View>
            ))}
            {images.length < 6 && (
              <Pressable onPress={pickImages} style={{ width: 84, height: 84, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: LMX.surface }}>
                <Icon name="plus" size={22} color={LMX.ink70} />
                <Text style={{ fontSize: 10, color: LMX.ink70, fontFamily: sans(600) }}>Ajouter</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        <Field label="Nom du produit *" value={name} onChangeText={setName} placeholder="ex. Sac à main en cuir" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Décrivez votre produit" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Prix (GNF) *" value={price} onChangeText={setPrice} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="Optionnel" /></View>
        </View>
        <Picker
          label="Catégorie" value={categoryId} onChange={setCategoryId}
          placeholder="Sélectionner une catégorie"
          options={cats.map(c => ({ value: String(c.id), label: decodeEntities(c.name ?? c.label ?? '') }))}
        />
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
    if (res.sms_sent) {
      Alert.alert('Demande envoyée', `Un SMS avec le lien de partage de position a été envoyé au ${res.phone}. Sa position apparaîtra sur la carte dès qu'il l'aura partagé.`);
      return;
    }
    const msg = `Loomodex : partagez votre position exacte pour votre livraison en un tap : ${res.url}`;
    Alert.alert(
      'Envoyer le lien de position',
      `Le SMS automatique n'est pas activé. Envoyez ce lien au destinataire (${res.phone}) :`,
      [
        { text: 'Ouvrir SMS', onPress: () => Linking.openURL(smsLink(res.phone, msg)).catch(() => {}) },
        { text: 'Copier le lien', onPress: async () => { await Clipboard.setStringAsync(res.url); Alert.alert('Copié', 'Lien copié. Collez-le dans WhatsApp ou un autre message.'); } },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  } catch (e: any) {
    Alert.alert('Envoi impossible', e?.message ?? 'Réessayez dans un instant.');
  }
}

// Share the secure tracking link with the customer (copy / WhatsApp)
const copyTrackLink = async (o: DeliveryOrder) => {
  if (!o.track_url) return;
  await Clipboard.setStringAsync(o.track_url);
  Alert.alert('Copié', 'Lien de suivi copié. Vous pouvez le coller au client.');
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
        <Icon name="receipt" size={14} color={LMX.ink} /><Text style={{ fontSize: 11.5, fontFamily: sans(600) }}>Copier le lien</Text>
      </Pressable>
      <Pressable onPress={() => shareTrackWhatsApp(o)} style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: '#25D366' }}>
        <Icon name="phone" size={14} color="#fff" /><Text style={{ fontSize: 11.5, fontFamily: sans(600), color: '#fff' }}>Partager le suivi</Text>
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

  const load = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([
        driverApi.orders(tab === 'active' ? undefined : tab),
        driverApi.summary(),
      ]);
      setOrders(o.orders ?? []);
      setSummary(s);
    } catch {}
    finally { setLoad(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { setLoad(true); load(); }, [load]));

  // Broadcast live GPS while a delivery is in progress
  const inProgress = orders.some(o => ['out-delivery', 'driver-arrived'].includes(o.status));
  useEffect(() => {
    if (!inProgress) return;
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
  }, [inProgress]);

  const advance = async (o: DeliveryOrder, to: 'out-delivery' | 'driver-arrived') => {
    setBusy(o.id);
    try { await driverApi.updateStatus(o.id, to); await load(); }
    catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Action impossible.'); }
    finally { setBusy(null); }
  };

  const verifyOtp = async (o: DeliveryOrder) => {
    const code = (otpInputs[o.id] ?? '').trim();
    if (code.length < 4) { Alert.alert('Code requis', 'Entrez le code à 4 chiffres communiqué par le client.'); return; }
    setBusy(o.id);
    try {
      const res = await ordersApi.verifyOtp(o.id, code);
      if (res.verified) { Alert.alert('Confirmé', 'Livraison confirmée avec succès.'); setOtp(p => ({ ...p, [o.id]: '' })); await load(); }
      else Alert.alert('Code incorrect', res.message ?? 'Veuillez réessayer.');
    } catch (e: any) {
      Alert.alert('Code incorrect', e?.message ?? 'Veuillez réessayer.');
    } finally { setBusy(null); }
  };

  return (
    <Screen>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LMX.navy, alignItems: 'center', justifyContent: 'center' }}><Icon name="truck" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: sans(700) }}>Tableau de bord livreur</Text>
            <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 1 }}>{`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Livreur'}</Text>
          </View>
          <IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />
          <DashboardProfileBtn />
          <DashboardLogoutBtn />
        </View>
      </View>

      {/* Stats: Active / Today / Total / Failed */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
        <DriverStatCard value={summary?.active_count ?? 0}    label="Actives" />
        <DriverStatCard value={summary?.trips_today ?? 0}     label="Aujourd'hui" />
        <DriverStatCard value={summary?.total_delivered ?? 0} label="Total" color={LMX.emerald} />
        <DriverStatCard value={summary?.failed_count ?? 0}    label="Échecs" color={LMX.rose} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
        {DRIVER_TABS.map(t => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => { setTab(t.key); setLoad(true); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: on ? (t.key === 'failed' ? LMX.rose : LMX.brand) : LMX.surface, borderWidth: 1, borderColor: on ? 'transparent' : LMX.border }}>
              <Icon name={t.icon} size={13} color={on ? '#fff' : LMX.ink70} />
              <Text style={{ fontSize: 12, fontFamily: sans(700), color: on ? '#fff' : LMX.ink70 }}>{t.label}</Text>
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
            {tab === 'active' ? 'Aucune livraison active.' : tab === 'history' ? 'Aucune livraison terminée.' : 'Aucun échec de livraison.'}
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
            <Text style={{ fontSize: 9.5, fontFamily: sans(700), color: st.color, textTransform: 'uppercase' }}>{st.label}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600), color: LMX.ink, marginTop: 5 }}>{o.customer_name || 'Client'}</Text>
        <Text numberOfLines={1} style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{o.zone_label || o.commune || o.city || 'Conakry'} · {fr(o.total)} GNF</Text>
      </View>
      <Icon name="chevR" size={16} color={LMX.ink50} />
    </Pressable>
  );
}

// Pickup: driver enters the code the store reads to them → confirms collection.
// Driver DISPLAYS his pickup code — he tells it to the store, who enters it to release the
// order. The order advances (to "on the way") when the store verifies it.
function PickupCodeDisplay({ code }: { code?: string | null }) {
  return (
    <View style={{ backgroundColor: LMX.accentSoft, borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: LMX.accent + '55', alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color: LMX.accent, textTransform: 'uppercase', fontFamily: sans(700), letterSpacing: 0.5 }}>Votre code de ramassage</Text>
      <Text style={{ fontFamily: mono(700), fontSize: 34, letterSpacing: 10, color: LMX.ink }}>{code || '••••'}</Text>
      <Text style={{ fontSize: 11.5, color: LMX.ink70, textAlign: 'center', lineHeight: 16 }}>
        Donnez ce code au magasin. Il le saisit pour vérifier votre identité et vous remettre la commande.
      </Text>
    </View>
  );
}

function DriverActiveCard({ o, busy, otp, onOtp, onAdvance, onVerify, onLocationRequest }: {
  o: DeliveryOrder; busy: boolean; otp: string;
  onOtp: (v: string) => void;
  onAdvance: (o: DeliveryOrder, to: 'out-delivery' | 'driver-arrived') => void;
  onVerify: (o: DeliveryOrder) => void;
  onLocationRequest: (o: DeliveryOrder) => void;
}) {
  const st = STATUS_STYLE[o.status] ?? { label: o.status_label, color: LMX.brand };
  const showOtp = ['driver-arrived', 'otp-pending'].includes(o.status);

  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
        <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.number}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: st.color + '1A' }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: st.color }} />
          <Text style={{ fontSize: 10, fontFamily: sans(700), color: st.color, textTransform: 'uppercase' }}>{st.label}</Text>
        </View>
      </View>

      <View style={{ padding: 14, gap: 11 }}>
        <DriverInfoRow icon="user"><Text style={{ fontSize: 13, fontFamily: sans(700) }}>{o.customer_name || 'Client'}</Text></DriverInfoRow>
        {!!o.zone_label && <DriverInfoRow icon="pin">{o.zone_label}</DriverInfoRow>}

        {/* Pickup */}
        <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(700), textTransform: 'uppercase', marginBottom: 3 }}>📦 Adresse de retrait</Text>
          {!!o.pickup?.store && <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.ink }}>{decodeEntities(o.pickup.store)}</Text>}
          <Text style={{ fontSize: 12, color: LMX.ink70, marginTop: 1 }}>{o.pickup?.address || 'Adresse du vendeur indisponible'}</Text>
        </View>

        {/* Delivery */}
        <View style={{ backgroundColor: '#EAF1FF', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 9.5, color: LMX.brand, fontFamily: sans(700), textTransform: 'uppercase', marginBottom: 3 }}>📍 Adresse de livraison</Text>
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
              Demander la position
            </Text>
          </Pressable>
        )}

        {/* Payment */}
        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: o.payment === 'cod' ? '#FFF4E5' : LMX.emeraldSoft }}>
          <Icon name={o.payment === 'cod' ? 'money' : 'wallet'} size={13} color={o.payment === 'cod' ? LMX.accent : LMX.emerald} />
          <Text style={{ fontSize: 11.5, fontFamily: sans(700), color: o.payment === 'cod' ? LMX.accent : LMX.emerald }}>
            {o.payment === 'cod' ? `Paiement à la livraison · ${o.formatted_total}` : 'Déjà payé'}
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
                  Destinataire différent du client · {o.recipient_phone}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => call(o.recipient_phone || o.customer_phone)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 10, backgroundColor: LMX.brand }}>
                <Icon name="phone" size={15} color="#fff" /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: '#fff' }}>Appeler</Text>
              </Pressable>
              <Pressable onPress={() => whatsapp(o.whatsapp || o.recipient_phone || o.customer_phone)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 10, backgroundColor: '#25D366' }}>
                <Icon name="phone" size={15} color="#fff" /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: '#fff' }}>WhatsApp</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Stage action — pickup now requires the store's code before "on the way" */}
        {o.status === 'assigned-driver' && (
          <PickupCodeDisplay code={o.pickup_otp} />
        )}
        {o.status === 'out-delivery' && (
          <Button full variant="primary" size="md" icon="pin" onPress={() => onAdvance(o, 'driver-arrived')} disabled={busy}>Je suis arrivé</Button>
        )}
        {showOtp && (
          <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 12, padding: 12, gap: 10 }}>
            <Text style={{ fontSize: 12, fontFamily: sans(700) }}>🔒 Code de livraison</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50 }}>Demandez au client le code à 4 chiffres reçu par SMS.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surface, paddingHorizontal: 14, justifyContent: 'center' }}>
                <TextInput value={otp} onChangeText={onOtp} keyboardType="number-pad" maxLength={6} placeholder="••••" placeholderTextColor={LMX.ink50} style={{ fontFamily: mono(600), fontSize: 18, letterSpacing: 6, color: LMX.ink, padding: 0 }} />
              </View>
              <Button variant="accent" size="md" icon="check" onPress={() => onVerify(o)} disabled={busy}>Vérifier</Button>
            </View>
            {o.otp_attempts > 0 && <Text style={{ fontSize: 10.5, color: LMX.rose }}>{o.otp_attempts} tentative(s) utilisée(s)</Text>}
          </View>
        )}
      </View>
    </View>
  );
}

// Driver order detail — full info + actions (status, OTP)
export function ScreenDriverOrder() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [order, setOrder] = useState<DeliveryOrder | undefined>(route.params?.order);
  const [busy, setBusy]   = useState(false);
  const [otp, setOtp]     = useState('');
  const [custLoc, setCustLoc] = useState<{ lat: number; lng: number } | null>(null);

  // Poll the customer's shared live location so the driver can navigate to them
  useEffect(() => {
    if (!order) return;
    const load = () => ordersApi.tracking(order.id)
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
  }, [order?.id]);

  if (!order) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Commande" />
        <View style={{ padding: 24 }}><Text style={{ color: LMX.ink50 }}>Commande introuvable.</Text></View>
      </Screen>
    );
  }

  const advance = async (o: DeliveryOrder, to: 'out-delivery' | 'driver-arrived') => {
    setBusy(true);
    try { const res = await driverApi.updateStatus(o.id, to); if (res?.order) setOrder(res.order); }
    catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Action impossible.'); }
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
    if (otp.trim().length < 4) { Alert.alert('Code requis', 'Entrez le code à 4 chiffres communiqué par le client.'); return; }
    setBusy(true);
    try {
      const res = await ordersApi.verifyOtp(o.id, otp.trim());
      if (res.verified) { Alert.alert('Confirmé', 'Livraison confirmée avec succès.', [{ text: 'OK', onPress: () => nav.goBack() }]); }
      else Alert.alert('Code incorrect', res.message ?? 'Veuillez réessayer.');
    } catch (e: any) { Alert.alert('Code incorrect', e?.message ?? 'Veuillez réessayer.'); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={`Commande #${order.number}`} />
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        {custLoc && (
          <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${custLoc.lat},${custLoc.lng}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LMX.brand, borderRadius: LMX.r.lg, padding: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={18} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: sans(700), color: '#fff' }}>Naviguer vers le client</Text>
              <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.85, marginTop: 2 }}>Position partagée par le client · ouvrir dans Maps</Text>
            </View>
            <Icon name="arrowR" size={16} color="#fff" />
          </Pressable>
        )}
        <DriverActiveCard o={order} busy={busy} otp={otp} onOtp={setOtp} onAdvance={advance} onVerify={verifyOtp} onLocationRequest={requestLocation} />
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
        <Text style={{ fontSize: 11, fontFamily: sans(700), color }}>{failed ? 'Échec' : 'Livrée'}</Text>
      </View>
      <Text style={{ fontSize: 12.5, color: LMX.ink, marginTop: 6 }}>{o.customer_name}</Text>
      <Text style={{ fontSize: 11.5, color: LMX.ink50, marginTop: 2 }}>{[o.commune, o.neighborhood].filter(Boolean).join(' — ') || o.city}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50 }}>{o.delivery_time || o.date || ''}</Text>
        <Text style={{ fontFamily: mono(700), fontSize: 13, color: LMX.accent }}>{o.formatted_total}</Text>
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

function LogisticsCard({ o, drivers, onAssigned }: { o: DeliveryOrder; drivers: LogisticsDriver[]; onAssigned: () => void }) {
  const nav = useNavigation<any>();
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const st = STATUS_STYLE[o.status] ?? { label: o.status_label, color: LMX.ink50 };

  const assign = async (driverId: number) => {
    setBusy(true);
    try { await logisticsApi.assignDriver(o.id, driverId); setOpen(false); onAssigned(); }
    catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Impossible d\'assigner.'); }
    finally { setBusy(false); }
  };

  const canAssign   = ['processing', 'ready-dispatch'].includes(o.status);
  const canResend   = ['assigned-driver', 'out-delivery', 'driver-arrived', 'otp-pending'].includes(o.status);
  const canOverride = ['blocked', 'expired'].includes(o.otp_status);

  const resendOtp = async () => {
    setBusy(true);
    try { await logisticsApi.sendOtp(o.id); Alert.alert('OTP envoyé', 'Le code a été (re)envoyé au client.'); onAssigned(); }
    catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Envoi impossible.'); }
    finally { setBusy(false); }
  };
  const override = () => {
    Alert.alert('Forcer la livraison', 'Marquer comme livré sans code OTP ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await logisticsApi.overrideOtp(o.id); onAssigned(); }
        catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Action impossible.'); }
        finally { setBusy(false); }
      }},
    ]);
  };

  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: o.status === 'delivery-failed' ? LMX.rose : LMX.border, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.number}</Text>
          <Text style={{ fontSize: 10.5, color: LMX.ink50, fontFamily: mono(400) }}>· {fr(o.total)} GNF</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: st.color + '1A' }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: st.color }} />
          <Text style={{ fontSize: 10, fontFamily: sans(700), color: st.color, textTransform: 'uppercase' }}>{st.label}</Text>
        </View>
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        <LogiRow icon="user" label="Client" value={`${o.customer_name} · ${o.customer_phone}`} />
        <LogiRow icon="storefront" label="Retrait" value={[o.pickup?.store, o.pickup?.address].filter(Boolean).join(' · ') || 'Vendeur'} />
        <LogiRow icon="pin" label="Livraison" value={o.delivery_address || [o.address, o.neighborhood, o.city].filter(Boolean).join(', ') || 'Conakry'} />
        <LogiRow icon="money" label="Paiement" value={`${o.payment_method} · ${fr(o.total)} GNF`} />
        {/* OTP status + code (see OTP) */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="shield" size={13} color={LMX.ink70} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase' }}>Code OTP</Text>
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
              <Icon name="pin" size={13} color="#fff" /><Text style={{ fontSize: 11.5, fontFamily: sans(600), color: '#fff' }}>Position</Text>
            </Pressable>
          </View>
        ) : canAssign ? (
          <>
            <Pressable onPress={() => setOpen(v => !v)} style={{ height: 44, borderRadius: 12, backgroundColor: LMX.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="bike" size={15} color="#fff" /><Text style={{ fontSize: 12.5, fontFamily: sans(600), color: '#fff' }}>Assigner un livreur</Text><Icon name={open ? 'chevU' : 'chevD'} size={13} color="#fff" />
            </Pressable>
            {open && (
              <View style={{ gap: 6, opacity: busy ? 0.6 : 1 }}>
                {drivers.length === 0 ? (
                  <Text style={{ fontSize: 12, color: LMX.ink50, textAlign: 'center', paddingVertical: 8 }}>Aucun livreur disponible.</Text>
                ) : drivers.map(d => (
                  <Pressable key={d.id} onPress={() => assign(d.id)} disabled={busy} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: LMX.surfaceAlt }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: d.online ? LMX.emerald : LMX.ink30 }} />
                    <Text style={{ flex: 1, fontSize: 12.5, fontFamily: sans(600) }}>{d.name}</Text>
                    <Text style={{ fontSize: 11, color: LMX.ink50 }}>{d.active_count} active{d.active_count !== 1 ? 's' : ''}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>En attente de confirmation du support.</Text>
        )}
      </View>

      {(canResend || canOverride || !!o.driver_name) && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {!!o.driver_name && (
            <Button variant="ghost" size="md" style={{ flex: 1, minWidth: 150 }} icon="pin"
              onPress={async () => { setBusy(true); try { await promptSendLocation(o.id); } finally { setBusy(false); } }} disabled={busy}>
              Demander position
            </Button>
          )}
          {canResend && <Button variant="ghost" size="md" style={{ flex: 1 }} icon="arrowR" onPress={resendOtp} disabled={busy}>Renvoyer OTP</Button>}
          {canOverride && <Button variant="accent" size="md" style={{ flex: 1 }} icon="shield" onPress={override} disabled={busy}>Forcer</Button>}
        </View>
      )}
    </View>
  );
}

// Driver live-location viewer (logistics / admin)
export function ScreenDriverLocate() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const orderId: number = route.params?.orderId;
  const number: string = route.params?.number ?? '';
  const [track, setTrack] = useState<OrderTracking | null>(null);

  const load = useCallback(() => { if (orderId) ordersApi.tracking(orderId).then(setTrack).catch(() => {}); }, [orderId]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const d = track?.driver;
  const live = !!(track?.maps_key && d && d.lat != null && d.lng != null);

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={`Livreur · ${number || '#' + orderId}`} right={<IconBtn icon="refresh" onPress={load} />} />
      <View style={{ paddingHorizontal: 16 }}>
        {live ? (
          <LiveMap mapsKey={track!.maps_key} driver={{ lat: d!.lat as number, lng: d!.lng as number }} destination={track!.destination} height={300} />
        ) : (
          <View style={{ height: 300, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 }}>
            <Icon name="pin" size={26} color={LMX.brand} />
            <Text style={{ fontSize: 12.5, color: LMX.ink70, textAlign: 'center', lineHeight: 18 }}>
              {track?.active ? 'En attente de la position du livreur en direct…' : 'La position en direct s\'affiche lorsque le livreur est en route.'}
            </Text>
          </View>
        )}
      </View>
      {!!d && (
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bike" size={18} color={LMX.ink} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>{d.name || 'Livreur'}</Text>
              <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>{track?.status_label}{d.updated ? ` · maj ${Math.max(0, Math.round((Date.now() / 1000 - d.updated) / 60))} min` : ''}</Text>
            </View>
            {!!d.phone && <Pressable onPress={() => Linking.openURL(`tel:${d.phone}`)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: LMX.ink, alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={18} color="#fff" /></Pressable>}
          </View>
        </View>
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

  const load = useCallback(async () => {
    try {
      const [o, s, d] = await Promise.all([logisticsApi.orders(), logisticsApi.stats(), logisticsApi.drivers()]);
      setOrders(o.orders ?? []);
      setCounts(s.counts ?? {});
      setDrivers(d.drivers ?? []);
    } catch {}
    finally { setLoad(false); }
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
    { value: '', label: 'Toutes les zones' },
    ...Array.from(new Map(orders.filter(o => o.zone).map(o => [o.zone, { value: o.zone, label: o.zone_label || o.zone }])).values()),
  ];
  const driverOpts = [{ value: '', label: 'Tous les livreurs' }, ...drivers.map(d => ({ value: String(d.id), label: d.name }))];

  const shown = orders.filter(o =>
    (!fStatus || o.status === fStatus) &&
    (!fZone || o.zone === fZone) &&
    (!fDriver || String(o.driver_id) === fDriver)
  );
  const hasFilter = !!(fStatus || fZone || fDriver);

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn icon="chevL" onPress={() => nav.goBack()} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Logistique</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>Hub Conakry</Text>
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
            <Text style={{ fontSize: 10, color: LMX.ink50, marginTop: 4, fontFamily: sans(600) }}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Filters: status / zone / driver */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Picker label="Statut" value={fStatus} onChange={setFStatus} options={LOGI_STATUS_OPTS} placeholder="Tous" /></View>
        <View style={{ flex: 1 }}><Picker label="Zone" value={fZone} onChange={setFZone} options={zoneOpts} placeholder="Toutes" /></View>
        <View style={{ flex: 1 }}><Picker label="Livreur" value={fDriver} onChange={setFDriver} options={driverOpts} placeholder="Tous" /></View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Commandes · {shown.length}</Text>
        {hasFilter && (
          <Pressable onPress={() => { setFStatus(''); setFZone(''); setFDriver(''); }}>
            <Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>Effacer les filtres</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : shown.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 30, gap: 10 }}>
          <Icon name="truck" size={40} color={LMX.ink30} />
          <Text style={{ fontSize: 13, color: LMX.ink50 }}>{hasFilter ? 'Aucune commande pour ce filtre.' : 'Aucune commande en cours.'}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}>
          {shown.map(o => <LogisticsCard key={o.id} o={o} drivers={drivers} onAssigned={load} />)}
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
    catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Action impossible.'); }
    finally { setBusy(null); }
  };

  const reject = (o: DeliveryOrder) => {
    Alert.alert('Rejeter la commande', `Confirmer le rejet de ${o.number} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Rejeter', style: 'destructive', onPress: async () => {
        setBusy(o.id);
        try { await csApi.rejectOrder(o.id, 'Rejetée via application'); await load(); }
        catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Action impossible.'); }
        finally { setBusy(null); }
      }},
    ]);
  };

  const addNote = (o: DeliveryOrder) => {
    Alert.prompt?.('Ajouter une note', `Note interne pour ${o.number}`, async (text?: string) => {
      if (!text?.trim()) return;
      setBusy(o.id);
      try { await csApi.addNote(o.id, text.trim()); Alert.alert('Note ajoutée'); }
      catch (e: any) { Alert.alert('Erreur', e?.message ?? 'Action impossible.'); }
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
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600) }}>Support client</Text>
            <Text style={{ fontSize: 15, fontFamily: sans(600), marginTop: 1 }}>Confirmation des commandes</Text>
          </View>
          <IconBtn icon="refresh" onPress={() => { setLoad(true); load(); }} />
          <DashboardProfileBtn />
          <DashboardLogoutBtn />
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
        <DriverStatCard value={counts.awaiting} label="À confirmer" />
        <DriverStatCard value={counts.confirmed_today} label="Confirmées auj." color={LMX.emerald} />
        <DriverStatCard value={counts.rejected_today} label="Rejetées auj." color={LMX.rose} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
        {(['pending', 'history'] as const).map(t => {
          const on = tab === t;
          return (
            <Pressable key={t} onPress={() => { setTab(t); setLoad(true); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: on ? LMX.brand : LMX.surface, borderWidth: 1, borderColor: on ? 'transparent' : LMX.border }}>
              <Text style={{ fontSize: 12, fontFamily: sans(700), color: on ? '#fff' : LMX.ink70 }}>{t === 'pending' ? 'À confirmer' : 'Confirmées / Annulées'}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 999, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: LMX.border }}>
          <Icon name="search" size={16} color={LMX.ink50} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Commande, nom, téléphone…" placeholderTextColor={LMX.ink50} style={{ flex: 1, fontSize: 13.5, color: LMX.ink, fontFamily: sans(400), padding: 0 }} />
          {query.length > 0 && <Pressable onPress={() => setQuery('')}><Icon name="close" size={15} color={LMX.ink50} /></Pressable>}
        </View>
      </View>

      {loading ? (
        <View style={{ paddingTop: 40 }}><ActivityIndicator color={LMX.brand} size="large" /></View>
      ) : shown.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
          <Icon name="checkCircle" size={44} color={LMX.emerald} />
          <Text style={{ fontSize: 14, color: LMX.ink70 }}>{tab === 'pending' ? 'Aucune commande en attente.' : 'Aucune commande dans l\'historique.'}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 10 }}>
          {shown.map(o => (
            <View key={o.id} style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: LMX.hairline }}>
                <Text style={{ fontFamily: mono(600), fontSize: 13 }}>{o.number}</Text>
                <Text style={{ fontSize: 11, color: LMX.brand, fontFamily: sans(600) }}>{o.status_label}</Text>
              </View>
              <View style={{ padding: 14, gap: 10 }}>
                <LogiRow icon="user" label="Client" value={o.customer_name} />
                <LogiRow icon="pin" label="Adresse" value={o.delivery_address || [o.address, o.neighborhood, o.city].filter(Boolean).join(', ') || 'Conakry'} />
                {!!o.landmark && <LogiRow icon="pin" label="Repère" value={o.landmark} />}
                <LogiRow icon="money" label="Paiement" value={`${o.payment_method} · ${fr(o.total)} GNF`} />
              </View>

              {/* Contact */}
              {!!o.customer_phone && (
                <View style={{ paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => call(o.customer_phone)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, backgroundColor: LMX.surfaceAlt }}>
                    <Icon name="phone" size={14} color={LMX.ink} /><Text style={{ fontSize: 12, fontFamily: sans(600) }}>Appeler</Text>
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
                  <Button variant="ghost" size="md" style={{ flex: 1 }} onPress={() => reject(o)} disabled={busyId === o.id}>Rejeter</Button>
                  <Button variant="accent" size="md" style={{ flex: 1.4 }} icon="check" onPress={() => confirm(o)} disabled={busyId === o.id}>Confirmer</Button>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
