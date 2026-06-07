import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Linking, Modal, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, FontWeights, Spacing, Radius, Shadows } from '../../theme';
import { Header, MapboxView } from '../../components/common';
import { useLanguage } from '../../i18n';

export default function NearestHospitalsScreen({ navigation }) {
  const { t } = useLanguage();
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading' | 'ready' | 'denied'
  const [userLocation, setUserLocation]     = useState(null);       // { lat, lng }
  const [hospitals, setHospitals]           = useState([]);          // from Mapbox geocoding
  const [listLoading, setListLoading]       = useState(true);
  const [highlightedId, setHighlightedId]   = useState(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const listRef = useRef(null);

  /* ── Get GPS on mount ───────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setLocationStatus('ready');
    })();
  }, []);

  /* ── Receive real hospital list from the map ────────────────────── */
  const handleHospitalsFound = (list) => {
    setHospitals(list);
    setListLoading(false);
  };

  /* ── Tap a marker → scroll list to that card ───────────────────── */
  const handleMarkerPress = (id) => {
    setHighlightedId(id);
    const idx = hospitals.findIndex(h => h.id === id);
    if (idx !== -1 && listRef.current) {
      listRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.1 });
    }
  };

  /* ── Directions ─────────────────────────────────────────────────── */
  const openDirections = (item) => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}&travelmode=driving`
    );
  };

  /* ── Render hospital card ───────────────────────────────────────── */
  const renderItem = ({ item, index }) => {
    const isHighlighted = item.id === highlightedId;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setHighlightedId(item.id);
        }}
        style={[
          styles.card, Shadows.soft,
          isHighlighted && styles.cardHighlighted,
        ]}
      >
        {/* Rank badge */}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>

        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <View style={styles.cardTop}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={14} color={Colors.accent} />
              <Text style={styles.metaText}>{item.distance}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="car" size={14} color={Colors.amberMid} />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openDirections(item)}
            >
              <Ionicons name="navigate" size={16} color={Colors.accent} />
              <Text style={[styles.actionText, { color: Colors.accent }]}>{t('hospitals.directions')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Permission denied state ────────────────────────────────────── */
  if (locationStatus === 'denied') {
    return (
      <View style={styles.container}>
        <Header title={t('hospitals.title')} onBack={() => navigation.goBack()} />
        <View style={styles.centeredMsg}>
          <Ionicons name="location-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.msgTitle}>{t('hospitals.locationNeeded')}</Text>
          <Text style={styles.msgSub}>
            {t('hospitals.locationDesc')}
          </Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.settingsBtnText}>{t('hospitals.openSettings')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── Getting location spinner ───────────────────────────────────── */
  if (locationStatus === 'loading') {
    return (
      <View style={styles.container}>
        <Header title={t('hospitals.title')} onBack={() => navigation.goBack()} />
        <View style={styles.centeredMsg}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={[styles.msgSub, { marginTop: Spacing.md }]}>{t('hospitals.gettingLocation')}</Text>
        </View>
      </View>
    );
  }

  /* ── Main screen ────────────────────────────────────────────────── */
  return (
    <View style={styles.container}>
      <Header title={t('hospitals.title')} onBack={() => navigation.goBack()} />

      {/* ── Inline map ───────────────────────────────────────────── */}
      <View style={styles.mapWrapper}>
        <MapboxView
          userLat={userLocation.lat}
          userLng={userLocation.lng}
          highlightedId={highlightedId}
          style={styles.map}
          onMarkerPress={handleMarkerPress}
          onHospitalsFound={handleHospitalsFound}
        />
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setMapModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="expand" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* ── Hospital list (from real POI data) ───────────────────── */}
      {listLoading ? (
        <View style={styles.listLoader}>
          <ActivityIndicator size="small" color={Colors.accent} />
          <Text style={styles.listLoaderText}>{t('hospitals.findingHospitals')}</Text>
        </View>
      ) : hospitals.length === 0 ? (
        <View style={styles.centeredMsg}>
          <Ionicons name="medical-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.msgSub}>{t('hospitals.noHospitals')}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={hospitals}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onScrollToIndexFailed={() => {}}
        />
      )}

      {/* ── Full-screen map modal ─────────────────────────────────── */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMapModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.modalClose}>
              <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('hospitals.title')}</Text>
            <View style={{ width: 40 }} />
          </View>
          <MapboxView
            userLat={userLocation.lat}
            userLng={userLocation.lng}
            highlightedId={highlightedId}
            style={styles.fullMap}
            onMarkerPress={(id) => setHighlightedId(id)}
            onHospitalsFound={() => {}}
          />
          <View style={styles.legend}>
            <LegendItem color="#6B6BCC" label={t('hospitals.youAreHere')} dot />
            <LegendItem color="#D94F4F" label={t('hospitals.hospital')} />
            <LegendItem color="#2E9E6B" label={t('hospitals.clinicPharmacy')} />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function LegendItem({ color, label, dot }) {
  return (
    <View style={styles.legendItem}>
      <View style={[
        styles.legendDot,
        { backgroundColor: color },
        dot && styles.legendDotPulse,
      ]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  /* ── Map ─────────────────────────────────────────────────────────── */
  mapWrapper: {
    height: 230,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  map: { flex: 1 },
  expandBtn: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm, padding: 6,
    ...Shadows.soft,
  },

  /* ── List ────────────────────────────────────────────────────────── */
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: 40 },
  listLoader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingTop: Spacing.xl,
  },
  listLoaderText: { fontSize: FontSizes.sm, color: Colors.textMuted },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'flex-start',
  },
  cardHighlighted: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  rankText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.accent },
  cardTop: { marginBottom: Spacing.xs },
  name: { fontSize: FontSizes.base, fontWeight: FontWeights.semiBold, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSizes.sm, color: Colors.textMuted },
  actionRow: { flexDirection: 'row', gap: Spacing.lg },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },

  /* ── Empty / error states ────────────────────────────────────────── */
  centeredMsg: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.sm,
  },
  msgTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.semiBold, color: Colors.textPrimary },
  msgSub: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center' },
  settingsBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent, borderRadius: Radius.md,
  },
  settingsBtnText: { color: Colors.white, fontWeight: FontWeights.semiBold },

  /* ── Full-screen modal ───────────────────────────────────────────── */
  modalContainer: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalClose: { width: 40, alignItems: 'flex-start' },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  fullMap: { flex: 1 },

  /* ── Legend ──────────────────────────────────────────────────────── */
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg,
    paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendDotPulse: { borderWidth: 2, borderColor: 'rgba(107,107,204,0.4)' },
  legendLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});
