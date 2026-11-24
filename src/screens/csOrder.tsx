import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LMX, sans } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button } from '../components';
import { friendlyError, isApiError } from '../api/client';
import { csApi, CsCustomer, CsProduct } from '../api/cs';
import { t } from '../i18n';

/**
 * "Créer une commande pour un client" (Customer Service, by phone):
 *  1. find the customer by phone — or create the account (temporary password, changed at first login);
 *  2. add products from the agent's stores;
 *  3. continue in the normal checkout (Loomodex address, delivery fee, recipient), as the customer.
 */

const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR').replace(/ /g, ' ')} GNF`;

function genPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function Input({ label, value, onChange, secure, keyboardType, right, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; secure?: boolean; keyboardType?: any; right?: React.ReactNode; placeholder?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500) }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 12 }}>
        <TextInput value={value} onChangeText={onChange} secureTextEntry={secure} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={LMX.ink30} autoCapitalize="none"
          style={{ flex: 1, height: 44, fontSize: 14, color: LMX.ink }} />
        {right}
      </View>
    </View>
  );
}

export function ScreenCsNewOrder() {
  const nav = useNavigation<any>();
  const { data: me } = useQuery({ queryKey: ['cs-me'], queryFn: () => csApi.me() });
  const can = me?.permissions;

  const [phone, setPhone] = useState('');
  const [found, setFound] = useState<CsCustomer[] | null>(null);
  const [customer, setCustomer] = useState<CsCustomer | null>(null);
  const [searching, setSearching] = useState(false);

  // New account
  const [creating, setCreating] = useState(false);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  // Products
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CsProduct[]>([]);
  const [items, setItems] = useState<{ product: CsProduct; qty: number }[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const search = async () => {
    if (phone.replace(/\D/g, '').length < 8) { Alert.alert(t('Téléphone requis'), t('Veuillez saisir un numéro de téléphone valide.')); return; }
    setSearching(true);
    try { const r = await csApi.findCustomers(phone); setFound(r.customers); if (!r.customers.length) setCreating(true); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
    finally { setSearching(false); }
  };

  const createAccount = async () => {
    if (!first.trim() || !last.trim()) { Alert.alert(t('Champ requis'), t('Le prénom et le nom sont obligatoires.')); return; }
    if (pass.length < 8) { Alert.alert(t('Mot de passe'), t('Le mot de passe temporaire doit contenir au moins 8 caractères.')); return; }
    if (pass !== pass2) { Alert.alert(t('Mot de passe'), t('Les deux mots de passe ne correspondent pas.')); return; }
    setSaving(true);
    try {
      const r = await csApi.createCustomer({ first_name: first.trim(), last_name: last.trim(), phone, language: lang, password: pass, password_confirm: pass2 });
      setCustomer(r.customer); setCreating(false);
      Alert.alert(t('Compte créé'), t('Identifiant : {login}\nMot de passe temporaire : {pw}\n\nCommuniquez-les au client de façon sécurisée. Il devra changer son mot de passe à la première connexion.', { login: r.login, pw: pass }));
    } catch (e) {
      if (isApiError(e) && e.code === 'phone_exists') {
        Alert.alert(t('Compte existant'), t('Un compte existe déjà avec ce numéro. Sélectionnez ce client.'));
        const r = await csApi.findCustomers(phone).catch(() => null);
        if (r) setFound(r.customers);
        setCreating(false);
      } else Alert.alert(t('Erreur'), friendlyError(e));
    } finally { setSaving(false); }
  };

  const searchProducts = async () => {
    setLoadingProducts(true);
    try { setResults((await csApi.products(q.trim())).products); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); }
    finally { setLoadingProducts(false); }
  };

  const add = (p: CsProduct) => setItems(list => list.some(x => x.product.id === p.id) ? list.map(x => x.product.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...list, { product: p, qty: 1 }]);
  const setQty = (id: number, qty: number) => setItems(list => qty <= 0 ? list.filter(x => x.product.id !== id) : list.map(x => x.product.id === id ? { ...x, qty } : x));
  const subtotal = items.reduce((n, x) => n + x.product.price * x.qty, 0);

  const next = () => {
    if (!customer) return;
    if (!items.length) { Alert.alert(t('Produits'), t('Ajoutez au moins un produit.')); return; }
    nav.navigate('Checkout', { csOrder: { customer, items: items.map(x => ({ product_id: x.product.id, name: x.product.name, qty: x.qty, price: x.product.price })) } });
  };

  if (can && !can.create_order) {
    return (
      <Screen>
        <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Commande pour un client')} />
        <Text style={{ padding: 24, textAlign: 'center', color: LMX.ink50 }}>{t("Vous n'avez pas la permission de créer des commandes pour les clients.")}</Text>
      </Screen>
    );
  }

  return (
    <Screen footer={customer ? <Button full variant="accent" size="lg" icon="arrowR" onPress={next}>{t('Continuer : adresse et livraison')}</Button> : undefined}>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title={t('Commande pour un client')} />
      <View style={{ paddingHorizontal: 16, gap: 14, paddingBottom: 24 }}>
        {/* 1. Customer */}
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(700) }}>{t('1 · Client')}</Text>
        {customer ? (
          <View style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.emerald, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="user" size={18} color={LMX.emerald} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: sans(700), color: LMX.ink }}>{customer.name}</Text>
              <Text style={{ fontSize: 12, color: LMX.ink50 }}>{customer.phone}</Text>
            </View>
            <Pressable onPress={() => { setCustomer(null); setFound(null); }}><Text style={{ color: LMX.brand, fontFamily: sans(600) }}>{t('Changer')}</Text></Pressable>
          </View>
        ) : (
          <>
            <Input label={t('Téléphone du client')} value={phone} onChange={setPhone} keyboardType="phone-pad" placeholder="+224 6XX XX XX XX"
              right={searching ? <ActivityIndicator color={LMX.brand} /> : <Pressable onPress={search}><Icon name="search" size={18} color={LMX.brand} /></Pressable>} />
            {found && found.map(c => (
              <Pressable key={c.id} onPress={() => setCustomer(c)} style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, padding: 12 }}>
                <Text style={{ fontSize: 14, fontFamily: sans(600) }}>{c.name}</Text>
                <Text style={{ fontSize: 12, color: LMX.ink50 }}>{c.phone}{c.address?.neighborhood ? ` · ${c.address.neighborhood}` : ''}</Text>
              </Pressable>
            ))}
            {found && !found.length && <Text style={{ fontSize: 12.5, color: LMX.ink70 }}>{t('Aucun compte avec ce numéro.')}</Text>}
            {found && !creating && (can?.create_account ?? true) && (
              <Button variant="ghost" icon="plus" onPress={() => setCreating(true)}>{t('Créer un compte client')}</Button>
            )}
            {creating && (
              <View style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, padding: 12, gap: 10 }}>
                <Text style={{ fontSize: 14, fontFamily: sans(700) }}>{t('Nouveau compte client')}</Text>
                <Input label={t('Prénom *')} value={first} onChange={setFirst} />
                <Input label={t('Nom *')} value={last} onChange={setLast} />
                <Input label={t('Téléphone *')} value={phone} onChange={setPhone} keyboardType="phone-pad" placeholder="+224 6XX XX XX XX" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['fr', 'en'] as const).map(l => (
                    <Pressable key={l} onPress={() => setLang(l)} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: lang === l ? LMX.brand : LMX.bg, borderWidth: 1, borderColor: lang === l ? 'transparent' : LMX.border }}>
                      <Text style={{ fontFamily: sans(700), fontSize: 12.5, color: lang === l ? '#fff' : LMX.ink70 }}>{l === 'fr' ? 'Français' : 'English'}</Text>
                    </Pressable>
                  ))}
                </View>
                <Input label={t('Mot de passe temporaire *')} value={pass} onChange={setPass} secure={!show}
                  right={<Pressable onPress={() => setShow(v => !v)}><Icon name="eye" size={18} color={LMX.ink50} /></Pressable>} />
                <Button size="sm" variant="ghost" icon="refresh" onPress={() => { const p = genPassword(); setPass(p); setPass2(p); setShow(true); }}>{t('Générer un mot de passe temporaire')}</Button>
                <Input label={t('Confirmer le mot de passe *')} value={pass2} onChange={setPass2} secure={!show}
                  right={<Pressable onPress={() => setShow(v => !v)}><Icon name="eye" size={18} color={LMX.ink50} /></Pressable>} />
                <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>✓ {t('Changement du mot de passe obligatoire à la première connexion')}</Text>
                <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{t('Communiquez les identifiants temporaires au client de façon sécurisée.')}</Text>
                <Button full variant="accent" disabled={saving} onPress={createAccount}>{saving ? t('Création…') : t('Créer le compte et continuer')}</Button>
              </View>
            )}
          </>
        )}

        {/* 2. Products */}
        {customer && (
          <>
            <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(700), marginTop: 6 }}>{t('2 · Produits')}</Text>
            <Input label={t('Rechercher un produit')} value={q} onChange={setQ}
              right={loadingProducts ? <ActivityIndicator color={LMX.brand} /> : <Pressable onPress={searchProducts}><Icon name="search" size={18} color={LMX.brand} /></Pressable>} />
            {results.map(p => (
              <Pressable key={p.id} disabled={!p.purchasable || !p.in_stock} onPress={() => add(p)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, padding: 10, opacity: p.purchasable && p.in_stock ? 1 : 0.55 }}>
                {p.image ? <Image source={{ uri: p.image }} style={{ width: 44, height: 44, borderRadius: 8 }} /> : <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: LMX.surfaceAlt }} />}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: sans(600) }}>{p.name}</Text>
                  <Text style={{ fontSize: 11.5, color: LMX.ink50 }}>{p.store?.name || p.seller} · {fmt(p.price)}</Text>
                  {!p.purchasable && <Text style={{ fontSize: 11, color: LMX.accent }}>{t('Sur devis : utilisez la demande de devis du client')}</Text>}
                  {p.purchasable && !p.in_stock && <Text style={{ fontSize: 11, color: LMX.rose }}>{t('Rupture de stock')}</Text>}
                </View>
                {p.purchasable && p.in_stock && <Icon name="plus" size={18} color={LMX.brand} />}
              </Pressable>
            ))}
            {items.length > 0 && (
              <View style={{ backgroundColor: LMX.surface, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, padding: 12, gap: 8 }}>
                {items.map(x => (
                  <View key={x.product.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 13 }}>{x.product.name}</Text>
                    <Pressable onPress={() => setQty(x.product.id, x.qty - 1)}><Icon name="minus" size={18} color={LMX.ink70} /></Pressable>
                    <Text style={{ width: 24, textAlign: 'center', fontFamily: sans(700) }}>{x.qty}</Text>
                    <Pressable onPress={() => setQty(x.product.id, x.qty + 1)}><Icon name="plus" size={18} color={LMX.ink70} /></Pressable>
                  </View>
                ))}
                <Text style={{ fontSize: 13, fontFamily: sans(700), textAlign: 'right' }}>{t('Sous-total : {a}', { a: fmt(subtotal) })}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
