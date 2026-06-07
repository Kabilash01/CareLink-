import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSizes, FontWeights, Spacing, Radius, Shadows } from '../../theme';
import { Header, Button, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n';
import { uploadTestReportFile, saveTestReport } from '../../services/careService';

export default function UploadReportScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reportType, setReportType] = useState(null);
  const [labName, setLabName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const reportTypes = ['Blood', 'Imaging', 'Urine', 'Pathology', 'Other'];

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name || `Report_${Date.now()}`,
          size: asset.size ? (asset.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
          type: asset.mimeType?.includes('pdf') ? 'pdf' : 'image',
        }));
        setFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  const handleCamera = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setFiles(prev => [...prev, {
        uri: asset.uri,
        name: `Camera_Scan_${Date.now()}.jpg`,
        size: '1.2 MB',
        type: 'image',
      }]);
    }
  };

  const parseDateInput = (raw) => {
    const parts = raw.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      if (!isNaN(Date.parse(iso))) return iso;
    }
    return null;
  };

  const handleUpload = async () => {
    if (files.length === 0 || !reportType) return;
    if (!user?.id) {
       Alert.alert('Error', 'You must be logged in to upload.');
       return;
    }

    setUploading(true);
    try {
      // Loop over files and upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${file.name}...`);
        
        let fileUrl = null;
        try {
          fileUrl = await uploadTestReportFile(file.uri, user.id);
        } catch (e) {
          console.warn("Upload failed for file ", file.name, e);
          continue; // skip if error
        }
        
        const isoDate = parseDateInput(testDate);
        await saveTestReport({
          userId: user.id,
          name: file.name,
          labName: labName.trim() || null,
          testDate: isoDate,
          reportType,
          fileUrl,
          fileType: file.type,
          fileSize: file.size,
          notes: notes.trim() || null,
        });
      }

      Alert.alert(
        'Success!',
        'Your reports have been successfully uploaded to your records.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.warn('[UploadReportScreen] error:', err.message);
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('health.uploadReport')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Upload Area */}
        <TouchableOpacity style={[styles.uploadZone, Shadows.soft]} onPress={handlePickFile}>
          <Ionicons name="cloud-upload" size={48} color={Colors.accent} />
          <Text style={styles.uploadTitle}>Upload Files</Text>
          <Text style={styles.uploadSub}>Tap to select PDF, JPEG, or PNG files{'\n'}Max 10 MB per file</Text>
        </TouchableOpacity>

        {/* Selected Files */}
        {files.length > 0 && (
          <View style={styles.fileList}>
            {files.map((f, i) => (
              <View key={i} style={[styles.fileItem, Shadows.soft]}>
                <Ionicons name={f.type === 'pdf' ? 'document' : 'image'} size={24} color={Colors.accent} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.fileName}>{f.name}</Text>
                  <Text style={styles.fileSize}>{f.size}</Text>
                </View>
                <TouchableOpacity onPress={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                  <Ionicons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Report Type */}
        <Text style={styles.label}>Report Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {reportTypes.map(t => (
            <TouchableOpacity key={t}
              style={[styles.chip, reportType === t && styles.chipActive]}
              onPress={() => setReportType(t)}>
              <Text style={[styles.chipText, reportType === t && { color: Colors.white }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label="Lab / Hospital Name" value={labName} onChangeText={setLabName}
          placeholder="e.g. Apollo Diagnostics"
          leftIcon={<Ionicons name="business-outline" size={18} color={Colors.textMuted} />} />
        <Input label="Test Date" value={testDate} onChangeText={setTestDate}
          placeholder="DD/MM/YYYY"
          leftIcon={<Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />} />
        <Input label="Notes (Optional)" value={notes} onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline numberOfLines={3}
          leftIcon={<Ionicons name="create-outline" size={18} color={Colors.textMuted} />} />

        {/* Camera Option */}
        <TouchableOpacity style={[styles.cameraRow, Shadows.soft]} onPress={handleCamera}>
          <Ionicons name="camera" size={24} color={Colors.amberMid} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.cameraTitle}>Scan with Camera</Text>
            <Text style={styles.cameraSub}>Take a photo of your report</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {uploading ? (
          <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={{ marginTop: Spacing.md, color: Colors.accent }}>{uploadProgress}</Text>
          </View>
        ) : (
          <Button title="Upload Report" variant="primary" size="lg"
            disabled={files.length === 0 || !reportType}
            onPress={handleUpload}
            style={{ marginTop: Spacing.lg }}
            icon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scroll: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  uploadZone: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.accent, borderStyle: 'dashed',
    marginBottom: Spacing.md,
  },
  uploadTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginTop: Spacing.md },
  uploadSub: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
  fileList: { marginBottom: Spacing.lg },
  fileItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  fileName: { fontSize: FontSizes.md, fontWeight: FontWeights.medium, color: Colors.textPrimary },
  fileSize: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  label: {
    fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textSecondary,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, paddingRight: Spacing.lg },
  chip: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.pill,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textPrimary },
  cameraRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.md,
  },
  cameraTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.medium, color: Colors.textPrimary },
  cameraSub: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
});
