import React, { useRef, useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { LMX, sans, mono } from '../theme';
import { Icon } from '../Icon';
import { Button } from '../components';
import { ordersApi } from '../api/orders';
import { driverApi, DeliveryOrder } from '../api/delivery';
import { friendlyError, isApiError } from '../api/client';
import { playErrorFeedback, playSuccessFeedback } from '../feedback';
import { notifyInputFocus } from '../hooks/useKeyboardScroll';
import { t } from '../i18n';

/** Statuses meaning the order is SAVED as delivered. */
const DELIVERED = ['otp-verified', 'completed'];

type Phase = 'idle' | 'checking' | 'success' | 'expired' | 'incorrect' | 'blocked' | 'unreachable' | 'error';

interface Attempts { attempts?: number; max?: number }

/**
 * Re-reads the order from the server after an unclear answer (network / timeout / server
 * error): the code may have been accepted even though the reply was lost.
 * Returns true only when the order is saved as delivered, null when it couldn't be checked.
 */
async function savedAsDelivered(orderId: number): Promise<boolean | null> {
  const [active, history] = await Promise.allSettled([driverApi.orders(), driverApi.orders('history')]);
  let reached = false;
  for (const r of [active, history]) {
    if (r.status !== 'fulfilled') continue;
    reached = true;
    const o = (r.value.orders ?? []).find(x => x.id === orderId);
    if (o && DELIVERED.includes(o.status)) return true;
  }
  return reached ? false : null;
}

/**
 * Driver enters the customer's delivery code. Every outcome is explicit: the driver only sees
 * "LIVRAISON CONFIRMÉE" once the server answered verified AND the order is saved as delivered.
 * Any failure shows a big red warning (with sound + vibration) that stays until "J'ai compris".
 */
export function DeliveryCodeVerify({ order, onDelivered }: { order: DeliveryOrder; onDelivered: () => void }) {
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [att, setAtt] = useState<Attempts>({});
  const [detail, setDetail] = useState('');
  const [hint, setHint] = useState('');
  const inFlight = useRef(false);

  const fail = (p: Phase, extra?: { att?: Attempts; detail?: string }) => {
    setAtt(extra?.att ?? {});
    setDetail(extra?.detail ?? '');
    setPhase(p);
    playErrorFeedback();
  };

  const submit = async () => {
    if (inFlight.current || phase === 'checking') return;
    const c = code.trim();
    if (c.length < 4) { setHint(t('Entrez le code à 4 chiffres communiqué par le client.')); return; }
    setHint('');
    inFlight.current = true;
    setPhase('checking');
    try {
      const res = await ordersApi.verifyOtp(order.id, c);
      if (res?.verified && DELIVERED.includes(res.order_status)) {
        setPhase('success');
        playSuccessFeedback();
        return;
      }
      // Answer without a saved delivered status: confirm against the saved order.
      const saved = await savedAsDelivered(order.id).catch(() => null);
      if (saved) { setPhase('success'); playSuccessFeedback(); return; }
      fail('error', { detail: res?.message ? t(res.message) : '' });
    } catch (e) {
      if (isApiError(e)) {
        const d = e.data ?? {};
        const attempts: Attempts = { attempts: Number(d.attempts) || undefined, max: Number(d.max_attempts) || undefined };
        if (e.code === 'otp_expired') { fail('expired'); return; }
        if (e.code === 'otp_incorrect') { fail('incorrect', { att: attempts }); return; }
        if (e.code === 'otp_blocked') { fail('blocked', { att: attempts }); return; }
        if (e.code === 'delivery_not_saved' || ['network', 'timeout', 'server', 'blocked'].includes(e.kind)) {
          // The reply was lost or the server failed — the delivery may still be saved.
          const saved = await savedAsDelivered(order.id).catch(() => null);
          if (saved) { setPhase('success'); playSuccessFeedback(); return; }
          fail('unreachable');
          return;
        }
        if (e.code === 'otp_not_pending') { fail('error', { detail: t("Cette commande n'attend pas de code de livraison. Actualisez la commande.") }); return; }
        if (e.code === 'otp_missing') { fail('error', { detail: t("Aucun code de livraison n'existe pour cette commande. Demandez au destinataire de demander un nouveau code.") }); return; }
        if (e.code === 'not_assigned') { fail('error', { detail: t("Cette commande ne vous est pas assignée.") }); return; }
        fail('error', { detail: friendlyError(e) });
        return;
      }
      const saved = await savedAsDelivered(order.id).catch(() => null);
      if (saved) { setPhase('success'); playSuccessFeedback(); return; }
      fail('unreachable');
    } finally {
      inFlight.current = false;
    }
  };

  // Acknowledging only closes the warning — it never changes the order.
  const acknowledge = () => {
    if (phase === 'incorrect' || phase === 'expired') setCode('');
    setPhase('idle');
    setAtt({});
    setDetail('');
  };

  if (phase === 'success') {
    return (
      <View style={{ backgroundColor: LMX.emeraldSoft, borderRadius: 14, padding: 16, gap: 10, borderWidth: 2, borderColor: LMX.emerald, alignItems: 'center' }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: LMX.emerald, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={28} color="#fff" />
        </View>
        <Text style={{ fontSize: 20, fontFamily: sans(800), color: '#047857', textAlign: 'center' }}>{t('LIVRAISON CONFIRMÉE')}</Text>
        <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center', lineHeight: 18 }}>
          {t('Le code est correct et la livraison est enregistrée. Vous pouvez remettre la commande.')}
        </Text>
        <Button full variant="primary" size="md" icon="check" onPress={onDelivered} style={{ backgroundColor: LMX.emerald }}>{t('Terminer')}</Button>
      </View>
    );
  }

  const warning = WARNINGS[phase as keyof typeof WARNINGS];
  if (warning) {
    const showAttempts = phase === 'incorrect' && att.attempts != null && att.max != null;
    return (
      <View accessibilityRole="alert" style={{ backgroundColor: '#FEE2E2', borderRadius: 14, padding: 16, gap: 10, borderWidth: 2, borderColor: LMX.rose }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: LMX.rose, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="alert" size={22} color="#fff" />
          </View>
          <Text style={{ flex: 1, fontSize: 17, lineHeight: 22, fontFamily: sans(800), color: '#B91C1C' }}>{t(warning.title)}</Text>
        </View>
        <Text style={{ fontSize: 14, lineHeight: 20, color: '#7F1D1D', fontFamily: sans(600) }}>{t(warning.body)}</Text>
        {!!detail && <Text style={{ fontSize: 12.5, lineHeight: 18, color: '#7F1D1D' }}>{detail}</Text>}
        {showAttempts && (
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: LMX.rose + '66' }}>
            <Text style={{ fontSize: 13, fontFamily: mono(700), color: '#B91C1C' }}>{t('Tentatives : {n}/{max}', { n: att.attempts!, max: att.max! })}</Text>
          </View>
        )}
        <Pressable onPress={acknowledge} accessibilityRole="button"
          style={{ height: 46, borderRadius: 12, backgroundColor: '#B91C1C', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14.5, fontFamily: sans(700), color: '#fff' }}>{t("J'ai compris")}</Text>
        </Pressable>
      </View>
    );
  }

  const checking = phase === 'checking';
  return (
    <View style={{ backgroundColor: LMX.surfaceAlt, borderRadius: 14, padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="key" size={15} color={LMX.brand} />
        <Text style={{ fontSize: 13.5, fontFamily: sans(700), color: LMX.ink }}>{t('Code de livraison')}</Text>
      </View>
      <Text style={{ fontSize: 12, color: LMX.ink50, lineHeight: 17 }}>{t('Demandez au client le code à 4 chiffres reçu par SMS.')}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: LMX.border, backgroundColor: checking ? LMX.surfaceAlt : LMX.surface, paddingHorizontal: 14, justifyContent: 'center' }}>
          <TextInput onFocus={notifyInputFocus} value={code} onChangeText={v => { setCode(v.replace(/[^0-9]/g, '')); if (hint) setHint(''); }}
            editable={!checking} keyboardType="number-pad" maxLength={6} placeholder="••••" placeholderTextColor={LMX.ink50}
            returnKeyType="done" onSubmitEditing={submit}
            style={{ fontFamily: mono(600), fontSize: 18, letterSpacing: 6, color: LMX.ink, padding: 0 }} />
        </View>
        <Button variant="accent" size="md" icon="check" onPress={submit} disabled={checking}>{t('Vérifier')}</Button>
      </View>
      {checking && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: LMX.brandSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}>
          <ActivityIndicator size="small" color={LMX.brand} />
          <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{t('Vérification du code en cours…')}</Text>
        </View>
      )}
      {!!hint && <Text style={{ fontSize: 12, color: LMX.rose, fontFamily: sans(600) }}>{hint}</Text>}
      {!checking && order.otp_attempts > 0 && <Text style={{ fontSize: 11, color: LMX.rose }}>{t('{n} tentative(s) utilisée(s)', { n: order.otp_attempts })}</Text>}
    </View>
  );
}

const WARNINGS = {
  expired: {
    title: 'CODE EXPIRÉ — LIVRAISON NON CONFIRMÉE',
    body: 'Ne remettez pas la commande. Demandez au destinataire de demander un nouveau code, puis réessayez.',
  },
  incorrect: {
    title: 'CODE INCORRECT — LIVRAISON NON CONFIRMÉE',
    body: 'Ne remettez pas la commande. Vérifiez le code saisi ou demandez au destinataire le bon code, puis réessayez.',
  },
  blocked: {
    title: 'CODE BLOQUÉ — LIVRAISON NON CONFIRMÉE',
    body: 'Nombre maximal de tentatives atteint. Ne remettez pas la commande. Contactez la logistique Loomodex pour débloquer la livraison.',
  },
  unreachable: {
    title: 'VÉRIFICATION IMPOSSIBLE — LIVRAISON NON CONFIRMÉE',
    body: "La livraison n'a pas pu être confirmée. Ne remettez pas la commande. Vérifiez votre connexion et réessayez.",
  },
  error: {
    title: 'CODE NON VÉRIFIÉ — LIVRAISON NON CONFIRMÉE',
    body: 'Ne remettez pas la commande. Réessayez ou contactez la logistique Loomodex.',
  },
} as const;
