import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../../api/client';

const PromotionsTab = () => {
  const [promotions, setPromotions] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoResponse, placesResponse] = await Promise.all([
        client.get('/promotions/active'),
        client.get('/places'),
      ]);

      if (promoResponse.data.success) {
        setPromotions(promoResponse.data.data.promotions);
      }
      if (placesResponse.data.success) {
        setPlaces(placesResponse.data.data.places);  // ← CAMBIO: .places al final
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setCode('');
    setDescription('');
    setDiscountPercentage('');
    setMaxUses('1');
    setSelectedPlaceId(null);
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

  const handleDelete = async (promoId, promoCode) => {
    Alert.alert(
      'Eliminar promoción',
      `¿Estás seguro de eliminar la promoción ${promoCode}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await client.delete(`/promotions/${promoId}`);
              console.log('Delete response:', JSON.stringify(response.data));
              if (response.data.success) {
                Alert.alert('Listo', 'Promoción eliminada');
                loadData();
              }
            } catch (error) {
              console.log('Delete error:', JSON.stringify(error.response?.data));
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const renderPromotion = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.emoji}>🎁</Text>
        <View style={styles.info}>
          <Text style={styles.code}>{item.code}</Text>
          <Text style={styles.description}>{item.description}</Text>
          {item.place_name && <Text style={styles.place}>📍 {item.place_name}</Text>}
          <View style={styles.statsRow}>
            {item.discount_percentage && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.discount_percentage}% OFF</Text>
              </View>
            )}
            <Text style={styles.uses}>{item.current_uses}/{item.max_uses} usos</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.code)}
      >
        <Ionicons name="trash-outline" size={18} color="#e53935" />
      </TouchableOpacity>
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
        <Text style={styles.statsText}>Total: {promotions.length} promociones</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Crear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={promotions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPromotion}
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
            <Text style={styles.modalTitle}>Nueva Promoción</Text>

            <Text style={styles.label}>Código *</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Ej: TURIS20"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción de la promoción"
            />

            <Text style={styles.label}>Descuento (%)</Text>
            <TextInput
              style={styles.input}
              value={discountPercentage}
              onChangeText={setDiscountPercentage}
              placeholder="Ej: 20"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Máximo de usos</Text>
            <TextInput
              style={styles.input}
              value={maxUses}
              onChangeText={setMaxUses}
              placeholder="1"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Lugar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.placesScroll}>
              {places.map(place => (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.placeButton, selectedPlaceId === place.id && styles.placeButtonActive]}
                  onPress={() => setSelectedPlaceId(place.id)}
                >
                  <Text style={[styles.placeButtonText, selectedPlaceId === place.id && styles.placeButtonTextActive]}>
                    {place.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Crear promoción</Text>
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
  code: { fontSize: 15, fontWeight: 'bold', color: '#E85D04', letterSpacing: 1 },
  description: { fontSize: 13, color: '#333', marginBottom: 4 },
  place: { fontSize: 12, color: '#999', marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, color: '#E85D04', fontWeight: '600' },
  uses: { fontSize: 12, color: '#999' },
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
  placesScroll: { marginBottom: 20 },
  placeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  placeButtonActive: { backgroundColor: '#E85D04', borderColor: '#E85D04' },
  placeButtonText: { fontSize: 13, color: '#666' },
  placeButtonTextActive: { color: '#fff', fontWeight: '600' },
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

export default PromotionsTab;