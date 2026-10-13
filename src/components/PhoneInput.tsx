import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LMX, sans, mono } from '../theme';
import { Icon } from '../Icon';
import { t } from '../i18n';

export interface Country { iso: string; name: string; dial: string }

/** "Autre" — any other country: the user types the dial code. */
const OTHER: Country = { iso: 'XX', name: 'Autre pays', dial: '' };

export const COUNTRIES: Country[] = [
  { iso: 'GN', name: 'Guinée', dial: '224' },
  // Afrique de l'Ouest
  { iso: 'SN', name: 'Sénégal', dial: '221' },
  { iso: 'ML', name: 'Mali', dial: '223' },
  { iso: 'CI', name: "Côte d'Ivoire", dial: '225' },
  { iso: 'SL', name: 'Sierra Leone', dial: '232' },
  { iso: 'LR', name: 'Liberia', dial: '231' },
  { iso: 'GW', name: 'Guinée-Bissau', dial: '245' },
  { iso: 'GM', name: 'Gambie', dial: '220' },
  { iso: 'MR', name: 'Mauritanie', dial: '222' },
  { iso: 'BF', name: 'Burkina Faso', dial: '226' },
  { iso: 'NE', name: 'Niger', dial: '227' },
  { iso: 'TG', name: 'Togo', dial: '228' },
  { iso: 'BJ', name: 'Bénin', dial: '229' },
  { iso: 'GH', name: 'Ghana', dial: '233' },
  { iso: 'NG', name: 'Nigeria', dial: '234' },
  { iso: 'CV', name: 'Cap-Vert', dial: '238' },
  // Afrique centrale
  { iso: 'CM', name: 'Cameroun', dial: '237' },
  { iso: 'TD', name: 'Tchad', dial: '235' },
  { iso: 'CF', name: 'Centrafrique', dial: '236' },
  { iso: 'GA', name: 'Gabon', dial: '241' },
  { iso: 'CG', name: 'Congo', dial: '242' },
  { iso: 'CD', name: 'RD Congo', dial: '243' },
  { iso: 'GQ', name: 'Guinée équatoriale', dial: '240' },
  { iso: 'ST', name: 'São Tomé-et-Principe', dial: '239' },
  // Maghreb
  { iso: 'MA', name: 'Maroc', dial: '212' },
  { iso: 'DZ', name: 'Algérie', dial: '213' },
  { iso: 'TN', name: 'Tunisie', dial: '216' },
  { iso: 'LY', name: 'Libye', dial: '218' },
  { iso: 'EG', name: 'Égypte', dial: '20' },
  // Europe
  { iso: 'FR', name: 'France', dial: '33' },
  { iso: 'BE', name: 'Belgique', dial: '32' },
  { iso: 'CH', name: 'Suisse', dial: '41' },
  { iso: 'DE', name: 'Allemagne', dial: '49' },
  { iso: 'ES', name: 'Espagne', dial: '34' },
  { iso: 'IT', name: 'Italie', dial: '39' },
  { iso: 'PT', name: 'Portugal', dial: '351' },
  { iso: 'NL', name: 'Pays-Bas', dial: '31' },
  { iso: 'GB', name: 'Royaume-Uni', dial: '44' },
  { iso: 'IE', name: 'Irlande', dial: '353' },
  // Amériques & Asie
  { iso: 'US', name: 'États-Unis', dial: '1' },
  { iso: 'CA', name: 'Canada', dial: '1' },
  { iso: 'BR', name: 'Brésil', dial: '55' },
  { iso: 'CN', name: 'Chine', dial: '86' },
  { iso: 'IN', name: 'Inde', dial: '91' },
  { iso: 'TR', name: 'Turquie', dial: '90' },
  { iso: 'AE', name: 'Émirats arabes unis', dial: '971' },
  { iso: 'SA', name: 'Arabie saoudite', dial: '966' },
  { iso: 'QA', name: 'Qatar', dial: '974' },
];

const DEFAULT_COUNTRY = COUNTRIES[0];

export function flagEmoji(iso: string): string {
  if (iso.length !== 2 || iso === 'XX') return '🌍';
  return String.fromCodePoint(...iso.toUpperCase().split('').map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

const digitsOnly = (s: string) => (s || '').replace(/\D/g, '');

/**
 * Split a stored number into country + local digits.
 * "+33612…" / "0033612…" → split by the longest known dial code; anything else is
 * treated as a Guinean number (legacy values were saved without the +224).
 */
export function parsePhone(raw: string | null | undefined): { country: Country; local: string; customDial: string } {
  const s = (raw || '').trim();
  if (!s) return { country: DEFAULT_COUNTRY, local: '', customDial: '' };
  const intl = s.startsWith('+') || s.startsWith('00');
  let d = digitsOnly(s);
  if (s.startsWith('00')) d = d.slice(2);
  if (intl) {
    const match = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find(c => d.startsWith(c.dial));
    if (match) return { country: match, local: d.slice(match.dial.length), customDial: '' };
    return { country: OTHER, local: d, customDial: '' };
  }
  if (d.startsWith('224') && d.length >= 12) d = d.slice(3);
  return { country: DEFAULT_COUNTRY, local: d.replace(/^0+/, ''), customDial: '' };
}

/** E.164-style "+<code><digits>" ('' when no number was typed). */
export function formatE164(country: Country, local: string, customDial = ''): string {
  const n = digitsOnly(local).replace(/^0+/, '');
  if (!n) return '';
  const code = country.iso === 'XX' ? digitsOnly(customDial) : country.dial;
  return `+${code}${n}`;
}

/** Normalise any stored phone to "+<code><digits>" (legacy local numbers → +224). */
export function toE164(raw: string | null | undefined): string {
  const p = parsePhone(raw);
  return formatE164(p.country, p.local, p.customDial);
}

/**
 * International phone field: country selector (flag + dial code, searchable) and the
 * local number. `value` / `onChange` use the full "+<code><digits>" form.
 */
export function PhoneInput({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
}) {
  const [initial] = useState(() => parsePhone(value));
  const [country, setCountry] = useState<Country>(initial.country);
  const [local, setLocal] = useState(initial.local);
  const [customDial, setCustomDial] = useState(initial.customDial);
  const [picker, setPicker] = useState(false);
  const lastEmitted = useRef(formatE164(initial.country, initial.local, initial.customDial));

  // Re-sync when the parent sets a new value (e.g. prefill from the profile)
  useEffect(() => {
    if ((value || '') === lastEmitted.current) return;
    const p = parsePhone(value);
    setCountry(p.country); setLocal(p.local); setCustomDial(p.customDial);
    lastEmitted.current = formatE164(p.country, p.local, p.customDial);
  }, [value]);

  const emit = (c: Country, l: string, cd: string) => {
    const v = formatE164(c, l, cd);
    lastEmitted.current = v;
    onChange(v);
  };

  const isOther = country.iso === 'XX';

  return (
    <View>
      <Text style={{ fontSize: 12, color: LMX.ink70, fontFamily: sans(500), marginBottom: 8 }}>{label}</Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface,
        borderWidth: 1, borderColor: LMX.border, borderRadius: 14, paddingLeft: 12, paddingRight: 16, height: 54,
      }}>
        <Pressable onPress={() => setPicker(true)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={{ fontSize: 18 }}>{flagEmoji(country.iso)}</Text>
          {!isOther && <Text style={{ fontFamily: mono(500), fontSize: 14, color: LMX.ink70 }}>+{country.dial}</Text>}
          <Icon name="chevD" size={13} color={LMX.ink50} />
        </Pressable>
        {isOther && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontFamily: mono(500), fontSize: 14, color: LMX.ink70 }}>+</Text>
            <TextInput
              value={customDial}
              onChangeText={t => { const cd = digitsOnly(t).slice(0, 4); setCustomDial(cd); emit(country, local, cd); }}
              keyboardType="number-pad"
              placeholder={t('code')}
              placeholderTextColor={LMX.ink30}
              style={{ width: 46, fontFamily: mono(500), fontSize: 14, color: LMX.ink, padding: 0 }}
            />
          </View>
        )}
        <View style={{ width: 1, height: 22, backgroundColor: LMX.hairline }} />
        <TextInput
          value={local}
          onChangeText={t => { const l = t.replace(/[^\d\s]/g, ''); setLocal(l); emit(country, l, customDial); }}
          keyboardType="phone-pad"
          placeholder={placeholder ?? t('Numéro de téléphone')}
          placeholderTextColor={LMX.ink50}
          style={{ flex: 1, fontFamily: sans(400), fontSize: 15, color: LMX.ink, padding: 0 }}
        />
      </View>
      <CountryPicker
        visible={picker}
        selected={country}
        onClose={() => setPicker(false)}
        onSelect={c => { setCountry(c); setPicker(false); emit(c, local, customDial); }}
      />
    </View>
  );
}

function CountryPicker({ visible, selected, onClose, onSelect }: {
  visible: boolean; selected: Country; onClose: () => void; onSelect: (c: Country) => void;
}) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  useEffect(() => { if (!visible) setQ(''); }, [visible]);

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = useMemo(() => {
    const all = [...COUNTRIES, OTHER];
    const qn = norm(q.trim()).replace(/^\+/, '');
    if (!qn) return all;
    return all.filter(c => norm(c.name).includes(qn) || norm(t(c.name)).includes(qn) || (c.dial && c.dial.startsWith(qn)) || c.iso.toLowerCase() === qn);
  }, [q]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(11,31,58,0.38)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ height: '78%', backgroundColor: LMX.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: insets.bottom }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }}>
            <Text style={{ fontSize: 16, fontFamily: sans(700), color: LMX.ink }}>{t('Choisir le pays')}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={16} color={LMX.ink} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: LMX.surface, borderRadius: 999, borderWidth: 1, borderColor: LMX.border, paddingHorizontal: 14, height: 44 }}>
              <Icon name="search" size={16} color={LMX.ink50} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder={t('Rechercher un pays ou un indicatif')}
                placeholderTextColor={LMX.ink50}
                autoCorrect={false}
                style={{ flex: 1, fontSize: 14, fontFamily: sans(400), color: LMX.ink, padding: 0 }}
              />
            </View>
          </View>
          <FlatList
            data={list}
            keyExtractor={c => c.iso}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: c }) => {
              const active = c.iso === selected.iso;
              return (
                <Pressable onPress={() => onSelect(c)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: LMX.hairline, backgroundColor: active ? LMX.brandSoft : 'transparent' }}>
                  <Text style={{ fontSize: 20 }}>{flagEmoji(c.iso)}</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontFamily: sans(active ? 600 : 500), color: LMX.ink }}>{t(c.name)}</Text>
                  <Text style={{ fontSize: 13, fontFamily: mono(500), color: LMX.ink50 }}>{c.dial ? `+${c.dial}` : '+…'}</Text>
                  {active && <Icon name="check" size={15} color={LMX.brand} />}
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: LMX.ink50, fontSize: 13, paddingTop: 24 }}>{t('Aucun pays trouvé — choisissez « Autre pays ».')}</Text>}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
