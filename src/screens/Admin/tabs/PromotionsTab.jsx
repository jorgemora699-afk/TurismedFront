import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../../api/client';

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50];
const USES_PRESETS     = [1, 5, 10, 25, 50, 100];

const PromotionsTab = () => {
  const [promotions, setPromotions]     = useState([]);
  const [places, setPlaces]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving]             = useState(false);

  const [code, setCode]                           = useState('');
  const [description, setDescription]             = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxUses, setMaxUses]                     = useState('1');
  const [selectedPlaceId, setSelectedPlaceId]     = useState(null);

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoRes, placesRes] = await Promise.all([
        client.get('/promotions/active'),
        client.get('/places'),
      ]);
      if (promoRes.data.success)  setPromotions(promoRes.data.data.promotions);
      if (placesRes.data.success) setPlaces(placesRes.data.data.places);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setCode(''); setDescription(''); setDiscountPercentage('');
    setMaxUses('1'); setSelectedPlaceId(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !description.trim()) {
      Alert.alert('Error', 'Código y descripción son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const response = await client.post('/promotions/generate', {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discount_percentage: discountPercentage ? parseInt(discountPercentage) : null,
        max_uses: parseInt(maxUses) || 1,
        place_id: selectedPlaceId,
      });
      if (response.data.success) {
        Alert.alert('¡Listo!', 'Promoción creada exitosamente');
        setModalVisible(false);
        loadData();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la promoción');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (promoId, promoCode) => {
    Alert.alert('Eliminar promoción', `¿Eliminar la promoción "${promoCode}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            const response = await client.delete(`/promotions/${promoId}`);
            if (response.data.success) { Alert.alert('Listo', 'Promoción eliminada'); loadData(); }
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar');
          }
        }
      }
    ]);
  };

  // Porcentaje de uso para la barra
  const usagePercent = (item) =>
    item.max_uses > 0 ? Math.min(item.current_uses / item.max_uses, 1) : 0;

  const renderPromotion = ({ item }) => {
    const pct = usagePercent(item);
    const isAlmostFull = pct >= 0.8;
    const isFull = pct >= 1;

    return (
      <View style={styles.card}>
        {/* Sidebar degradado */}
        <View style={[styles.cardSidebar, isFull && { backgroundColor: '#aaa' }]} />

        <View style={styles.cardBody}>
          {/* Ícono */}
          <View style={[styles.iconCircle, isFull && { backgroundColor: '#f0f0f0' }]}>
            <Text style={styles.iconEmoji}>{isFull ? '✅' : '🎁'}</Text>
          </View>

          <View style={styles.info}>
            {/* Código */}
            <View style={styles.codeRow}>
              <Text style={[styles.code, isFull && { color: '#aaa' }]}>{item.code}</Text>
              {item.discount_percentage && (
                <View style={[styles.discountBadge, isFull && { backgroundColor: '#f0f0f0' }]}>
                  <Text style={[styles.discountText, isFull && { color: '#aaa' }]}>
                    {item.discount_percentage}% OFF
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.promoDesc} numberOfLines={2}>{item.description}</Text>

            {item.place_name && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={11} color="#aaa" />
                <Text style={styles.detailText}>{item.place_name}</Text>
              </View>
            )}

            {/* Barra de usos */}
            <View style={styles.usageContainer}>
              <View style={styles.usageTrack}>
                <View style={[
                  styles.usageFill,
                  { width: `${pct * 100}%` },
                  isAlmostFull && { backgroundColor: '#e53935' },
                  isFull && { backgroundColor: '#aaa' },
                ]} />
              </View>
              <Text style={[styles.usageLabel, isAlmostFull && !isFull && { color: '#e53935' }]}>
                {item.current_uses}/{item.max_uses} usos
              </Text>
            </View>
          </View>

          {/* Botón eliminar */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.code)}
          >
            <Ionicons name="trash" size={15} color="#e53935" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Cargando promociones…</Text>
      </View>
    );
  }

  const activeCount = promotions.filter(p => p.current_uses < p.max_uses).length;
  const totalUses   = promotions.reduce((acc, p) => acc + p.current_uses, 0);

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{promotions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalUses}</Text>
          <Text style={styles.statLabel}>Usos totales</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Crear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={promotions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPromotion}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎁</Text>
            <Text style={styles.emptyTitle}>Sin promociones aún</Text>
            <Text style={styles.emptyText}>Crea tu primera promoción para los usuarios</Text>
          </View>
        }
      />

      {/* Modal crear */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalHandle} />
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Text style={{ fontSize: 26 }}>🎁</Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>Nueva Promoción</Text>
                <Text style={styles.modalSubtitle}>Completa los datos del cupón</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Código *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="pricetag-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { letterSpacing: 2, fontWeight: '700' }]}
                value={code}
                onChangeText={setCode}
                placeholder="Ej: TURIS20"
                placeholderTextColor="#ccc"
                autoCapitalize="characters"
              />
            </View>

            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.inputDirect, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción de la promoción"
              placeholderTextColor="#ccc"
              multiline
              numberOfLines={2}
            />

            {/* Descuento presets */}
            <Text style={styles.sectionLabel}>Descuento (%)</Text>
            <View style={styles.chipRow}>
              {DISCOUNT_PRESETS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, discountPercentage === String(d) && styles.chipActive]}
                  onPress={() => setDiscountPercentage(String(d))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, discountPercentage === String(d) && styles.chipTextActive]}>
                    {d}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="trending-down-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={discountPercentage}
                onChangeText={setDiscountPercentage}
                placeholder="O escribe un valor personalizado"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
              />
            </View>

            {/* Usos presets */}
            <Text style={styles.sectionLabel}>Máximo de usos</Text>
            <View style={styles.chipRow}>
              {USES_PRESETS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.chip, maxUses === String(u) && styles.chipActive]}
                  onPress={() => setMaxUses(String(u))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, maxUses === String(u) && styles.chipTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="people-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={maxUses}
                onChangeText={setMaxUses}
                placeholder="O escribe un valor personalizado"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
              />
            </View>

            {/* Seleccionar lugar */}
            <Text style={styles.sectionLabel}>Lugar (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <TouchableOpacity
                style={[styles.placeChip, selectedPlaceId === null && styles.chipActive]}
                onPress={() => setSelectedPlaceId(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedPlaceId === null && styles.chipTextActive]}>
                  🌐 Todos
                </Text>
              </TouchableOpacity>
              {places.map(place => (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.placeChip, selectedPlaceId === place.id && styles.chipActive]}
                  onPress={() => setSelectedPlaceId(place.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selectedPlaceId === place.id && styles.chipTextActive]}>
                    📍 {place.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="add-circle" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Crear promoción</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#aaa' },

  /* Stats */
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 16,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '900', color: '#E85D04' },
  statLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statDivider: { width: 1, backgroundColor: '#eee', height: 28 },
  addBtn: {
    marginLeft: 'auto',
    backgroundColor: '#E85D04',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#E85D04',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  /* Lista */
  list: { padding: 16, gap: 10 },

  /* Empty state */
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20 },

  /* Tarjeta */
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSidebar: { width: 4, backgroundColor: '#E85D04' },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 22 },
  info: { flex: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  code: { fontSize: 16, fontWeight: '900', color: '#E85D04', letterSpacing: 1.5 },
  discountBadge: { backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  discountText: { fontSize: 11, color: '#E85D04', fontWeight: '700' },
  promoDesc: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  detailText: { fontSize: 12, color: '#aaa' },

  /* Barra de usos */
  usageContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usageTrack: { flex: 1, height: 5, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  usageFill: { height: '100%', backgroundColor: '#E85D04', borderRadius: 3 },
  usageLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', minWidth: 50, textAlign: 'right' },

  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#ffebee', alignItems: 'center', justifyContent: 'center', marginTop: 2 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  modalIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#fff3e0', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  modalSubtitle: { fontSize: 13, color: '#aaa', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 20 },

  sectionLabel: { fontSize: 12, color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  label: { fontSize: 12, color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, marginBottom: 16, backgroundColor: '#fafafa' },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, padding: 14, fontSize: 15, color: '#333' },
  inputDirect: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, padding: 14, marginBottom: 16, backgroundColor: '#fafafa', fontSize: 15, color: '#333' },
  textArea: { height: 72, textAlignVertical: 'top' },

  /* Chips */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#fff' },
  placeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#fff', marginRight: 8 },
  chipActive: { backgroundColor: '#E85D04', borderColor: '#E85D04' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  /* Botones modal */
  saveBtn: { flexDirection: 'row', backgroundColor: '#E85D04', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#E85D04', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, marginBottom: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText: { color: '#aaa', fontSize: 15, fontWeight: '600' },
});

export default PromotionsTab;