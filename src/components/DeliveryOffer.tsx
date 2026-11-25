import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { LMX, sans, mono } from '../theme';
import { Icon } from '../Icon';
import { Button } from '../components';
import { Sheet, TextArea } from './StaffKit';
import { driverApi, DeliveryOrder } from '../api/delivery';
import { friendlyError } from '../api/client';
import { t } from '../i18n';

const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR').replace(/ /g, ' ')} GNF`;

/**
 * New delivery request for the driver ("awaiting response"): net earnings only, pickup store and
 * delivery area; Accept, or Refuse with a required reason (the order returns to logistics).
 */
export function DeliveryOfferCard({ order, onAnswered }: { order: DeliveryOrder; onAnswered: () => void }) {
  const [busy, setBusy] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState('');

  const answer = async (decision: 'accept' | 'refuse') => {
    if (decision === 'refuse' && !reason.trim()) { Alert.alert(t('Raison requise'), t('Indiquez la raison du refus.')); return; }
    setBusy(true);
    try { await driverApi.answerOffer(order.id, decision, reason.trim()); setRefusing(false); setReason(''); onAnswered(); }
    catch (e) { Alert.alert(t('Erreur'), friendlyError(e)); onAnswered(); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: LMX.navy, borderRadius: LMX.r.lg, padding: 16, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="bell" size={16} color={LMX.accent} />
        <Text style={{ flex: 1, fontSize: 14, fontFamily: sans(700), color: '#fff' }}>{t('Nouvelle demande de livraison')}</Text>
        <Text style={{ fontSize: 12, fontFamily: mono(600), color: '#fff', opacity: 0.7 }}>#{order.number}</Text>
      </View>
      {order.net_earnings != null && (
        <View>
          <Text style={{ fontSize: 10.5, color: '#fff', opacity: 0.65, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Vos gains nets')}</Text>
          <Text style={{ fontSize: 24, fontFamily: mono(700), color: LMX.emerald }}>{fmt(order.net_earnings)}</Text>
        </View>
      )}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12.5, color: '#fff' }}><Text style={{ opacity: 0.6 }}>{t('Retrait')} · </Text>{order.pickup?.store}{order.pickup?.neighborhood ? `, ${order.pickup.neighborhood}` : ''}</Text>
        <Text style={{ fontSize: 12.5, color: '#fff' }}><Text style={{ opacity: 0.6 }}>{t('Livraison')} · </Text>{[order.zone_label, order.neighborhood].filter(Boolean).join(', ')}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button full variant="accent" icon="check" disabled={busy} onPress={() => answer('accept')}>{t('Accepter')}</Button></View>
        <View style={{ flex: 1 }}><Button full variant="ghost" disabled={busy} onPress={() => setRefusing(true)} style={{ backgroundColor: '#fff' }}>{t('Refuser')}</Button></View>
      </View>
      <Sheet visible={refusing} title={t('Refuser la livraison')} subtitle={`#${order.number}`} onClose={() => setRefusing(false)}
        footer={<Button variant="accent" full disabled={busy} onPress={() => answer('refuse')}>{busy ? t('Envoi…') : t('Confirmer le refus')}</Button>}>
        <TextArea label={t('Raison du refus *')} value={reason} onChangeText={setReason} lines={3} placeholder={t('Ex. : trop loin, véhicule en panne…')} />
      </Sheet>
    </View>
  );
}
