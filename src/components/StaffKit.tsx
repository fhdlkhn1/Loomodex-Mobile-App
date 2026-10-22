import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LMX, sans, mono } from '../theme';
import { Icon, IconName } from '../Icon';
import type { LogisticsDriver, AuditEntry } from '../api/delivery';
import { DRIVER_STATE_COLOR, driverMapState, hasPosition } from './DriversMap';
import { t } from '../i18n';
import { KEYBOARD_BEHAVIOR, useKeyboardScroll, notifyInputFocus } from '../hooks/useKeyboardScroll';

/** "il y a 5 min" from a unix timestamp (seconds). */
export function agoFr(unix: number | null | undefined): string {
  if (!unix) return t('jamais');
  const m = Math.max(0, Math.round((Date.now() / 1000 - unix) / 60));
  if (m < 1) return t("à l'instant");
  if (m < 60) return t('il y a {n} min', { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t('il y a {n} h', { n: h });
  return t('il y a {n} j', { n: Math.round(h / 24) });
}

/** Local date as Y-m-d. */
export function todayYmd(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Bottom sheet with a title, scrollable body and optional footer (keyboard-aware). */
export function Sheet({ visible, title, subtitle, onClose, children, footer }: {
  visible: boolean; title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardScroll();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
        <View style={{ flex: 1, backgroundColor: 'rgba(11,31,58,0.38)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View style={{ maxHeight: '85%', backgroundColor: LMX.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 18, paddingBottom: insets.bottom + 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 18 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: sans(700), color: LMX.ink }}>{title}</Text>
                {!!subtitle && <Text style={{ fontSize: 12, color: LMX.ink50, marginTop: 3, lineHeight: 17 }}>{subtitle}</Text>}
              </View>
              <Pressable onPress={onClose} hitSlop={10}><Icon name="close" size={18} color={LMX.ink50} /></Pressable>
            </View>
            <ScrollView ref={kb.ref} onScroll={kb.onScroll} scrollEventThrottle={32} style={{ marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 8, paddingBottom: 6 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {!!footer && <View style={{ paddingHorizontal: 18, paddingTop: 10 }}>{footer}</View>}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Multi-line labelled text input. */
export function TextArea({ label, value, onChangeText, placeholder, keyboardType, lines = 3 }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: any; lines?: number;
}) {
  const multi = lines > 1;
  return (
    <View>
      <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={LMX.ink50}
        keyboardType={keyboardType} multiline={multi} numberOfLines={lines} onFocus={notifyInputFocus}
        style={{
          minHeight: multi ? 22 * lines + 20 : 48, textAlignVertical: multi ? 'top' : 'center',
          backgroundColor: LMX.bg, borderWidth: 1, borderColor: LMX.border, borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: LMX.ink, fontFamily: sans(400),
        }}
      />
    </View>
  );
}

/** Small rounded status pill. */
export function Pill({ label, color, icon }: { label: string; color: string; icon?: IconName }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: color + '1A' }}>
      {icon ? <Icon name={icon} size={11} color={color} /> : <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />}
      <Text style={{ fontSize: 10, fontFamily: sans(700), color, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

/** Statuses in which the store can still mark the parcel packed (confirmed, not yet picked up). */
const PACKABLE_STATUSES = ['ready-dispatch', 'packed', 'assigned-driver'];

/** Store's "packed / ready for pickup" mark on staff order cards (nothing once picked up). */
export function PackedPill({ packedAt, status }: { packedAt?: string | null; status?: string }) {
  if (!status || !PACKABLE_STATUSES.includes(status)) return null;
  return packedAt
    ? <Pill label={t('Emballée')} color={LMX.emerald} icon="check" />
    : <Pill label={t('Pas encore emballée')} color={LMX.ink50} />;
}

/** Warning while the store has not packed the parcel yet (assignment is allowed, the driver should wait). */
export function NotPackedNote({ packedAt, status, audience = 'staff' }: { packedAt?: string | null; status?: string; audience?: 'staff' | 'driver' }) {
  if (packedAt || !status || !PACKABLE_STATUSES.includes(status)) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: LMX.accentSoft, borderRadius: 10, borderWidth: 1, borderColor: LMX.accent + '40', padding: 10 }}>
      <Icon name="package" size={14} color={LMX.accent} />
      <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70, lineHeight: 16, fontFamily: sans(500) }}>
        {audience === 'driver'
          ? t("Attendez : le magasin n'a pas encore emballé le colis. Vous serez prévenu dès qu'il sera prêt.")
          : t("Colis pas encore emballé par le magasin — le livreur sera prévenu dès qu'il sera prêt.")}
      </Text>
    </View>
  );
}

/** Inline error banner with a Réessayer link. */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ backgroundColor: '#FFF0F0', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: LMX.rose + '33' }}>
      <Icon name="refresh" size={14} color={LMX.rose} />
      <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70 }}>{message}</Text>
      <Pressable onPress={onRetry}><Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>{t('Réessayer')}</Text></Pressable>
    </View>
  );
}

/** One label / amount row of a money breakdown. */
export function AmountRow({ label, amount, bold, color }: { label: string; amount: number; bold?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 3 }}>
      <Text style={{ flex: 1, fontSize: bold ? 13 : 12, fontFamily: bold ? sans(700) : sans(400), color: LMX.ink70 }}>{label}</Text>
      <Text style={{ fontSize: bold ? 14 : 12.5, fontFamily: mono(bold ? 700 : 500), color: color ?? LMX.ink }}>{Math.round(amount).toLocaleString('fr-FR').replace(/[  ,]/g, ' ')} GNF</Text>
    </View>
  );
}

/**
 * Driver chooser: available drivers first, unavailable ones greyed out and disabled,
 * with GPS age and current workload.
 */
export function DriverPickerSheet({ visible, title, subtitle, drivers, loading, error, busy, currentId, onRetry, onPick, onClose }: {
  visible: boolean; title: string; subtitle?: string; drivers: LogisticsDriver[]; loading?: boolean; error?: string | null;
  busy?: boolean; currentId?: number | null; onRetry?: () => void; onPick: (id: number) => void; onClose: () => void;
}) {
  const sorted = [...drivers].sort((a, b) => Number(b.available !== false) - Number(a.available !== false) || a.name.localeCompare(b.name));
  return (
    <Sheet visible={visible} title={title} subtitle={subtitle} onClose={onClose}>
      {!!error && onRetry && <ErrorBanner message={error} onRetry={onRetry} />}
      {loading ? (
        <View style={{ paddingVertical: 24 }}><ActivityIndicator color={LMX.brand} /></View>
      ) : sorted.length === 0 && !error ? (
        <Text style={{ fontSize: 12.5, color: LMX.ink50, textAlign: 'center', paddingVertical: 16 }}>{t('Aucun livreur disponible.')}</Text>
      ) : sorted.map(d => {
        const avail = d.available !== false;
        const current = currentId != null && d.id === currentId;
        return (
          <Pressable key={d.id} onPress={() => onPick(d.id)} disabled={busy || !avail || current}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: current ? LMX.brandSoft : LMX.surfaceAlt, opacity: avail ? (busy ? 0.6 : 1) : 0.5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: DRIVER_STATE_COLOR[driverMapState(d)] }} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: sans(600), color: LMX.ink }}>{d.name}{current ? ` · ${t('actuel')}` : ''}</Text>
              <Text numberOfLines={1} style={{ fontSize: 10.5, color: LMX.ink50, marginTop: 2 }}>
                {hasPosition(d) ? t('GPS {ago}', { ago: agoFr(d.loc_at) }) : t('Position inconnue')} · {d.active_count !== 1 ? t('{n} actives', { n: d.active_count }) : t('{n} active', { n: d.active_count })}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: avail ? LMX.emeraldSoft : LMX.ink10 }}>
              <Text style={{ fontSize: 9.5, fontFamily: sans(700), color: avail ? LMX.emerald : LMX.ink50, textTransform: 'uppercase' }}>{avail ? t('Disponible') : t('Indisponible')}</Text>
            </View>
          </Pressable>
        );
      })}
    </Sheet>
  );
}

/** "22/10/2026 14:05" from a MySQL datetime ("2026-10-22 14:05:33") — shown as stored (site time). */
export function fmtDateTime(mysql?: string | null): string {
  const m = /^(d{4})-(d{2})-(d{2})[ T](d{2}):(d{2})/.exec(mysql || '');
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : (mysql || '');
}

/** "Confirmée par {nom} · {date}" — customer service confirmation, staff screens only. */
export function CsConfirmedLine({ by, at }: { by?: string | null; at?: string | null }) {
  if (!by) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name="checkCircle" size={13} color={LMX.emerald} />
      <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70, fontFamily: sans(500) }}>
        {at ? t('Confirmée par {nom} · {date}', { nom: by, date: fmtDateTime(at) }) : t('Confirmée par {nom}', { nom: by })}
      </Text>
    </View>
  );
}

const AUDIT_ACTION: Record<string, string> = {
  cs_confirm: 'Commande confirmée (service client)',
  cs_reject: 'Commande rejetée (service client)',
  fee_confirm: 'Frais de livraison confirmés',
  fee_adjust: 'Frais de livraison ajustés',
  partner_assign: 'Attribuée à un partenaire',
  partner_transfer: 'Transférée à un autre partenaire',
  driver_assign: 'Livreur assigné',
  otp_override: 'Livraison forcée sans code',
  status_override: 'Statut modifié manuellement',
  pickup_verified: 'Retrait vérifié au magasin',
};

const AUDIT_ROLE: Record<string, string> = {
  administrator: 'Administrateur',
  logistics_manager: 'Logistique',
  customer_support: 'Service client',
  shop_manager: 'Gestionnaire',
  driver: 'Livreur',
  partner_manager: 'Partenaire',
  wcfm_vendor: 'Vendeur',
  seller: 'Vendeur',
  system: 'Système',
};

/**
 * "Historique des actions" — permanent, read-only order history for Loomodex staff
 * (date/time, who, action, previous → new status, reason). Collapsed by default.
 */
export function AuditHistory({ log, statusLabel }: { log?: AuditEntry[] | null; statusLabel?: (s: string) => string }) {
  const [open, setOpen] = useState(false);
  if (!log || log.length === 0) return null;
  const label = (s: string | null) => (s ? (statusLabel ? statusLabel(s) : s) : '—');
  const entries = [...log].reverse();
  return (
    <View style={{ borderWidth: 1, borderColor: LMX.hairline, borderRadius: 12, overflow: 'hidden' }}>
      <Pressable onPress={() => setOpen(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: LMX.surfaceAlt }}>
        <Icon name="receipt" size={14} color={LMX.ink70} />
        <Text style={{ flex: 1, fontSize: 12.5, fontFamily: sans(700), color: LMX.ink }}>{t('Historique des actions')} ({log.length})</Text>
        <Icon name={open ? 'chevU' : 'chevD'} size={14} color={LMX.ink50} />
      </Pressable>
      {open && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
          {entries.map((e, i) => (
            <View key={i} style={{ paddingVertical: 8, gap: 2, borderTopWidth: i ? 1 : 0, borderTopColor: LMX.hairline }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 11, fontFamily: mono(600), color: LMX.ink50 }}>{fmtDateTime(e.at)}</Text>
                <Text numberOfLines={1} style={{ flex: 1, fontSize: 11.5, fontFamily: sans(600), color: LMX.ink70, textAlign: 'right' }}>
                  {e.user_name || t('Système')}{e.role ? ` · ${t(AUDIT_ROLE[e.role] ?? e.role)}` : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 12.5, fontFamily: sans(700), color: LMX.ink }}>{t(AUDIT_ACTION[e.action] ?? e.action)}</Text>
              {(!!e.from || !!e.to) && (
                <Text style={{ fontSize: 11.5, color: LMX.ink70 }}>{label(e.from)} → {label(e.to)}</Text>
              )}
              {!!e.reason && <Text style={{ fontSize: 11.5, color: LMX.ink70, fontStyle: 'italic' }}>{t('Motif : {r}', { r: e.reason })}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** Bottom sheet asking for a mandatory reason (min 5 characters) before a forced action. */
export function ReasonSheet({ visible, title, subtitle, confirmLabel, busy, onConfirm, onClose }: {
  visible: boolean; title: string; subtitle?: string; confirmLabel: string; busy?: boolean;
  onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const ok = reason.trim().length >= 5;
  const close = () => { setReason(''); onClose(); };
  return (
    <Sheet visible={visible} title={title} subtitle={subtitle} onClose={close}
      footer={
        <Pressable onPress={() => { if (ok && !busy) onConfirm(reason.trim()); }} disabled={!ok || busy}
          style={{ height: 48, borderRadius: 12, backgroundColor: LMX.rose, alignItems: 'center', justifyContent: 'center', opacity: ok && !busy ? 1 : 0.45 }}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 14, fontFamily: sans(700), color: '#fff' }}>{confirmLabel}</Text>}
        </Pressable>
      }>
      <TextArea label={t('Motif (obligatoire)')} value={reason} onChangeText={setReason} placeholder={t('Expliquez pourquoi…')} lines={3} />
      <Text style={{ fontSize: 11.5, color: ok ? LMX.ink50 : LMX.rose }}>
        {t("Au moins 5 caractères. Le motif est conservé dans l'historique des actions.")}
      </Text>
    </Sheet>
  );
}

/** Customer contact is hidden from drivers / partners until the store verified the pickup. */
export function ContactLockNote() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: LMX.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: LMX.hairline }}>
      <Icon name="key" size={13} color={LMX.ink50} />
      <Text style={{ flex: 1, fontSize: 11.5, color: LMX.ink70, fontFamily: sans(500), lineHeight: 16 }}>
        {t('Coordonnées du client visibles après la vérification du retrait au magasin')}
      </Text>
    </View>
  );
}
