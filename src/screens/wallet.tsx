import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LMX, FONT, sans, mono, fr } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Toggle } from '../components';
import { get } from '../api/client';
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
  const positive = tx.amt > 0;
  const iconMap: any = { refund: 'refresh', topup: 'arrowU', cashback: 'sparkle', spend: 'bag' };
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: LMX.hairline }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: positive ? LMX.emeraldSoft : LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={iconMap[tx.kind]} size={15} color={positive ? LMX.emerald : LMX.ink70} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12.5, fontFamily: sans(600) }}>{tx.label}</Text>
        <Text style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2 }}>{tx.sub} · {tx.date}</Text>
      </View>
      <Text style={{ fontFamily: mono(600), fontSize: 13, color: positive ? LMX.emerald : LMX.ink }}>{positive ? '+' : '−'}{fr(Math.abs(tx.amt))}<Text style={{ fontSize: 9, color: LMX.ink50 }}> GNF</Text></Text>
    </View>
  );
}

export function ScreenWallet() {
  const nav = useNavigation<any>();
  const { user, isLoggedIn } = useAuth();
  const [walletData, setWallet] = useState<{ balance: number; transactions: any[] } | null>(null);
  const [loading, setLoad]      = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { setLoad(false); return; }
    (async () => {
      try {
        const data = await get<{ balance: number; currency: string; transactions: any[] }>('/profile/wallet', true);
        setWallet({ balance: data.balance, transactions: data.transactions ?? [] });
      } catch {}
      finally { setLoad(false); }
    })();
  }, [isLoggedIn]);

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
      <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', gap: 8 }}>
        <WalletAction icon="plus" label="Recharger" highlight />
        <WalletAction icon="arrowR" label="Envoyer" />
        <WalletAction icon="qr" label="QR Pay" />
        <WalletAction icon="download" label="Retirer" />
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Portefeuilles liés</Text>
          <Text style={{ fontSize: 12, color: LMX.ink70 }}>Gérer</Text>
        </View>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          <LinkedWallet name="Orange Money" bg="#FF7900" code="OM" balance="+224 ••• •••" primary />
          <LinkedWallet name="MTN MoMo" bg="#FFCC00" code="MoMo" balance="+224 ••• •••" dark last />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontFamily: sans(600) }}>Activité récente</Text>
          <Text style={{ fontSize: 12, color: LMX.ink70 }}>Tout voir</Text>
        </View>
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
