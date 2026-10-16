import React, { useState } from 'react';
import { View, Text, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LMX, FONT, sans, mono, shadow } from '../theme';
import { IMG } from '../data';
import { Icon } from '../Icon';
import { Screen, AppBar, IconBtn, Button, Field, Wordmark, LangToggle } from '../components';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { friendlyError } from '../api/client';
import { PhoneInput } from '../components/PhoneInput';
import { staffHomeRoute } from '../roles';
import { t } from '../i18n';

// ── Helpers ───────────────────────────────────────────────────────
function Dot({ active }: { active?: boolean }) {
  return <View style={{ width: active ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: active ? LMX.brand : LMX.ink30 }} />;
}

function Requirement({ label, met }: { label: string; met?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: met ? LMX.emerald : 'transparent', borderWidth: met ? 0 : 1.5, borderColor: LMX.ink30, alignItems: 'center', justifyContent: 'center' }}>
        {met && <Icon name="check" size={10} color="#fff" />}
      </View>
      <Text style={{ fontSize: 12, color: met ? LMX.emerald : LMX.ink50 }}>{label}</Text>
    </View>
  );
}

// ── Onboarding ────────────────────────────────────────────────────
export function ScreenOnboarding() {
  const nav = useNavigation<any>();
  return (
    <Screen padTop>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LangToggle />
          <Pressable onPress={() => nav.navigate('Main')}>
            <Text style={{ color: LMX.ink70, fontSize: 13, fontFamily: sans(500) }}>{t('Passer')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 30 }}>
        <View style={{ height: 340 }}>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 170, height: 210, borderRadius: 28, overflow: 'hidden', transform: [{ rotate: '-4deg' }], ...shadow('lg') }}>
            <Image source={{ uri: IMG('womens-genuine-leather-handbag') }} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ position: 'absolute', top: 40, right: 0, width: 145, height: 185, borderRadius: 24, overflow: 'hidden', transform: [{ rotate: '5deg' }], ...shadow('md') }}>
            <Image source={{ uri: IMG('wireless-bluetooth-headphones-pro') }} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 50, width: 190, height: 170, borderRadius: 26, overflow: 'hidden', transform: [{ rotate: '-2deg' }], ...shadow('md') }}>
            <Image source={{ uri: IMG('premium-perfume-gift-set') }} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={{ position: 'absolute', top: 120, right: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: LMX.surface, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadow('md') }}>
            <Icon name="truck" size={12} color={LMX.emerald} />
            <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: LMX.ink }}>{t('3h–48h Conakry')}</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 100, right: 10, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: LMX.brand, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, ...shadow('md') }}>
            <Icon name="shield" size={12} color="#fff" />
            <Text style={{ fontSize: 11.5, fontFamily: sans(600), color: '#fff' }}>{t('Paiement à livraison')}</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 28, paddingTop: 16 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 38, lineHeight: 42, color: LMX.ink }}>
          {t('Le marché de la Guinée,')}{' '}
          <Text style={{ fontFamily: FONT.displayItalic, color: LMX.accent }}>{t('à votre porte.')}</Text>
        </Text>
        <Text style={{ marginTop: 14, fontSize: 14, lineHeight: 21, color: LMX.ink70 }}>
          {t('Découvrez des milliers de produits de vendeurs vérifiés à Conakry. Inspectez avant de payer — votre confiance est notre règle.')}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 5 }}><Dot active /><Dot /><Dot /></View>
        <View style={{ flex: 1 }} />
        <Button variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('SignIn')}>{t('Commencer')}</Button>
      </View>
    </Screen>
  );
}

// ── Sign In ───────────────────────────────────────────────────────
export function ScreenSignIn() {
  const nav = useNavigation<any>();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('Champs manquants'), t('Veuillez renseigner votre email et mot de passe.'));
      return;
    }
    setLoading(true);
    try {
      const u = await login(email.trim().toLowerCase(), password);
      // Staff land on their dashboard as the ROOT (no shop underneath) so they can't
      // swipe/back into the customer shopping screens and get lost. Logout returns to SignIn.
      const dash = staffHomeRoute(u?.roles);
      nav.reset({ index: 0, routes: [{ name: dash ?? 'Main' }] });
    } catch (e: any) {
      Alert.alert(t('Connexion échouée'), friendlyError(e, t('Email ou mot de passe incorrect.')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} right={<LangToggle />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Bienvenue')}</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 36, lineHeight: 40, marginTop: 8, color: LMX.ink }}>
          {t('Connectez-vous à')}{'\n'}<Text style={{ color: LMX.accent }}>Loomodex</Text>
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 28, gap: 16 }}>
        <Field label={t('Adresse email')} leadingIcon="user" placeholder={t('Votre adresse email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field
          label={t('Mot de passe')}
          leadingIcon="key"
          placeholder={t('Votre mot de passe')}
          value={password}
          onChangeText={setPassword}
          trailingIcon="eye"
          onTrailingPress={() => setShowPass(v => !v)}
          secure={!showPass}
        />
        <Pressable style={{ alignSelf: 'flex-end' }} onPress={() => nav.navigate('Forgot')}>
          <Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(500), textDecorationLine: 'underline' }}>{t('Mot de passe oublié ?')}</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        {loading
          ? <ActivityIndicator color={LMX.brand} size="large" />
          : <Button full variant="accent" size="lg" icon="arrowR" onPress={handleLogin}>{t('Se connecter')}</Button>
        }
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 28, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, color: LMX.ink70 }}>{t('Nouveau sur Loomodex ?')} </Text>
        <Pressable onPress={() => nav.navigate('SignUp')}>
          <Text style={{ fontSize: 13, color: LMX.brand, fontFamily: sans(600), textDecorationLine: 'underline' }}>{t('Créer un compte')}</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 28, alignItems: 'center' }}>
        <Pressable onPress={() => nav.navigate('Main')}>
          <Text style={{ fontSize: 12, color: LMX.ink50, textDecorationLine: 'underline' }}>{t('Continuer sans compte')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

// ── Sign Up ───────────────────────────────────────────────────────
export function ScreenSignUp() {
  const nav = useNavigation<any>();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [agreed, setAgreed]       = useState(false);

  const passLen  = password.length >= 6;
  const passNum  = /\d/.test(password);
  const passMatch = confirmPass.length > 0 && password === confirmPass;

  const handleRegister = async () => {
    if (!firstName.trim() || !phone.trim() || !password) {
      Alert.alert(t('Champs manquants'), t('Le prénom, le téléphone et le mot de passe sont obligatoires.'));
      return;
    }
    if (!passLen) {
      Alert.alert(t('Mot de passe trop court'), t('Minimum 6 caractères.'));
      return;
    }
    if (password !== confirmPass) {
      Alert.alert(t('Mots de passe différents'), t('Les deux mots de passe ne correspondent pas.'));
      return;
    }
    if (!agreed) {
      Alert.alert(t('Conditions'), t("Veuillez accepter les conditions d'utilisation."));
      return;
    }
    setLoading(true);
    try {
      await register({ email: email.trim().toLowerCase(), password, first_name: firstName, last_name: lastName, phone });
      nav.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e: any) {
      Alert.alert(t('Erreur'), friendlyError(e, t("L'inscription a échoué.")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Nouveau compte')}</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 34, lineHeight: 38, marginTop: 8, color: LMX.ink }}>
          {t('Rejoignez')}{'\n'}<Text style={{ color: LMX.accent }}>Loomodex</Text>
        </Text>
        <Text style={{ fontSize: 13, color: LMX.ink70, marginTop: 10, lineHeight: 19 }}>{t('Remplissez les informations ci-dessous pour créer votre compte.')}</Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 14 }}>
        <Field label={t('Prénom *')} leadingIcon="user" placeholder={t('Votre prénom')} value={firstName} onChangeText={setFirstName} />
        <Field label={t('Nom')} leadingIcon="user" placeholder={t('Votre nom')} value={lastName} onChangeText={setLastName} />
        <Field label={t('Email (optionnel)')} placeholder={t('Votre email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <PhoneInput label={t('Téléphone *')} value={phone} onChange={setPhone} />
        <Field label={t('Mot de passe *')} leadingIcon="key" placeholder={t('Mot de passe')} value={password} onChangeText={setPassword} secure={!showPass} trailingIcon="eye" onTrailingPress={() => setShowPass(v => !v)} />
        <Field label={t('Confirmer le mot de passe *')} leadingIcon="key" placeholder={t('Confirmez votre mot de passe')} value={confirmPass} onChangeText={setConfirmPass} secure={!showConfirm} trailingIcon="eye" onTrailingPress={() => setShowConfirm(v => !v)} />
        <View style={{ gap: 2, paddingLeft: 4 }}>
          <Requirement label={t('Au moins 6 caractères')} met={passLen} />
          <Requirement label={t('Contient un chiffre')} met={passNum} />
          <Requirement label={t('Les mots de passe correspondent')} met={passMatch} />
        </View>
      </View>

      <Pressable
        onPress={() => setAgreed(v => !v)}
        style={{ paddingHorizontal: 24, paddingTop: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
      >
        <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: agreed ? LMX.brand : 'transparent', borderWidth: agreed ? 0 : 1.5, borderColor: LMX.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
          {agreed && <Icon name="check" size={12} color="#fff" />}
        </View>
        <Text style={{ fontSize: 12, color: LMX.ink70, lineHeight: 18, flex: 1 }}>
          {t("J'accepte les")}{' '}
          <Text style={{ color: LMX.brand, fontFamily: sans(600) }}>{t("Conditions d'utilisation")}</Text>
          {' '}{t('et la')}{' '}
          <Text style={{ color: LMX.brand, fontFamily: sans(600) }}>{t('Politique de confidentialité')}</Text>.
        </Text>
      </Pressable>

      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        {loading
          ? <ActivityIndicator color={LMX.brand} size="large" />
          : <Button full variant="accent" size="lg" icon="arrowR" onPress={handleRegister}>{t('Créer mon compte')}</Button>
        }
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 20, flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, color: LMX.ink70 }}>{t('Déjà un compte ?')} </Text>
        <Pressable onPress={() => nav.navigate('SignIn')}>
          <Text style={{ fontSize: 13, color: LMX.brand, fontFamily: sans(600), textDecorationLine: 'underline' }}>{t('Se connecter')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

// ── OTP ───────────────────────────────────────────────────────────
export function ScreenOTP() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Vérification')}</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 34, lineHeight: 38, marginTop: 8, color: LMX.ink }}>{t('Entrez le code\nreçu par SMS')}</Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 28, flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
        {[0,1,2,3,4,5].map(i => (
          <View key={i} style={{ flex: 1, height: 60, borderRadius: 14, backgroundColor: LMX.surface, borderWidth: i === 0 ? 2 : 1, borderColor: i === 0 ? LMX.brand : LMX.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: mono(600), fontSize: 24, color: LMX.ink }}>{i === 0 ? '•' : ''}</Text>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <Button full variant="accent" size="lg" icon="arrowR" onPress={() => nav.navigate('Main')}>{t('Vérifier')}</Button>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, color: LMX.ink70 }}>{t('Pas reçu ?')} </Text>
        <Pressable><Text style={{ fontSize: 12, color: LMX.brand, fontFamily: sans(600) }}>{t('Renvoyer')}</Text></Pressable>
      </View>
    </Screen>
  );
}

// ── Forgot Password ───────────────────────────────────────────────
export function ScreenForgot() {
  const nav = useNavigation<any>();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert(t('Email requis'), t('Veuillez entrer votre adresse email.'));
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setSent(true); // still show success to prevent enumeration
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Récupération')}</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 36, lineHeight: 40, marginTop: 8, color: LMX.ink }}>{t('Mot de passe\noublié ?')}</Text>
        <Text style={{ fontSize: 13, color: LMX.ink70, marginTop: 12, lineHeight: 20 }}>
          {t("Entrez l'email lié à votre compte — nous vous enverrons un code de réinitialisation.")}
        </Text>
      </View>

      {sent ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 32, alignItems: 'center', gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: LMX.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={28} color={LMX.emerald} />
          </View>
          <Text style={{ fontSize: 16, fontFamily: sans(600), color: LMX.ink, textAlign: 'center' }}>{t('Email envoyé !')}</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center', lineHeight: 20 }}>
            {t('Si cet email existe, vous recevrez un code de réinitialisation sous peu.')}
          </Text>
          <Button variant="accent" onPress={() => nav.navigate('Reset', { email: email.trim() })}>{t("J'ai reçu mon code")}</Button>
          <Pressable onPress={() => nav.navigate('SignIn')}><Text style={{ fontSize: 12, color: LMX.ink50, textDecorationLine: 'underline' }}>{t('Retour à la connexion')}</Text></Pressable>
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
            <Field label={t('Email')} placeholder={t('Votre adresse email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
            {loading
              ? <ActivityIndicator color={LMX.brand} />
              : <Button full variant="accent" size="lg" icon="arrowR" onPress={handleSend}>{t('Envoyer le code')}</Button>
            }
          </View>
        </>
      )}
    </Screen>
  );
}

// ── Reset Password ────────────────────────────────────────────────
export function ScreenResetPassword({ route }: any) {
  const nav = useNavigation<any>();
  const [email, setEmail]         = useState(route?.params?.email ?? '');
  const [code, setCode]           = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);

  const passLen    = password.length >= 6;
  const passMatch  = password === confirm && confirm.length > 0;

  const handleReset = async () => {
    if (!email.trim() || !code.trim()) { Alert.alert(t('Champs requis'), t('Veuillez renseigner votre email et le code reçu.')); return; }
    if (!passLen) { Alert.alert(t('Trop court'), t('Minimum 6 caractères.')); return; }
    if (!passMatch) { Alert.alert(t('Ne correspond pas'), t('Les mots de passe ne correspondent pas.')); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), code.trim(), password);
      Alert.alert(t('Succès'), t('Mot de passe mis à jour.'), [
        { text: 'OK', onPress: () => nav.reset({ index: 0, routes: [{ name: 'SignIn' }] }) }
      ]);
    } catch (e: any) {
      Alert.alert(t('Échec'), friendlyError(e, t('Code invalide ou expiré.')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppBar left={<IconBtn icon="chevL" onPress={() => nav.goBack()} />} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 11, color: LMX.ink50, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: sans(600) }}>{t('Nouveau mot de passe')}</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 34, lineHeight: 38, marginTop: 8, color: LMX.ink }}>{t('Créer un nouveau\nmot de passe')}</Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 28, gap: 14 }}>
        <Field label={t('Email')} placeholder={t('Votre adresse email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label={t('Code de réinitialisation')} placeholder={t('Code reçu par email')} value={code} onChangeText={setCode} autoCapitalize="none" />
        <Field label={t('Nouveau mot de passe')} leadingIcon="key" placeholder={t('Votre nouveau mot de passe')} value={password} onChangeText={setPassword} secure />
        <Field label={t('Confirmer le mot de passe')} leadingIcon="key" placeholder={t('Confirmez votre mot de passe')} value={confirm} onChangeText={setConfirm} secure />
        <View style={{ gap: 2, paddingLeft: 4 }}>
          <Requirement label={t('Au moins 6 caractères')} met={passLen} />
          <Requirement label={t('Les mots de passe correspondent')} met={passMatch} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        {loading
          ? <ActivityIndicator color={LMX.brand} />
          : <Button full variant="accent" size="lg" icon="check" onPress={handleReset}>{t('Réinitialiser')}</Button>
        }
      </View>
    </Screen>
  );
}
