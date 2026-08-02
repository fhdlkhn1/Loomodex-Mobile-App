import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LMX, FONT, sans } from '../theme';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn } from '../components';
import { configApi, AppConfig } from '../api/config';
import { useAuth } from '../context/AuthContext';

function ContactCard({ icon, title, sub, accent, onPress }: { icon: any; title: string; sub: string; accent?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: accent ? LMX.accent : LMX.surface, borderRadius: LMX.r.lg, padding: 16, borderWidth: accent ? 0 : 1, borderColor: LMX.border }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: accent ? 'rgba(255,255,255,0.18)' : LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={accent ? '#fff' : LMX.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: sans(700), color: accent ? '#fff' : LMX.ink }}>{title}</Text>
        <Text style={{ fontSize: 11.5, color: accent ? 'rgba(255,255,255,0.85)' : LMX.ink50, marginTop: 2 }}>{sub}</Text>
      </View>
      <Icon name="chevR" size={16} color={accent ? '#fff' : LMX.ink50} />
    </Pressable>
  );
}

export function ScreenHelp() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [cfg, setCfg] = useState<AppConfig | null>(null);

  useEffect(() => { configApi.get().then(setCfg).catch(() => {}); }, []);

  const support = cfg?.support;
  const firstName = user?.first_name || '';

  const openWhatsApp = () => {
    // Build a proper wa.me link (with a greeting) from the configured number — works whether
    // the setting is a plain number or a full URL.
    const digits = (support?.whatsapp || '').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent("Bonjour Loomodex, j'ai besoin d'aide.");
    const url = digits ? `https://wa.me/${digits}?text=${msg}` : 'https://wa.me/';
    Linking.openURL(url).catch(() => {});
  };
  const openEmail = () => {
    const email = support?.email || 'support@loomodex.com';
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('Support Loomodex')}`).catch(() => {});
  };
  const openUrl = (url?: string) => { if (url) Linking.openURL(url).catch(() => {}); };
  const openHelpCenter = () => openUrl(support?.help_url);

  const topics = [
    { icon: 'package',  label: 'Suivre ma commande',       onPress: () => nav.navigate('TrackEntry') },
    { icon: 'refresh',  label: 'Retours & remboursements',  onPress: () => openUrl(support?.returns_url) },
    { icon: 'truck',    label: 'Informations de livraison', onPress: () => openUrl(support?.delivery_url) },
    { icon: 'headset',  label: 'Nous contacter',            onPress: () => openUrl(support?.contact_url) },
  ];

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.canGoBack() ? nav.goBack() : nav.navigate('Main')} />} title="Aide & support" />

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 24, lineHeight: 28, color: LMX.ink }}>
          Comment pouvons-nous{firstName ? '\n' : ' '}<Text style={{ color: LMX.accent }}>vous aider{firstName ? `, ${firstName} ?` : ' ?'}</Text>
        </Text>
      </View>

      {/* Contact channels (match website: WhatsApp + Email) */}
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <ContactCard icon="phone" title="WhatsApp" sub="Réponse rapide · le plus rapide" accent onPress={openWhatsApp} />
        <ContactCard icon="receipt" title="Email" sub={support?.email || 'support@loomodex.com'} onPress={openEmail} />
      </View>

      {/* Quick topics */}
      <View style={{ paddingHorizontal: 16, paddingTop: 22 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, textTransform: 'uppercase', fontFamily: sans(600), marginBottom: 10 }}>Sujets fréquents</Text>
        <View style={{ backgroundColor: LMX.surface, borderRadius: LMX.r.lg, borderWidth: 1, borderColor: LMX.border, overflow: 'hidden' }}>
          {topics.map((t, i) => (
            <Pressable key={t.label} onPress={t.onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: i < topics.length - 1 ? 1 : 0, borderBottomColor: LMX.hairline }}>
              <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: LMX.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={t.icon as any} size={16} color={LMX.ink} /></View>
              <Text style={{ flex: 1, fontSize: 13.5, fontFamily: sans(500) }}>{t.label}</Text>
              <Icon name="chevR" size={14} color={LMX.ink50} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Full help center */}
      {!!support?.help_url && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Pressable onPress={openHelpCenter} style={{ backgroundColor: LMX.ink, borderRadius: LMX.r.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}><Icon name="headset" size={18} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontFamily: sans(600), color: '#fff' }}>Centre d'aide complet</Text>
              <Text style={{ fontSize: 11.5, color: '#fff', opacity: 0.65, marginTop: 2 }}>Articles, FAQ et politiques</Text>
            </View>
            <Icon name="arrowR" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
