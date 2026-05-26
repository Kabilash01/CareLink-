import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, Radius, Shadows } from '../../theme';
import { Header, Button, Card } from '../../components/common';
import { useLanguage } from '../../i18n';
import { AuthContext } from '../../context/AuthContext';
import { logEmergencyIncident } from '../../services/emergencyService';

export default function SeverityResultScreen({ navigation, route }) {
  const type = route?.params?.type || 'Emergency';
  const severity = route?.params?.severity || 'moderate'; // 'low', 'moderate', 'high', 'critical'
  const symptoms = route?.params?.symptoms || [];
  const [logging, setLogging] = useState(false);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  // Log the incident when component mounts
  useEffect(() => {
    logIncident();
  }, [user]);

  const logIncident = async () => {
    if (!user?.id) return;

    setLogging(true);
    try {
      await logEmergencyIncident(user.id, {
        type,
        severity,
        symptoms,
        assessmentResult: getSeverityBehavior(severity).message,
        recommendedActions: getRecommendedActions(),
        aiAnalysis: null, // Could call AI service here
      });
    } catch (err) {
      console.warn('[SeverityResult]', err.message);
    } finally {
      setLogging(false);
    }
  };

  const severityConfig = {
    low: { color: Colors.success, bg: '#E8F5E9', icon: 'shield-checkmark', label: t('severity.lowSeverity'), message: t('severity.lowMessage') },
    moderate: { color: Colors.amberMid, bg: '#FFF3E0', icon: 'warning', label: t('severity.moderateSeverity'), message: t('severity.moderateMessage') },
    high: { color: '#FF6D00', bg: '#FFE0B2', icon: 'alert-circle', label: t('severity.highSeverity'), message: t('severity.highMessage') },
    critical: { color: Colors.error, bg: '#FFEBEE', icon: 'alert', label: t('severity.criticalSeverity'), message: t('severity.criticalMessage') },
  };

  const getSeverityBehavior = (sev) => severityConfig[sev];

  const getRecommendedActions = () => {
    const actions = [
      { title: t('severity.stayCalmTitle'), desc: t('severity.stayCalmDesc') },
      { title: t('severity.applyFirstAidTitle'), desc: t('severity.applyFirstAidDesc') },
      { title: t('severity.seekMedicalTitle'), desc: t('severity.seekMedicalDesc') },
    ];

    // Add specific actions based on severity
    if (severity === 'critical') {
      actions.unshift({ title: t('severity.callAmbulance'), desc: 'Call emergency services immediately' });
    }
    return actions;
  };

  const config = getSeverityBehavior(severity);

  return (
    <View style={styles.container}>
      <Header title={t('severity.assessmentResult')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Severity Banner */}
        <View style={[styles.severityCard, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={56} color={config.color} />
          <Text style={[styles.severityLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.severityMsg}>{config.message}</Text>
        </View>

        {/* Emergency Type */}
        <Card title={t('severity.emergencyType')}>
          <Text style={styles.typeText}>{type}</Text>
        </Card>

        {/* Recommended Actions - Dynamic based on severity */}
        <Text style={styles.sectionTitle}>{t('severity.recommendedActions')}</Text>
        <View style={styles.actionList}>
          {getRecommendedActions().map((action, idx) => (
            <View key={idx} style={styles.actionItem}>
              <View style={[styles.actionNum, { backgroundColor: [Colors.error, Colors.amberMid, Colors.accent, Colors.success][idx % 4] }]}>
                <Text style={styles.actionNumText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <Button title={t('severity.viewFirstAid')} variant="primary" size="lg"
            icon={<Ionicons name="medkit" size={18} color={Colors.white} />}
            onPress={() => navigation.navigate('FirstAidInstructions', { type })} />
          <Button title={t('severity.findNearestHospital')} variant="amber" size="lg"
            icon={<Ionicons name="location" size={18} color={Colors.white} />}
            onPress={() => navigation.navigate('NearestHospitals')}
            style={{ marginTop: Spacing.md }} />
          {severity === 'critical' && (
            <Button title={t('severity.callAmbulance')} variant="danger" size="lg"
              icon={<Ionicons name="call" size={18} color={Colors.white} />}
              onPress={() => {}} style={{ marginTop: Spacing.md }} />
          )}
        </View>

        {logging && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={{ fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: Spacing.xs }}>
              {t('common.saving')}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  severityCard: {
    borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  severityLabel: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, marginTop: Spacing.md },
  severityMsg: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  typeText: { fontSize: FontSizes.lg, fontWeight: FontWeights.semiBold, color: Colors.textPrimary },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  actionList: { marginBottom: Spacing.lg },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  actionNum: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionNumText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.white },
  actionTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.semiBold, color: Colors.textPrimary },
  actionDesc: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  actions: { marginTop: Spacing.sm },
});
