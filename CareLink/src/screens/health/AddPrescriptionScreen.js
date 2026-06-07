import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSizes, FontWeights, Spacing, Radius, Shadows } from '../../theme';
import { Header, Button, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import {
  uploadPrescriptionToVault,
  saveUserPrescription,
} from '../../services/careService';

const AVAILABLE_TAGS = [
  'Diabetes', 'Hypertension', 'Cardiac', 'Antibiotic',
  'Chronic', 'Thyroid', 'Respiratory', 'General',
];

export default function AddPrescriptionScreen({ navigation }) {
  const { user } = useAuth();

  // Form state
  const [title, setTitle]                 = useState('');
  const [doctorName, setDoctorName]       = useState('');
  const [hospitalName, setHospitalName]   = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [notes, setNotes]                 = useState('');
  const [selectedTags, setSelectedTags]   = useState([]);
  const [imageUri, setImageUri]           = useState(null);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const requestPermission = async (type) => {
    if (Platform.OS === 'web') return true;
    const fn =
      type === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await fn();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        `CareLink needs ${type === 'camera' ? 'camera' : 'photo library'} access to store prescriptions.`
      );
      return false;
    }
    return true;
  };

  const handleCamera = async () => {
    const granted = await requestPermission('camera');
    if (!granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
      // Auto-fill title if empty
      if (!title) {
        const d = new Date();
        setTitle(`Prescription – ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`);
      }
    }
  };

  const handleGallery = async () => {
    const granted = await requestPermission('gallery');
    if (!granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
      if (!title) {
        const d = new Date();
        setTitle(`Prescription – ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`);
      }
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const parseDateInput = (raw) => {
    // Accepts DD/MM/YYYY, return YYYY-MM-DD for DB
    const parts = raw.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      if (!isNaN(Date.parse(iso))) return iso;
    }
    return null;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please add a title for this prescription.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Required', 'Please capture or select a prescription image.');
      return;
    }

    setUploading(true);
    try {
      setUploadProgress('Uploading image…');
      const imageUrl = await uploadPrescriptionToVault(imageUri, user.id);

      setUploadProgress('Saving record…');
      const isoDate = parseDateInput(prescriptionDate);
      await saveUserPrescription({
        userId: user.id,
        title: title.trim(),
        doctorName: doctorName.trim() || null,
        hospitalName: hospitalName.trim() || null,
        prescriptionDate: isoDate,
        imageUrl,
        notes: notes.trim() || null,
        tags: selectedTags.map(t => t.toLowerCase()),
      });

      Alert.alert(
        '✅ Saved!',
        'Your prescription has been securely stored in your vault.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.warn('[AddPrescription] save error:', err.message);
      Alert.alert(
        'Upload Failed',
        'Something went wrong. Please check your connection and try again.\n\n' + err.message
      );
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Add Prescription" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image capture area */}
        {imageUri ? (
          <View style={[styles.previewWrap, Shadows.soft]}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <View style={styles.previewOverlay}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleCamera}>
                <Ionicons name="camera" size={16} color={Colors.white} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleGallery}>
                <Ionicons name="images" size={16} color={Colors.white} />
                <Text style={styles.retakeBtnText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.retakeBtn, styles.removeBtn]}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="trash" size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.captureGrid}>
            {/* Camera */}
            <TouchableOpacity
              style={[styles.captureCard, styles.cameraCard, Shadows.soft]}
              onPress={handleCamera}
            >
              <View style={styles.captureIconBg}>
                <Ionicons name="camera" size={32} color={Colors.white} />
              </View>
              <Text style={styles.capturePrimary}>Scan Prescription</Text>
              <Text style={styles.captureSub}>Use camera to capture</Text>
            </TouchableOpacity>

            {/* Gallery */}
            <TouchableOpacity
              style={[styles.captureCard, styles.galleryCard, Shadows.soft]}
              onPress={handleGallery}
            >
              <View style={[styles.captureIconBg, { backgroundColor: Colors.accent }]}>
                <Ionicons name="images" size={32} color={Colors.white} />
              </View>
              <Text style={styles.capturePrimary}>From Gallery</Text>
              <Text style={styles.captureSub}>Pick from photos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Form fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Prescription Details</Text>

          <Input
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Dr. Sharma – Heart Medication"
            leftIcon={<Ionicons name="document-text-outline" size={18} color={Colors.textMuted} />}
          />
          <Input
            label="Doctor's Name"
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder="e.g. Dr. Amit Sharma"
            leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />}
          />
          <Input
            label="Hospital / Clinic"
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholder="e.g. Apollo Hospitals"
            leftIcon={<Ionicons name="business-outline" size={18} color={Colors.textMuted} />}
          />
          <Input
            label="Prescription Date"
            value={prescriptionDate}
            onChangeText={setPrescriptionDate}
            placeholder="DD/MM/YYYY"
            keyboardType="numeric"
            leftIcon={<Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />}
          />
          <Input
            label="Personal Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes about this prescription..."
            multiline
            numberOfLines={3}
            leftIcon={<Ionicons name="create-outline" size={18} color={Colors.textMuted} />}
          />
        </View>

        {/* Tags */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Tags</Text>
          <View style={styles.tagGrid}>
            {AVAILABLE_TAGS.map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, active && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'add-circle-outline'}
                    size={14}
                    color={active ? Colors.white : Colors.accent}
                  />
                  <Text style={[styles.tagChipText, active && { color: Colors.white }]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Storage info banner */}
        <View style={[styles.infoBanner, Shadows.soft]}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
          <Text style={styles.infoText}>
            Your prescription is encrypted and stored securely in Supabase cloud storage.
            Only you can view it.
          </Text>
        </View>

        {/* Save Button */}
        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.uploadingText}>{uploadProgress}</Text>
          </View>
        ) : (
          <Button
            title="Save to Vault"
            variant="primary"
            size="lg"
            disabled={!title.trim() || !imageUri}
            onPress={handleSave}
            style={{ marginTop: Spacing.sm }}
            icon={<Ionicons name="cloud-upload" size={20} color={Colors.white} />}
          />
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },

  // Image capture
  captureGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  captureCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border,
  },
  cameraCard: { borderColor: Colors.amberMid },
  galleryCard: { borderColor: Colors.accent },
  captureIconBg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.amberMid,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  capturePrimary: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  captureSub: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  previewWrap: {
    borderRadius: Radius.xl, overflow: 'hidden',
    marginBottom: Spacing.lg, height: 280,
  },
  preview: { width: '100%', height: '100%' },
  previewOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'flex-end',
    padding: Spacing.md, gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  retakeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
  },
  removeBtn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  retakeBtnText: { fontSize: FontSizes.xs, color: Colors.white, fontWeight: FontWeights.medium },

  // Form
  formSection: { marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize: FontSizes.sm, fontWeight: FontWeights.semiBold,
    color: Colors.textSecondary, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Tags
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.accent,
  },
  tagChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tagChipText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.accent },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: '#E8F5EE', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  infoText: { flex: 1, fontSize: FontSizes.xs, color: Colors.success, lineHeight: 18 },

  // Upload progress
  uploadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg,
  },
  uploadingText: { fontSize: FontSizes.md, color: Colors.accent, fontWeight: FontWeights.medium },
});
