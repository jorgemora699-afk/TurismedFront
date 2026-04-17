import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../../api/client';

const PlacesTab = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [priceRange, setPriceRange] = useState(null);
  const [type, setType] = useState('restaurant');

  const types = ['restaurant', 'bar', 'nightclub', 'cafe', 'park'];
  const priceRanges = [
    { value: 1, label: '$ Económico' },
    { value: 2, label: '$$ Moderado' },
    { value: 3, label: '$$$ Premium' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [])
  );

  const loadPlaces = async () => {
    setLoading(true);
    try {
      const response = await client.get('/places');
      if (response.data.success) {
        setPlaces(response.data.data.places);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los lugares');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setAddress('');
    setPhone('');
    setCategoryId(null);
    setOpeningHours('');
    setPriceRange(null);
    setType('restaurant');
    setModalVisible(true);
  };

  const categories = [
    { id: 1, label: '🍽️ Foodies' },
    { id: 2, label: '🎵 Fiesteros' },
    { id: 3, label: '💑 Románticos' },
    { id: 4, label: '😎 Casuales' },
    { id: 5, label: '🍷 Gourmet Nocturnos' },
  ];

  const openEdit = (place) => {
    setEditing(place);
    setName(place.name || '');
    setDescription(place.description || '');
    setAddress(place.address || '');
    setPhone(place.phone || '');
    setCategoryId(place.category_id || null);
    setOpeningHours(place.opening_hours || '');
    setPriceRange(place.price_range || null);
    setType(place.place_type || 'restaurant');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description,
        address,
        phone,
        opening_hours: openingHours,
        price_range: priceRange,
        place_type: type,
        category_id: categoryId,  // ← NUEVO
      };

      let response;
      if (editing) {
        response = await client.patch(`/places/${editing.id}`, payload);
      } else {
        response = await client.post('/places', payload);
      }

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

  const handleDelete = async (placeId, placeName) => {
    Alert.alert(
      'Eliminar lugar',
      `¿Estás seguro de eliminar ${placeName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await client.delete(`/places/${placeId}`);
              if (response.data.success) {
                Alert.alert('Listo', 'Lugar eliminado');
                loadPlaces();
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const getTypeEmoji = (type) => {
    const emojis = {
      restaurant: '🍽️', bar: '🍺', nightclub: '🎵', cafe: '☕', park: '🌳',
    };
    return emojis[type] || '📍';
  };

  const renderPlace = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.emoji}>{getTypeEmoji(item.place_type)}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.type}>{item.place_type || 'Sin tipo'}</Text>
          {item.address && <Text style={styles.address}>📍 {item.address}</Text>}
          {item.phone && <Text style={styles.address}>📞 {item.phone}</Text>}
          {item.price_symbol && <Text style={styles.address}>{item.price_symbol}</Text>}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEdit(item)}>
          <Ionicons name="pencil-outline" size={18} color="#E85D04" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id, item.name)}>
          <Ionicons name="trash-outline" size={18} color="#e53935" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E85D04" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>Total: {places.length} lugares</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPlace}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editing ? 'Editar lugar' : 'Nuevo lugar'}
            </Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nombre del lugar"
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Dirección"
            />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej: 3001234567"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Horario</Text>
            <TextInput
              style={styles.input}
              value={openingHours}
              onChangeText={setOpeningHours}
              placeholder="Ej: Lun-Dom 12:00-22:00"
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.optionsContainer}>
              {types.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.optionButton, type === t && styles.optionButtonActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.optionText, type === t && styles.optionTextActive]}>
                    {getTypeEmoji(t)} {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Rango de precio</Text>
            <View style={styles.optionsContainer}>
              {priceRanges.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.optionButton, priceRange === p.value && styles.optionButtonActive]}
                  onPress={() => setPriceRange(p.value)}
                >
                  <Text style={[styles.optionText, priceRange === p.value && styles.optionTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.optionsContainer}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.optionButton, categoryId === c.id && styles.optionButtonActive]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Text style={[styles.optionText, categoryId === c.id && styles.optionTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>{editing ? 'Guardar cambios' : 'Crear lugar'}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: { fontSize: 13, color: '#666', fontWeight: '500' },
  addButton: {
    backgroundColor: '#E85D04',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emoji: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#333' },
  type: { fontSize: 12, color: '#E85D04', textTransform: 'capitalize', marginBottom: 2 },
  address: { fontSize: 12, color: '#999' },
  actions: { flexDirection: 'row', gap: 8 },
  editButton: { padding: 8 },
  deleteButton: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionButtonActive: { backgroundColor: '#E85D04', borderColor: '#E85D04' },
  optionText: { fontSize: 13, color: '#666' },
  optionTextActive: { color: '#fff', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#E85D04',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { padding: 12, alignItems: 'center', marginBottom: 20 },
  cancelText: { color: '#666', fontSize: 15 },
});

export default PlacesTab;