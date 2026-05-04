import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../../api/client';

const TYPE_CONFIG = {
  restaurant: { emoji: '🍽️', label: 'Restaurante', color: '#E85D04' },
  bar:        { emoji: '🍺', label: 'Bar',          color: '#9B2226' },
  nightclub:  { emoji: '🎵', label: 'Club',         color: '#6A0572' },
  cafe:       { emoji: '☕', label: 'Café',         color: '#774936' },
  park:       { emoji: '🌳', label: 'Parque',       color: '#386641' },
};

const CATEGORIES = [
  { id: 1, label: 'Foodies',           emoji: '🍽️' },
  { id: 2, label: 'Fiesteros',         emoji: '🎵' },
  { id: 3, label: 'Románticos',        emoji: '💑' },
  { id: 4, label: 'Casuales',          emoji: '😎' },
  { id: 5, label: 'Gourmet Nocturnos', emoji: '🍷' },
];

const PRICE_RANGES = [
  { value: 1, label: 'Económico', symbol: '$' },
  { value: 2, label: 'Moderado',  symbol: '$$' },
  { value: 3, label: 'Premium',   symbol: '$$$' },
];

const getTypeCfg = (type) =>
  TYPE_CONFIG[type] || { emoji: '📍', label: type || 'Lugar', color: '#555' };

const PlacesTab = () => {
  const [places, setPlaces]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);

  const [name, setName]                   = useState('');
  const [description, setDescription]     = useState('');
  const [address, setAddress]             = useState('');
  const [phone, setPhone]                 = useState('');
  const [openingHours, setOpeningHours]   = useState('');
  const [priceRange, setPriceRange]       = useState(null);
  const [type, setType]                   = useState('restaurant');
  const [categoryId, setCategoryId]       = useState(null);

  useFocusEffect(
    useCallback(() => { loadPlaces(); }, [])
  );

  const loadPlaces = async () => {
    setLoading(true);
    try {
      const response = await client.get('/places');
      if (response.data.success) setPlaces(response.data.data.places);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los lugares');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setDescription(''); setAddress('');
    setPhone(''); setOpeningHours(''); setPriceRange(null);
    setType('restaurant'); setCategoryId(null);
  };

  const openCreate = () => { setEditing(null); resetForm(); setModalVisible(true); };

  const openEdit = (place) => {
    setEditing(place);
    setName(place.name || '');
    setDescription(place.description || '');
    setAddress(place.address || '');
    setPhone(place.phone || '');
    setOpeningHours(place.opening_hours || '');
    setPriceRange(place.price_range || null);
    setType(place.place_type || 'restaurant');
    setCategoryId(place.category_id || null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = { name, description, address, phone, opening_hours: openingHours, price_range: priceRange, place_type: type, category_id: categoryId };
      const response = editing
        ? await client.patch(`/places/${editing.id}`, payload)
        : await client.post('/places', payload);
      if (response.data.success) {
        Alert.alert('¡Listo!', editing ? 'Lugar actualizado' : 'Lugar creado');
        setModalVisible(false);
        loadPlaces();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (placeId, placeName) => {
    Alert.alert('Eliminar lugar', `¿Estás seguro de eliminar "${placeName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            const response = await client.delete(`/places/${placeId}`);
            if (response.data.success) { Alert.alert('Listo', 'Lugar eliminado'); loadPlaces(); }
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar');
          }
        }
      }
    ]);
  };

  const renderPlace = ({ item, index }) => {
    const cfg = getTypeCfg(item.place_type);
    return (
      <View style={styles.card}>
        <View style={[styles.cardSidebar, { backgroundColor: cfg.color }]} />
        <View style={styles.cardBody}>
          <View style={[styles.emojiCircle, { backgroundColor: cfg.color + '18' }]}>
            <Text style={styles.emoji}>{cfg.emoji}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: cfg.color + '15' }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              {item.price_range && (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>
                    {'$'.repeat(item.price_range)}
                  </Text>
                </View>
              )}
            </View>
            {item.address && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={11} color="#aaa" />
                <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
              </View>
            )}
            {item.opening_hours && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={11} color="#aaa" />
                <Text style={styles.detailText} numberOfLines={1}>{item.opening_hours}</Text>
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil" size={15} color="#E85D04" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
              <Ionicons name="trash" size={15} color="#e53935" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Cargando lugares…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats + botón agregar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{places.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
          const count = places.filter(p => p.place_type === key).length;
          if (!count) return null;
          return (
            <View key={key} style={styles.statItem}>
              <Text style={styles.statNumber}>{count}</Text>
              <Text style={styles.statLabel}>{cfg.emoji}</Text>
            </View>
          );
        })}
        <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPlace}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalHandle} />
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">

            {/* Header modal */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: getTypeCfg(type).color }]}>
                <Text style={{ fontSize: 24 }}>{getTypeCfg(type).emoji}</Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>{editing ? 'Editar lugar' : 'Nuevo lugar'}</Text>
                <Text style={styles.modalSubtitle}>
                  {editing ? editing.name : 'Completa la información'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Tipo — primero para que el header emoji cambie */}
            <Text style={styles.sectionLabel}>Tipo de lugar</Text>
            <View style={styles.chipRow}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, type === key && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  onPress={() => setType(key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipEmoji}>{cfg.emoji}</Text>
                  <Text style={[styles.chipText, type === key && styles.chipTextActive]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Nombre *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="storefront-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre del lugar" placeholderTextColor="#ccc" />
            </View>

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.inputDirect, styles.textArea]}
              value={description} onChangeText={setDescription}
              placeholder="Descripción del lugar" placeholderTextColor="#ccc"
              multiline numberOfLines={3}
            />

            <Text style={styles.label}>Dirección</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Dirección" placeholderTextColor="#ccc" />
            </View>

            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="3001234567" placeholderTextColor="#ccc" keyboardType="phone-pad" />
            </View>

            <Text style={styles.label}>Horario</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput style={styles.input} value={openingHours} onChangeText={setOpeningHours} placeholder="Lun-Dom 12:00-22:00" placeholderTextColor="#ccc" />
            </View>

            <Text style={styles.sectionLabel}>Rango de precio</Text>
            <View style={styles.chipRow}>
              {PRICE_RANGES.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chip, priceRange === p.value && styles.chipActive]}
                  onPress={() => setPriceRange(p.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipSymbol, priceRange === p.value && styles.chipTextActive]}>{p.symbol}</Text>
                  <Text style={[styles.chipText, priceRange === p.value && styles.chipTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Categoría de usuario</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, categoryId === c.id && styles.chipActive]}
                  onPress={() => setCategoryId(c.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipEmoji}>{c.emoji}</Text>
                  <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave} disabled={saving} activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name={editing ? 'checkmark' : 'add'} size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>{editing ? 'Guardar cambios' : 'Crear lugar'}</Text>
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
  statLabel: { fontSize: 11, color: '#aaa', fontWeight: '600' },
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
  cardSidebar: { width: 4 },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  emojiCircle: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginBottom: 5 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  priceBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  priceText: { fontSize: 10, fontWeight: '700', color: '#666' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  detailText: { fontSize: 12, color: '#aaa', flex: 1 },
  actions: { flexDirection: 'column', gap: 8, paddingTop: 2 },
  editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff3e0', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#ffebee', alignItems: 'center', justifyContent: 'center' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  modalIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  modalSubtitle: { fontSize: 13, color: '#aaa', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 20 },

  sectionLabel: { fontSize: 12, color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  label: { fontSize: 12, color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, marginBottom: 16, backgroundColor: '#fafafa' },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, padding: 14, fontSize: 15, color: '#333' },
  inputDirect: { borderWidth: 1.5, borderColor: '#eee', borderRadius: 12, padding: 14, marginBottom: 16, backgroundColor: '#fafafa', fontSize: 15, color: '#333' },
  textArea: { height: 88, textAlignVertical: 'top' },

  /* Chips */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#E85D04', borderColor: '#E85D04' },
  chipEmoji: { fontSize: 14 },
  chipSymbol: { fontSize: 13, fontWeight: '800', color: '#666' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  /* Botones modal */
  saveBtn: { flexDirection: 'row', backgroundColor: '#E85D04', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#E85D04', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, marginBottom: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText: { color: '#aaa', fontSize: 15, fontWeight: '600' },
});

export default PlacesTab;