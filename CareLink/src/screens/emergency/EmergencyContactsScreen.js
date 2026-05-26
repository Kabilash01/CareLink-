import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, Radius, Shadows } from '../../theme';
import { Header, Button, LoadingOverlay } from '../../components/common';
import { useLanguage } from '../../i18n';
import { AuthContext } from '../../context/AuthContext';
import { getEmergencyContacts, sendSOSAlert } from '../../services/emergencyService';

export default function EmergencyContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sosSending, setSosSending] = useState(false);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  // Fetch contacts when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchContacts();
      }
    }, [user])
  );

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getEmergencyContacts(user.id);
    if (error) {
      setError(error.message);
      console.warn('[EmergencyContacts]', error.message);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleSOS = async () => {
    setSosSending(true);
    try {
      const { error } = await sendSOSAlert(user.id, {
        location: 'Current Location', // TODO: Get actual GPS location
        message: 'Emergency SOS Alert - Need Immediate Assistance',
      });

      if (error) {
        Alert.alert(t('emergencyContacts.sosError'), error.message);
      } else {
        Alert.alert(t('emergencyContacts.sosSent'), t('emergencyContacts.sosMessage'));
      }
    } catch (err) {
      Alert.alert(t('emergencyContacts.sosError'), err.message);
    } finally {
      setSosSending(false);
    }
  };

  const renderContact = ({ item }) => (
    <View style={[styles.card, Shadows.soft]}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.is_primary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryText}>{t('emergencyContacts.primary')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.relation}>{item.relation}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.phone)}>
          <Ionicons name="call" size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => {}}>
          <Ionicons name="pencil" size={18} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={sosSending} />
      <Header title={t('emergencyContacts.title')} onBack={() => navigation.goBack()} />

      {/* SOS All */}
      <TouchableOpacity
        style={[styles.sosBar, sosSending && { opacity: 0.6 }]}
        onPress={handleSOS}
        disabled={sosSending || loading}
      >
        <Ionicons name="alert-circle" size={24} color={Colors.white} />
        <Text style={styles.sosText}>{t('emergencyContacts.alertAll')}</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.white} />
      </TouchableOpacity>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button label={t('common.retry')} onPress={fetchContacts} style={{ marginTop: Spacing.md }} />
        </View>
      )}

      {/* Contacts List */}
      {!loading && !error && (
        <FlatList
          data={contacts}
          keyExtractor={i => i.id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{t('emergencyContacts.noContacts')}</Text>
              <Button label={t('emergencyContacts.addContact')} variant="outline"
                onPress={() => {}} style={{ marginTop: Spacing.md }} />
            </View>
          }
          ListFooterComponent={
            contacts.length > 0 ? (
              <View style={{ paddingTop: Spacing.md }}>
                <Button label={t('emergencyContacts.addContact')} variant="outline" onPress={() => {}} />
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle" size={20} color={Colors.accent} />
                  <Text style={styles.infoText}>
                    {t('emergencyContacts.infoText')}
                  </Text>
                </View>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.base },
  loadingText: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.md },
  errorText: { fontSize: FontSizes.md, color: Colors.error, marginTop: Spacing.md, textAlign: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.md },
  sosBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.error, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  sosText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: FontWeights.semiBold },
  list: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accent + '20',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  avatarText: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.accent },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  contactName: { fontSize: FontSizes.base, fontWeight: FontWeights.semiBold, color: Colors.textPrimary },
  primaryBadge: {
    backgroundColor: Colors.amberMid + '20', borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  primaryText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semiBold, color: Colors.amberMid },
  relation: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  phone: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  actions: { alignItems: 'center', gap: Spacing.sm },
  callBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.success,
    justifyContent: 'center', alignItems: 'center',
  },
  editBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.accent + '10',
    borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md,
  },
  infoText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
});
