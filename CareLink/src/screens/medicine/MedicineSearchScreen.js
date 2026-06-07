import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import { Colors, FontSizes, FontWeights, Spacing, Radius, Shadows } from '../../theme';
import { Header, SearchBar, Button, LoadingOverlay, PharmacyMap } from '../../components/common';
import { useLanguage } from '../../i18n';
import { medicineService } from '../../services/medicineService';
import { useAuth } from '../../context/AuthContext';
import {
  getRegisteredPharmacies,
  uploadPrescriptionImage,
  createOrder,
} from '../../services/careService';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'pharmacies', label: 'Nearby', icon: 'location' },
  { id: 'upload', label: 'Upload Rx', icon: 'document-text' },
];

// ─── Theme alias shim (bridges the screen to the actual theme tokens) ──────────
const C = {
  primary: Colors.amberMid,
  primaryLight: Colors.amberGlow,
  primaryDark: Colors.amberDark,
  text: Colors.textPrimary,
  textMuted: Colors.textMuted,
  textSecondary: Colors.textSecondary,
  surface: Colors.surface,
  bg: '#F5F4F0',
  border: Colors.border,
  success: Colors.success,
  error: Colors.error,
  warning: Colors.warning,
  accent: Colors.accent,
  accentLight: Colors.accentLight,
  iconBg: '#FFF3E8',
};

export default function MedicineSearchScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Pharmacies State
  const [pharmacies, setPharmacies] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const listRef = useRef(null);

  // Upload/Order State
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Registered pharmacies for the Upload Rx tab
  const [rxPharmacies, setRxPharmacies] = useState([]);
  const [rxPharmacySearch, setRxPharmacySearch] = useState('');
  const [selectedRxPharmacy, setSelectedRxPharmacy] = useState(null);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxSending, setRxSending] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  // Called by PharmacyMap when it finds real POIs via Mapbox
  const handlePharmaciesFound = (list) => {
    setPharmacies(list);
    setListLoading(false);
  };

  // Load registered pharmacies whenever the Upload tab becomes active
  useEffect(() => {
    if (activeTab !== 'upload') return;
    let cancelled = false;
    setRxLoading(true);
    getRegisteredPharmacies({ search: rxPharmacySearch })
      .then((data) => { if (!cancelled) setRxPharmacies(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRxLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, rxPharmacySearch]);

  // Tap a map marker → highlight the card in the list
  const handleMarkerPress = (id) => {
    setHighlightedId(id);
    const idx = pharmacies.findIndex((p) => p.id === id);
    if (idx !== -1 && listRef.current) {
      listRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.1 });
    }
  };

  const openDirections = (item) => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}&travelmode=walking`
    );
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (searchDebounce) clearTimeout(searchDebounce);
    setSearchDebounce(
      setTimeout(async () => {
        if (text.length > 2) {
          try {
            const results = await medicineService.searchMedicines(text);
            setMedicines(results);
          } catch (error) {
            console.error(error);
          }
        } else {
          setMedicines([]);
        }
      }, 500)
    );
  };

  const handleMedicineSelect = async (medicine) => {
    if (!location) {
      Alert.alert('Location required', 'Please enable location to find nearby pharmacies.');
      return;
    }
    try {
      setLoading(true);
      const result = await medicineService.getMedicineAvailability(
        medicine.id,
        location.latitude,
        location.longitude
      );
      setSelectedMedicine(result.medicine);
      setAvailability(result.availability);
      setModalVisible(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setPrescriptionImage(result.assets[0].uri);
    }
  };

  const handleOrder = async (pharmacyId, items, prescriptionUrl = null) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to place an order');
      return;
    }
    try {
      setLoading(true);
      await medicineService.createOrder({
        patient_id: user.id,
        pharmacy_id: pharmacyId,
        items: items,
        prescription_url: prescriptionUrl,
        delivery_mode: 'pickup',
      });
      Alert.alert('Success', 'Order placed successfully!');
      setModalVisible(false);
      setPrescriptionImage(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Send uploaded prescription to the selected registered pharmacy
  const handleSendPrescription = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to send a prescription.');
      return;
    }
    if (!selectedRxPharmacy) {
      Alert.alert('No Pharmacy Selected', 'Please select a pharmacy to send your prescription to.');
      return;
    }
    if (!prescriptionImage) {
      Alert.alert('No Prescription', 'Please upload a prescription image first.');
      return;
    }
    try {
      setRxSending(true);
      // 1. Upload image to Supabase Storage
      const imageUrl = await uploadPrescriptionImage(prescriptionImage, user.id);
      // 2. Create order linked to this pharmacy with the image URL
      await createOrder({
        patientId: user.id,
        pharmacyId: selectedRxPharmacy.id,
        prescriptionImageUrl: imageUrl,
        items: [],
        deliveryMode: 'pickup',
        notes: 'Prescription image upload order',
      });
      Alert.alert(
        'Prescription Sent! 🎉',
        `Your prescription has been sent to ${selectedRxPharmacy.name}. They will confirm your order shortly.`,
        [{
          text: 'OK',
          onPress: () => {
            setPrescriptionImage(null);
            setSelectedRxPharmacy(null);
          }
        }]
      );
    } catch (err) {
      Alert.alert('Failed to Send', err.message || 'Could not send prescription. Please try again.');
    } finally {
      setRxSending(false);
    }
  };

  // ─── Medicine Search Result Card ────────────────────────────────────────────
  const renderMedicineItem = ({ item }) => (
    <TouchableOpacity
      style={styles.medicineCard}
      onPress={() => handleMedicineSelect(item)}
      activeOpacity={0.75}
    >
      <View style={styles.medicineIconBg}>
        <Ionicons name="medkit" size={22} color={C.primary} />
      </View>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{item.name}</Text>
        <Text style={styles.medicineGeneric}>{item.generic_name}</Text>
        <View style={styles.medicineBrandRow}>
          <View style={styles.medicineBrandPill}>
            <Text style={styles.medicineBrandText}>{item.brand}</Text>
          </View>
        </View>
      </View>
      <View style={styles.chevronBox}>
        <Ionicons name="chevron-forward" size={16} color={C.primary} />
      </View>
    </TouchableOpacity>
  );

  // ─── Nearby Pharmacy Card ───────────────────────────────────────────────────
  const renderPharmacyItem = ({ item, index }) => {
    const isHighlighted = item.id === highlightedId;
    return (
      <TouchableOpacity
        style={[styles.pharmacyCard, isHighlighted && styles.pharmacyCardHighlighted]}
        activeOpacity={0.85}
        onPress={() => setHighlightedId(item.id)}
      >
        <View style={styles.pharmacyIconCol}>
          <View style={[styles.pharmacyIconBg, isHighlighted && { backgroundColor: '#FFE0C2' }]}>
            <Ionicons name="storefront-outline" size={20} color={C.primary} />
          </View>
        </View>
        <View style={styles.pharmacyContent}>
          <Text style={styles.pharmacyName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.pharmacyAddress} numberOfLines={1}>
            {item.address || item.distanceStr}
          </Text>
          <View style={styles.pharmacyBadges}>
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate" size={10} color={C.accent} />
              <Text style={styles.distanceText}>
                {item.distanceStr || (item.distance ? `${item.distance} km` : '—')}
              </Text>
            </View>
            <View style={styles.distanceBadge}>
              <Ionicons name="walk-outline" size={10} color={C.accent} />
              <Text style={styles.distanceText}>{item.time || '—'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.dirBtn}
            onPress={() => openDirections(item)}
          >
            <Ionicons name="navigate" size={13} color={C.accent} />
            <Text style={styles.dirBtnText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Availability Item inside the bottom sheet modal ───────────────────────
  const renderAvailabilityItem = ({ item }) => (
    <View style={styles.availabilityItem}>
      <View style={styles.availInfo}>
        <Text style={styles.availPharmacyName}>{item.pharmacy_name}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={12} color={C.textMuted} />
          <Text style={styles.availAddress} numberOfLines={1}>
            {' '}{item.pharmacy_address}
          </Text>
        </View>
        <View style={[styles.row, { marginTop: 4 }]}>
          <View style={styles.distancePill}>
            <Ionicons name="navigate-outline" size={10} color={C.accent} />
            <Text style={styles.availDistance}> {item.distance} km</Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.price}>₹{item.price}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.orderButton}
        onPress={() =>
          handleOrder(item.pharmacy_id, [
            {
              medicine_id: selectedMedicine.id,
              medicine_name: selectedMedicine.name,
              quantity: 1,
              unit_price: item.price,
            },
          ])
        }
      >
        <Ionicons name="bag-handle-outline" size={14} color="#fff" />
        <Text style={styles.orderButtonText}>Order</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Header title="Medicine & Pharmacy" onBack={() => navigation.goBack()} />

      {loading && <LoadingOverlay />}

      {/* ── Tab Bar ── */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.id ? C.primary : C.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {/* ── Search Tab ── */}
        {activeTab === 'search' && (
          <>
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search medicine or brand name…"
              />
            </View>
            <FlatList
              data={medicines}
              keyExtractor={(item) => item.id}
              renderItem={renderMedicineItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                searchQuery.length > 2 ? (
                  <View style={styles.centerEmpty}>
                    <Ionicons name="search-circle-outline" size={56} color="#E0DDD6" />
                    <Text style={styles.emptyTitle}>No medicines found</Text>
                    <Text style={styles.emptySubtitle}>Try a different name or brand</Text>
                  </View>
                ) : (
                  <View style={styles.centerEmpty}>
                    <View style={styles.emptyIllustration}>
                      <Ionicons name="medkit-outline" size={48} color={C.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>Search for medicines</Text>
                    <Text style={styles.emptySubtitle}>
                      Type at least 3 characters to start searching
                    </Text>
                  </View>
                )
              }
            />
          </>
        )}

        {/* ── Nearby Tab ── */}
        {activeTab === 'pharmacies' && (
          <View style={{ flex: 1 }}>
            {/* Map wrapper with expand button */}
            <View style={styles.mapWrapper}>
              {location ? (
                <PharmacyMap
                  userLat={location.latitude}
                  userLon={location.longitude}
                  highlightedId={highlightedId}
                  style={{ flex: 1 }}
                  onMarkerPress={handleMarkerPress}
                  onPharmaciesFound={handlePharmaciesFound}
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={styles.mapText}>Getting your location…</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => setMapModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="expand" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Pharmacy list */}
            {listLoading ? (
              <View style={styles.listLoader}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.listLoaderText}>Finding nearby pharmacies…</Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={pharmacies}
                keyExtractor={(item) => item.id}
                renderItem={renderPharmacyItem}
                contentContainerStyle={styles.pharmacyList}
                onScrollToIndexFailed={() => {}}
                ListHeaderComponent={
                  <Text style={styles.listHeader}>
                    {pharmacies.length > 0 ? `${pharmacies.length} Pharmacies Nearby` : 'Nearby Pharmacies'}
                  </Text>
                }
                ListEmptyComponent={
                  <View style={styles.centerEmpty}>
                    <Ionicons name="storefront-outline" size={48} color="#E0DDD6" />
                    <Text style={styles.emptyTitle}>No pharmacies found</Text>
                    <Text style={styles.emptySubtitle}>No pharmacies detected in your area</Text>
                  </View>
                }
              />
            )}

            {/* Full-screen map modal */}
            <Modal
              visible={mapModalVisible}
              animationType="slide"
              statusBarTranslucent
              onRequestClose={() => setMapModalVisible(false)}
            >
              <SafeAreaView style={styles.fsModalContainer}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.fsModalHeader}>
                  <TouchableOpacity
                    onPress={() => setMapModalVisible(false)}
                    style={styles.fsModalClose}
                  >
                    <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.fsModalTitle}>Nearby Pharmacies</Text>
                  <View style={{ width: 40 }} />
                </View>
                {location && (
                  <PharmacyMap
                    userLat={location.latitude}
                    userLon={location.longitude}
                    highlightedId={highlightedId}
                    style={{ flex: 1 }}
                    onMarkerPress={(id) => setHighlightedId(id)}
                    onPharmaciesFound={() => {}}
                  />
                )}
                <View style={styles.fsLegend}>
                  <View style={styles.fsLegendItem}>
                    <View style={[styles.fsLegendDot, { backgroundColor: '#5B5A9E', borderWidth: 2, borderColor: 'rgba(91,90,158,0.35)' }]} />
                    <Text style={styles.fsLegendLabel}>You are here</Text>
                  </View>
                  <View style={styles.fsLegendItem}>
                    <View style={[styles.fsLegendDot, { backgroundColor: '#E8843A' }]} />
                    <Text style={styles.fsLegendLabel}>Pharmacy</Text>
                  </View>
                </View>
              </SafeAreaView>
            </Modal>
          </View>
        )}

        {/* ── Upload Rx Tab ── */}
        {activeTab === 'upload' && (
          <ScrollView contentContainerStyle={styles.uploadContent} showsVerticalScrollIndicator={false}>
            {/* ─ Prescription Image card ─ */}
            <View style={styles.uploadCard}>
              <View style={styles.uploadCardHeader}>
                <View style={styles.uploadCardIconBg}>
                  <Ionicons name="document-text" size={28} color={C.primary} />
                </View>
                <Text style={styles.uploadTitle}>Upload Prescription</Text>
                <Text style={styles.uploadSubtitle}>
                  Upload a clear photo of your prescription to order medicines from a nearby pharmacy.
                </Text>
              </View>

              <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.8}>
                {prescriptionImage ? (
                  <Image source={{ uri: prescriptionImage }} style={styles.uploadedImage} />
                ) : (
                  <>
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="camera" size={30} color={C.primary} />
                    </View>
                    <Text style={styles.uploadBoxTitle}>Take Photo or Choose from Gallery</Text>
                    <Text style={styles.uploadBoxSub}>JPG, PNG supported</Text>
                  </>
                )}
              </TouchableOpacity>

              {prescriptionImage && (
                <TouchableOpacity style={styles.retakeBtn} onPress={pickImage}>
                  <Ionicons name="refresh" size={16} color={C.primary} />
                  <Text style={styles.retakeBtnText}>Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ─ Pharmacy selection (always visible) ─ */}
            <View style={styles.pharmacySection}>
              <Text style={styles.sectionTitle}>Send to Pharmacy</Text>
              <Text style={styles.sectionSubtitle}>Select a registered pharmacy to receive your prescription order.</Text>

              {/* Search bar */}
              <View style={styles.rxSearchRow}>
                <Ionicons name="search" size={16} color={C.textMuted} style={styles.rxSearchIcon} />
                <TextInput
                  style={styles.rxSearchInput}
                  placeholder="Search registered pharmacies…"
                  placeholderTextColor={C.textMuted}
                  value={rxPharmacySearch}
                  onChangeText={setRxPharmacySearch}
                  returnKeyType="search"
                />
                {rxPharmacySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setRxPharmacySearch('')}>
                    <Ionicons name="close-circle" size={18} color={C.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {rxLoading ? (
                <View style={styles.rxLoadingRow}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={styles.rxLoadingText}>Loading pharmacies…</Text>
                </View>
              ) : rxPharmacies.length === 0 ? (
                <View style={styles.rxEmpty}>
                  <Ionicons name="storefront-outline" size={40} color="#E0DDD6" />
                  <Text style={styles.rxEmptyText}>No registered pharmacies found.</Text>
                </View>
              ) : (
                rxPharmacies.map((ph) => {
                  const isSelected = selectedRxPharmacy?.id === ph.id;
                  return (
                    <TouchableOpacity
                      key={ph.id}
                      style={[styles.rxPharmacyCard, isSelected && styles.rxPharmacyCardSelected]}
                      onPress={() => setSelectedRxPharmacy(isSelected ? null : ph)}
                      activeOpacity={0.8}
                    >
                      {/* Left icon */}
                      <View style={[styles.rxPharmacyIconBg, isSelected && styles.rxPharmacyIconBgActive]}>
                        <Ionicons name="storefront-outline" size={20} color={isSelected ? '#fff' : C.primary} />
                      </View>

                      {/* Info */}
                      <View style={styles.rxPharmacyInfo}>
                        <Text style={[styles.rxPharmacyName, isSelected && styles.rxPharmacyNameActive]}>
                          {ph.name}
                        </Text>
                        {(ph.address || ph.city) ? (
                          <Text style={styles.rxPharmacyAddr} numberOfLines={1}>
                            {[ph.address, ph.city, ph.state].filter(Boolean).join(', ')}
                          </Text>
                        ) : null}
                        <View style={styles.rxPharmacyBadgeRow}>
                          <View style={[styles.rxStatusBadge, { backgroundColor: ph.is_open ? '#E6F7EE' : '#FDECEA' }]}>
                            <View style={[styles.rxStatusDot, { backgroundColor: ph.is_open ? C.success : C.error }]} />
                            <Text style={[styles.rxStatusText, { color: ph.is_open ? C.success : C.error }]}>
                              {ph.is_open ? 'Open' : 'Closed'}
                            </Text>
                          </View>
                          {ph.phone ? (
                            <View style={styles.rxPhoneBadge}>
                              <Ionicons name="call-outline" size={10} color={C.accent} />
                              <Text style={styles.rxPhoneText}>{ph.phone}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Radio indicator */}
                      <View style={[styles.rxRadio, isSelected && styles.rxRadioActive]}>
                        {isSelected && <View style={styles.rxRadioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* ─ Send CTA ─ */}
            {(prescriptionImage || selectedRxPharmacy) && (
              <View style={styles.rxSendSection}>
                {/* Summary chips */}
                <View style={styles.rxSummaryRow}>
                  <View style={[styles.rxSummaryChip, !prescriptionImage && styles.rxSummaryChipInactive]}>
                    <Ionicons name={prescriptionImage ? 'checkmark-circle' : 'ellipse-outline'} size={16}
                      color={prescriptionImage ? C.success : C.textMuted} />
                    <Text style={[styles.rxSummaryLabel, !prescriptionImage && { color: C.textMuted }]}>
                      {prescriptionImage ? 'Prescription ready' : 'No prescription yet'}
                    </Text>
                  </View>
                  <View style={[styles.rxSummaryChip, !selectedRxPharmacy && styles.rxSummaryChipInactive]}>
                    <Ionicons name={selectedRxPharmacy ? 'checkmark-circle' : 'ellipse-outline'} size={16}
                      color={selectedRxPharmacy ? C.success : C.textMuted} />
                    <Text style={[styles.rxSummaryLabel, !selectedRxPharmacy && { color: C.textMuted }]}>
                      {selectedRxPharmacy ? selectedRxPharmacy.name : 'No pharmacy selected'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.rxSendBtn,
                    (!prescriptionImage || !selectedRxPharmacy || rxSending) && styles.rxSendBtnDisabled,
                  ]}
                  onPress={handleSendPrescription}
                  activeOpacity={0.8}
                  disabled={!prescriptionImage || !selectedRxPharmacy || rxSending}
                >
                  {rxSending ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.rxSendBtnText}>Sending…</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.rxSendBtnText}>Send Prescription</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* ─── Availability Bottom Sheet Modal ─────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            {/* Drag Handle */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available at</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* Selected medicine info */}
            {selectedMedicine && (
              <View style={styles.selectedMedBanner}>
                <View style={styles.selectedMedIconBg}>
                  <Ionicons name="medkit" size={22} color={C.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.medHeaderName}>{selectedMedicine.name}</Text>
                  <Text style={styles.medHeaderBrand}>{selectedMedicine.brand}</Text>
                </View>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Availability list */}
            <FlatList
              data={availability}
              keyExtractor={(item) => item.id}
              renderItem={renderAvailabilityItem}
              ListEmptyComponent={
                <View style={styles.modalEmptyState}>
                  <Ionicons name="storefront-outline" size={44} color="#E0DDD6" />
                  <Text style={styles.modalEmptyTitle}>Not available nearby</Text>
                  <Text style={styles.modalEmptySubtitle}>
                    No nearby pharmacies have this medicine in stock.
                  </Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F4F0' },

  // ── Tab Bar ──────────────────────────────────────────────────────────────────
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    padding: 4,
    ...Shadows.soft,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.pill,
    gap: 5,
  },
  activeTab: { backgroundColor: '#FFF3E8' },
  tabText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: FontWeights.semiBold,
  },
  activeTabText: { color: Colors.amberMid, fontWeight: FontWeights.bold },

  content: { flex: 1 },

  // ── Search ──────────────────────────────────────────────────────────────────
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 80,
  },

  // ── Medicine Card ────────────────────────────────────────────────────────────
  medicineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    ...Shadows.soft,
  },
  medicineIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  medicineInfo: { flex: 1 },
  medicineName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  medicineGeneric: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: 5,
  },
  medicineBrandRow: { flexDirection: 'row' },
  medicineBrandPill: {
    backgroundColor: '#FFF3E8',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  medicineBrandText: {
    fontSize: FontSizes.xs,
    color: Colors.amberMid,
    fontWeight: FontWeights.semiBold,
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },

  // ── Empty State ──────────────────────────────────────────────────────────────
  centerEmpty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIllustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.sm },

  // ── Map & Pharmacy ───────────────────────────────────────────────────────────
  mapWrapper: {
    height: 230,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapText: { marginTop: 8, color: Colors.textMuted, fontWeight: FontWeights.semiBold },
  expandBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.amberMid,
    borderRadius: Radius.sm,
    padding: 6,
    ...Shadows.soft,
  },
  listLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xl,
  },
  listLoaderText: { fontSize: FontSizes.sm, color: Colors.textMuted },
  pharmacyList: { padding: Spacing.base, backgroundColor: '#F5F4F0' },
  listHeader: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },

  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadows.soft,
  },
  pharmacyCardHighlighted: {
    borderColor: Colors.amberMid,
    backgroundColor: '#FFFAF5',
  },
  pharmacyIconCol: { marginRight: Spacing.sm },
  pharmacyIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pharmacyContent: { flex: 1 },
  pharmacyName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  pharmacyAddress: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  pharmacyBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  ratingText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: '#E8A030', marginLeft: 2 },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  distanceText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: Colors.accent, marginLeft: 2 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  statusText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  dirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  dirBtnText: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: FontWeights.semiBold,
  },

  // ── Upload ───────────────────────────────────────────────────────────────────
  uploadContent: { padding: Spacing.base, paddingBottom: 60 },
  uploadCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  uploadCardHeader: { alignItems: 'center', marginBottom: Spacing.base },
  uploadCardIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  uploadTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  uploadSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  uploadBox: {
    height: 180,
    borderWidth: 1.5,
    borderColor: Colors.amberMid,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFAF5',
    marginTop: Spacing.base,
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  uploadBoxTitle: { fontSize: FontSizes.sm, color: Colors.textPrimary, fontWeight: FontWeights.semiBold },
  uploadBoxSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 3 },
  uploadedImage: { width: '100%', height: '100%', borderRadius: Radius.lg - 2, resizeMode: 'cover' },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  retakeBtnText: { fontSize: FontSizes.sm, color: Colors.amberMid, fontWeight: FontWeights.semiBold },

  pharmacySelection: { marginTop: Spacing.xs },
  pharmacySection: { marginTop: Spacing.xs, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, marginBottom: 4, color: Colors.textPrimary },
  sectionSubtitle: { fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 18 },

  // Rx pharmacy search
  rxSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  rxSearchIcon: { opacity: 0.6 },
  rxSearchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    padding: 0,
  },

  // Rx loading / empty
  rxLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  rxLoadingText: { fontSize: FontSizes.sm, color: Colors.textMuted },
  rxEmpty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  rxEmptyText: { fontSize: FontSizes.sm, color: Colors.textMuted },

  // Rx pharmacy card
  rxPharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  rxPharmacyCardSelected: {
    borderColor: Colors.amberMid,
    backgroundColor: '#FFFAF5',
  },
  rxPharmacyIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxPharmacyIconBgActive: {
    backgroundColor: Colors.amberMid,
  },
  rxPharmacyInfo: { flex: 1 },
  rxPharmacyName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rxPharmacyNameActive: { color: Colors.amberDark },
  rxPharmacyAddr: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  rxPharmacyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  rxStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rxStatusDot: { width: 6, height: 6, borderRadius: 3 },
  rxStatusText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semiBold },
  rxPhoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rxPhoneText: { fontSize: FontSizes.xs, color: Colors.accent, fontWeight: FontWeights.medium },

  // Radio button
  rxRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxRadioActive: { borderColor: Colors.amberMid },
  rxRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.amberMid,
  },

  // Send section (CTA)
  rxSendSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  rxSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  rxSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F7EE',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    flex: 1,
  },
  rxSummaryChipInactive: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  rxSummaryLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semiBold,
    color: Colors.success,
    flex: 1,
  },
  rxSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.amberMid,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    ...Shadows.medium,
  },
  rxSendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  rxSendBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: '#fff',
  },

  row: { flexDirection: 'row', alignItems: 'center' },

  // ── Modal ────────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    maxHeight: '85%',
    ...Shadows.medium,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.extraBold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedMedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E8',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectedMedIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medHeaderName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  medHeaderBrand: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },

  // ── Availability Item ────────────────────────────────────────────────────────
  availabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F4F0',
  },
  availInfo: { flex: 1, marginRight: Spacing.sm },
  availPharmacyName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  availAddress: { fontSize: FontSizes.xs, color: Colors.textMuted, flex: 1 },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availDistance: { fontSize: FontSizes.xs, color: Colors.accent, fontWeight: FontWeights.semiBold },
  dot: { marginHorizontal: 5, color: Colors.textMuted, fontSize: FontSizes.sm },
  price: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.success },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amberMid,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.md,
    gap: 5,
  },
  orderButtonText: { color: 'white', fontWeight: FontWeights.bold, fontSize: FontSizes.sm },

  // ── Modal Empty State ────────────────────────────────────────────────────────
  modalEmptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  modalEmptyTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.base,
    marginBottom: 6,
  },
  modalEmptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Full-Screen Map Modal ─────────────────────────────────────────────────────
  fsModalContainer: { flex: 1, backgroundColor: Colors.surface },
  fsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fsModalClose: { width: 40, alignItems: 'flex-start' },
  fsModalTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  fsLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  fsLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fsLegendDot: { width: 10, height: 10, borderRadius: 5 },
  fsLegendLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});
