import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, Gradients, Radius } from '../../theme';
import { Button, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n';

export default function SignUpScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [selectedGender, setSelectedGender] = useState('');
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const updateField = (key, value) => setForm({ ...form, [key]: value });
  const genders = [t('auth.male'), t('auth.female'), t('auth.other')];

  const handleSignUp = async () => {
    if (!form.email || !form.password) {
      Alert.alert(t('auth.missingFields'), t('auth.emailPasswordRequired'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert(t('auth.passwordMismatch'), t('auth.passwordsNoMatch'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email.trim(), form.password, {
      full_name: form.name,
      phone: form.phone,
      age: form.age ? parseInt(form.age, 10) : null,
      gender: selectedGender,
    });
    setLoading(false);
    if (error) {
      Alert.alert(t('auth.signUpFailed'), error.message);
    } else {
      Alert.alert(t('auth.checkEmail'), t('auth.confirmationSent'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('Login') },
      ]);
    }
  };

  return (
    <LinearGradient colors={Gradients.bg} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('auth.joinCareLink')}</Text>
          </View>

          <View style={styles.form}>
            <Input label={t('auth.fullName')} placeholder={t('auth.fullNamePlaceholder')} value={form.name} onChangeText={(v) => updateField('name', v)}
              icon={<Ionicons name="person-outline" size={20} color={Colors.textMuted} />} />
            <Input label={t('auth.age')} placeholder={t('auth.agePlaceholder')} value={form.age} onChangeText={(v) => updateField('age', v)}
              keyboardType="numeric" icon={<Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />} />

            <Text style={styles.label}>{t('auth.gender')}</Text>
            <View style={styles.genderRow}>
              {genders.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setSelectedGender(g)}
                  style={[styles.genderChip, selectedGender === g && styles.genderChipActive]}
                >
                  <Text style={[styles.genderText, selectedGender === g && styles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label={t('auth.phoneNumber')} placeholder={t('auth.phonePlaceholder')} value={form.phone}
              onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={20} color={Colors.textMuted} />} />
            <Input label={t('auth.email')} placeholder={t('auth.emailAddressPlaceholder')} value={form.email}
              onChangeText={(v) => updateField('email', v)} keyboardType="email-address"
              autoCapitalize="none"
              icon={<Ionicons name="mail-outline" size={20} color={Colors.textMuted} />} />
            <Input label={t('auth.createPassword')} placeholder={t('auth.minChars')} value={form.password}
              onChangeText={(v) => updateField('password', v)} secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />} />
            <Input label={t('auth.confirmPassword')} placeholder={t('auth.reEnterPassword')} value={form.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)} secureTextEntry
              icon={<Ionicons name="shield-checkmark-outline" size={20} color={Colors.textMuted} />} />

            <Button title={t('auth.createAccount')} onPress={handleSignUp} loading={loading} size="lg" style={{ marginTop: Spacing.md }} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 60 },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSizes.base, color: Colors.textMuted, marginTop: 4 },
  form: { marginBottom: Spacing.xl },
  label: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
  genderRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  genderChip: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  genderChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  genderText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  genderTextActive: { color: Colors.accent },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: Spacing.xxl },
  footerText: { fontSize: FontSizes.md, color: Colors.textSecondary },
  footerLink: { fontSize: FontSizes.md, color: Colors.accent, fontWeight: FontWeights.semiBold },
});
