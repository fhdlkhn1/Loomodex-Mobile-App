import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { LMX, sans, mono, fr } from '../theme';
import { Icon } from '../Icon';
import { t } from '../i18n';
import type { DeliveryQuote } from '../api/checkout';

const LINE_LABELS: Record<string, string> = {
  base: 'Frais de base',
  distance: 'Distance supplémentaire',
  access: "Supplément d'accès",
  express: 'Livraison express',
  bulky: 'Colis volumineux',
  multi_store: 'Magasin supplémentaire',
  zone: 'Livraison (zone)',
};

/**
 * Quote lines are labelled in the app's language from their key; the numeric detail the
 * server puts in brackets (e.g. "(5 km × 2,000)") is kept as is.
 */
export function quoteLineLabel(l: { key: string; label: string }): string {
  const base = LINE_LABELS[l.key];
  if (!base) return t(l.label);
  const detail = /\(([^)]*\d[^)]*)\)/.exec(l.label);
  return detail ? `${t(base)} (${detail[1]})` : t(base);
}

export type QuoteSummary = Pick<DeliveryQuote, 'lines' | 'total' | 'distance_km'> & Partial<Pick<DeliveryQuote, 'mode' | 'needs_review'>>;

/** Delivery-fee breakdown card (server lines + total), with loading / error states. */
export function FeeBreakdown({
  quote, loading, error, onRetry, title, showReviewNotice = true,
}: {
  quote: QuoteSummary | null | undefined;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  showReviewNotice?: boolean;
}) {
  const showDistance = !!quote && quote.distance_km > 0 && (quote.mode === undefined || quote.mode === 'distance');
  return (
    <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name="truck" size={15} color={LMX.brand} />
        <Text style={{ flex: 1, fontSize: 13, fontFamily: sans(700), color: LMX.ink }}>{title ?? t('Frais de livraison')}</Text>
        {showDistance && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: LMX.brandSoft }}>
            <Text style={{ fontSize: 11, fontFamily: mono(600), color: LMX.brand }}>{t('{n} km', { n: Math.round(quote!.distance_km * 10) / 10 })}</Text>
          </View>
        )}
        {loading && !!quote && <ActivityIndicator size="small" color={LMX.brand} />}
      </View>

      {loading && !quote ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
          <ActivityIndicator size="small" color={LMX.brand} />
          <Text style={{ fontSize: 12.5, color: LMX.ink50 }}>{t('Calcul des frais de livraison…')}</Text>
        </View>
      ) : error && !quote ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12.5, color: LMX.rose, lineHeight: 17 }}>{error}</Text>
          {onRetry && (
            <Pressable onPress={onRetry} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: LMX.brand }}>
              <Icon name="refresh" size={13} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontFamily: sans(600) }}>{t('Réessayer')}</Text>
            </Pressable>
          )}
        </View>
      ) : quote ? (
        <View style={{ opacity: loading ? 0.6 : 1 }}>
          {quote.lines.map((l, i) => (
            <View key={`${l.key}-${i}`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingVertical: 4 }}>
              <Text style={{ flex: 1, fontSize: 12.5, color: LMX.ink70 }}>{quoteLineLabel(l)}</Text>
              <Text style={{ fontFamily: mono(600), fontSize: 12.5, color: LMX.ink }}>
                {fr(l.amount)}<Text style={{ fontSize: 9, color: LMX.ink50 }}> GNF</Text>
              </Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: LMX.hairline, marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{t('Total livraison')}</Text>
            <Text style={{ fontFamily: mono(700), fontSize: 14, color: LMX.ink }}>
              {fr(quote.total)}<Text style={{ fontSize: 9.5, color: LMX.ink50 }}> GNF</Text>
            </Text>
          </View>
          {showReviewNotice && quote.needs_review && (
            <Notice text={t("Les frais de livraison seront confirmés par le service client avant l'expédition.")} />
          )}
        </View>
      ) : (
        <Text style={{ fontSize: 12.5, color: LMX.ink50 }}>{t('Choisissez votre adresse pour calculer les frais.')}</Text>
      )}
    </View>
  );
}

/** Small amber info box. */
export function Notice({ text, tone = 'amber' }: { text: string; tone?: 'amber' | 'brand' }) {
  const color = tone === 'amber' ? LMX.amber : LMX.brand;
  return (
    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, backgroundColor: color + '18', borderWidth: 1, borderColor: color + '44' }}>
      <Icon name="shield" size={14} color={color} />
      <Text style={{ flex: 1, fontSize: 12, color: LMX.ink70, lineHeight: 17 }}>{text}</Text>
    </View>
  );
}
