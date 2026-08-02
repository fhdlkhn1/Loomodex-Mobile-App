import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono, fr } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Toggle, Button, Field } from '../components';
import { get } from '../api/client';
import { profileApi } from '../api/profile';
import { useAuth } from '../context/AuthContext';

function WalletAction({ icon, label, highlight }: { icon: any; label: string; highlight?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: highlight ? LMX.ink : LMX.surface, borderWidth: highlight ? 0 : 1, borderColor: LMX.border, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={18} color={highlight ? '#fff' : LMX.ink} />
      <Text style={{ fontSize: 11, fontFamily: sans(600), color: highlight ? '#fff' : LMX.ink }}>{label}</Text>
    </View>
  );
}

function LinkedWallet({ name, bg, code, balance, primary, dark, last }: any) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <View style={{ width: 38, height: 28, borderRadius: 6, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: dark ? LMX.ink : '#fff', fontSize: 10, fontFamily: sans(700) }}>{code}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>{name}</Text>
          {primary && <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: LMX.brandSoft }}><Text style={{ fontSize: 9, fontFamily: sans(700), color: LMX.brandDeep, textTransform: 'uppercase' }}>Primary</Text></View>}
        </View>
        <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2, fontFamily: mono(400) }}>{balance}</Text>
      </View>
      <Icon name="chevR" size={14} color={LMX.ink50} />
    </View>
  );
}

function WalletTx({ tx, last }: any) {
  const credit = ['credit', 'refund', 'escrow_release'].includes(tx.type);
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: credit ? LMX.emeraldSoft : LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={credit ? 'arrowD' : 'bag'} size={15} color={credit ? LMX.emerald : LMX.ink70} /></View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontSize: 12.5, fontFamily: sans(600) }}>{tx.description || (credit ? 'Crédit' : 'Débit')}</Text>
        <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2 }}>{(tx.date || '').slice(0, 10)}</Text>
      </View>
      <Text style={{ fontFamily: mono(600), fontSize: 13, color: credit ? LMX.emerald : LMX.ink }}>{credit ? '+' : '−'}{fr(Math.abs(tx.amount || 0))}<Text style={{ fontSize: 9, color: LMX.ink50 }}> GNF</Text></Text>
    </View>
  );
}

export function ScreenWallet() {
  const nav = useNavigation<any>();
  const { user, isLoggedIn } = useAuth();
  const [walletData, setWallet] = useState<{ balance: number; transactions: any[] } | null>(null);
  const [loading, setLoad]      = useState(true);

  useFocusEffect(useCallback(() => {
    if (!isLoggedIn) { setLoad(false); return; }
    let alive = true;
    setLoad(true);
    get<{ balance: number; currency: string; transactions: any[] }>('/profile/wallet', true)
      .then(data => { if (alive) setWallet({ balance: data.balance, transactions: data.transactions ?? [] }); })
      .catch(() => {})
      .finally(() => { if (alive) setLoad(false); });
    return () => { alive = false; };
  }, [isLoggedIn]));

  const balance = walletData?.balance ?? user?.wallet ?? 0;
  const tx      = walletData?.transactions ?? [];

  if (!isLoggedIn) return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Mon portefeuille" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Icon name="wallet" size={48} color={LMX.ink30} />
        <Text style={{ fontSize: 15, color: LMX.ink70 }}>Connectez-vous pour voir votre solde</Text>
      </View>
    </Screen>
  );

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Mon portefeuille" right={<IconBtn icon="receipt" />} />
      <View style={{ paddingHorizontal: 16 }}>
        <LinearGradient colors={['#0B1F3A', '#1E6BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 22, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.65, textTransform: 'uppercase', fontFamily: sans(600) }}>Solde disponible</Text>
            <Icon name="eye" size={16} color="#fff" />
          </View>
          {loading
            ? <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />
            : <Text style={{ fontFamily: FONT.display, fontSize: 40, color: '#fff', marginTop: 10 }}>
                {fr(balance)}<Text style={{ fontSize: 13, opacity: 0.7, fontFamily: sans(400) }}> GNF</Text>
              </Text>
          }
          <View style={{ position: 'absolute', right: 18, top: 18, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)' }}>
            <Text style={{ fontSize: 9, fontFamily: sans(700), color: '#fff', textTransform: 'uppercase' }}>Loomodex Pay</Text>
          </View>
        </LinearGradient>
      </View>
      {/* Recharge */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <Button full variant="accent" size="lg" icon="plus" onPress={() => nav.navigate('WalletTopup')}>Recharger le portefeuille</Button>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 13, fontFamily: sans(600), marginBottom: 10 }}>Activité récente</Text>
        {tx.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
            <Icon name="receipt" size={32} color={LMX.ink30} />
            <Text style={{ fontSize: 13, color: LMX.ink50 }}>Aucune transaction</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
            {tx.map((t: any, i: number) => <WalletTx key={i} tx={t} last={i === tx.length - 1} />)}
          </View>
        )}
      </View>
    </Screen>
  );
}

// ── Wallet top-up (recharge) ───────────────────────────────────
const TOPUP_PRESETS = [10000, 25000, 50000, 100000, 250000];

export function ScreenWalletTopup() {
  const nav = useNavigation<any>();
  const { refreshUser } = useAuth();
  const [amount, setAmount]   = useState('');
  const [payUrl, setPayUrl]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const start = async () => {
    const amt = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!amt || amt < 1000) { Alert.alert('Montant invalide', 'Le minimum de recharge est 1 000 GNF.'); return; }
    setLoading(true);
    try {
      const res = await profileApi.topup(amt);
      setPayUrl(res.pay_url);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de démarrer la recharge.');
    } finally { setLoading(false); }
  };

  const onNav = (navState: any) => {
    const url: string = navState?.url ?? '';
    // WooCommerce redirects to the "order-received" (thank-you) page on success
    if (!done && url.includes('order-received')) {
      setDone(true);
      refreshUser();
      Alert.alert('Recharge réussie', 'Votre portefeuille a été crédité.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    }
  };

  // Payment WebView (website Stripe)
  if (payUrl) {
    return (
      <Screen scroll={false} padTop={false}>
        <AppBar left={<IconBtn icon="close" onPress={() => nav.goBack()} />} title="Paiement sécurisé" />
        <WebView
          source={{ uri: payUrl }}
          onNavigationStateChange={onNav}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          renderLoading={() => <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={LMX.brand} size="large" /></View>}
          style={{ flex: 1 }}
        />
      </Screen>
    );
  }

  return (
    <Screen footer={
      <Button full variant="accent" size="lg" icon="arrowR" onPress={start} disabled={loading}>
        {loading ? 'Préparation...' : 'Continuer vers le paiement'}
      </Button>
    }>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Recharger le portefeuille" />
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>Montant rapide</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          {TOPUP_PRESETS.map(p => {
            const active = parseInt(amount, 10) === p;
            return (
              <Pressable key={p} onPress={() => setAmount(String(p))} style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: active ? 2 : 1, borderColor: active ? LMX.brand : LMX.border, backgroundColor: active ? LMX.brandSoft : LMX.surface }}>
                <Text style={{ fontFamily: mono(600), fontSize: 13, color: active ? LMX.brand : LMX.ink }}>{fr(p)} GNF</Text>
              </Pressable>
            );
          })}
        </View>
        <Field label="Montant (GNF)" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="ex. 50000" />
        <View style={{ marginTop: 16, backgroundColor: LMX.surfaceAlt, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: LMX.hairline }}>
          <Icon name="shield" size={18} color={LMX.brand} />
          <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70, lineHeight: 17 }}>
            Le paiement est traité de façon sécurisée. Votre solde est crédité automatiquement dès la confirmation du paiement.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function PayMethodCard({ kind, name, masked, balance, primary }: any) {
  const props: any = ({
    orange: { bg: '#FF7900', code: 'OM' },
    mtn: { bg: '#FFCC00', code: 'MoMo', dark: true },
    visa: { bg: '#1A1F71', code: 'VISA' },
    cod: { bg: LMX.ink, code: 'COD' },
  } as any)[kind];
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: primary ? 2 : 1, borderColor: primary ? LMX.ink : LMX.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 42, height: 30, borderRadius: 6, backgroundColor: props.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: props.dark ? LMX.ink : '#fff', fontSize: 10, fontFamily: sans(700) }}>{props.code}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontFamily: sans(600) }}>{name}</Text>
        {masked && <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2, fontFamily: kind === 'cod' ? sans(400) : mono(400) }}>{masked}</Text>}
      </View>
      {balance && kind !== 'cod' && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 9.5, color: LMX.ink50, fontFamily: sans(600), textTransform: 'uppercase' }}>Balance</Text>
          <Text style={{ fontFamily: mono(600), fontSize: 11.5, marginTop: 1 }}>{balance}</Text>
        </View>
      )}
      <Icon name="chevR" size={14} color={LMX.ink50} />
    </View>
  );
}

export function ScreenPaymentMethods() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} title="Payment methods" right={<IconBtn icon="plus" />} />
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 4 }}>Default</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <PayMethodCard kind="orange" name="Orange Money" masked="•••• 5109" balance="240 000 GNF" primary />
      </View>
      <Text style={{ paddingHorizontal: 16, fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 4 }}>Other methods</Text>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <PayMethodCard kind="mtn" name="MTN MoMo" masked="•••• 7322" balance="167 250 GNF" />
        <PayMethodCard kind="visa" name="Visa · BCI Guinée" masked="•••• 4421" balance="Exp. 09/29" />
        <PayMethodCard kind="cod" name="Cash on delivery" masked="No fees · Inspect first" />
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: 1, borderColor: LMX.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: LMX.brandSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkle" size={17} color={LMX.brandDeep} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Auto-pay with Orange Money</Text>
            <Text style={{ fontSize: 11, color: LMX.ink50, marginTop: 2 }}>Skip the USSD code at checkout</Text>
          </View>
          <Toggle on />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: LMX.hairline }}>
          <Icon name="shield" size={18} color={LMX.brand} />
          <Text style={{ fontSize: 11.5, color: LMX.ink70, lineHeight: 17, flex: 1 }}>All transactions are encrypted. Loomodex never stores your full card or wallet PIN.</Text>
        </View>
      </View>
    </Screen>
  );
}
