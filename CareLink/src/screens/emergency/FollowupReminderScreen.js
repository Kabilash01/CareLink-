import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, Radius, Shadows } from '../../theme';
import { Header, Button, Card, LoadingOverlay } from '../../components/common';
import { useLanguage } from '../../i18n';
import { AuthContext } from '../../context/AuthContext';
import { saveFollowupReminder } from '../../services/emergencyService';

// Calculate scheduled time based on interval
const getScheduledTime = (interval) => {
  const now = new Date();
  const intervals = {
    '1h': 1 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  return new Date(now.getTime() + (intervals[interval] || 0)).toISOString();
};

export default function FollowupReminderScreen({ navigation, route }) {
  const [selected, setSelected] = useState('1d');
  const [saving, setSaving] = useState(false);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const incidentId = route?.params?.incidentId;

  const reminderOptions = [
    { id: '1h', label: t('followup.oneHour') },
    { id: '4h', label: t('followup.fourHours') },
    { id: '1d', label: t('followup.tomorrow') },
    { id: '3d', label: t('followup.threeDays') },
    { id: '1w', label: t('followup.oneWeek') },
  ];

  const handleSet = async () => {
    if (!user?.id) {
      Alert.alert(t('common.error'), t('common.userNotAuthenticated'));
      return;
    }

    setSaving(true);
    try {
      const { error } = await saveFollowupReminder(user.id, {
        scheduledFor: getScheduledTime(selected),
        reminderTime: selected,
        incidentId: incidentId || null,
        followupType: 'emergency',
        notes: 'Follow-up reminder after emergency incident',
      });

      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        const label = reminderOptions.find(o => o.id === selected)?.label;
        Alert.alert(t('followup.reminderSet'), t('followup.reminderMessage', { time: label }));
        navigation.popToTop?.();
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={saving} />
      <Header title={t('followup.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="alarm" size={56} color={Colors.accent} />
        </View>
        <Text style={styles.title}>{t('followup.setReminder')}</Text>
        <Text style={styles.subtitle}>
          {t('followup.subtitle')}
        </Text>

        <Card title={t('followup.remindIn')} style={{ marginTop: Spacing.lg }}>
          {reminderOptions.map(opt => (
            <TouchableOpacity key={opt.id} style={[styles.optionRow, selected === opt.id && styles.optionSelected]}
              onPress={() => setSelected(opt.id)} disabled={saving}>
              <Ionicons name={selected === opt.id ? 'radio-button-on' : 'radio-button-off'}
                size={22} color={selected === opt.id ? Colors.accent : Colors.textMuted} />
              <Text style={[styles.optionLabel, selected === opt.id && { color: Colors.accent }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        <Card title={t('followup.whatToFollowUp')} style={{ marginTop: Spacing.md }}>
          {[t('followup.visitDoctor'), t('followup.completeMedication'), t('followup.uploadDocuments')].map((item, i) => (
            <View key={i} style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </Card>

        <Button label={t('followup.setReminder')} onPress={handleSet} style={{ marginTop: Spacing.xl }}
          disabled={saving} />
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.popToTop?.()} disabled={saving}>
          <Text style={styles.skipText}>{t('followup.skipForNow')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.lg, paddingBottom: 60 },
  iconWrap: { alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: FontSizes.md, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: Radius.md,
  },
  optionSelected: { backgroundColor: Colors.accent + '10' },
  optionLabel: { fontSize: FontSizes.base, color: Colors.textPrimary },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  checkText: { fontSize: FontSizes.md, color: Colors.textSecondary },
  skipBtn: { alignItems: 'center', marginTop: Spacing.md },
  skipText: { fontSize: FontSizes.md, color: Colors.textMuted },
});
