import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PlaceDetailScreen = ({ route, navigation }) => {
  const { place } = route.params;

  const getTypeEmoji = (type) => {
    const emojis = {
      restaurant: '🍽️', bar: '🍺', nightclub: '🎵', cafe: '☕', park: '🌳',
    };
    return emojis[type] || '📍';
  };

  const getPriceSymbol = (range) => {
    const symbols = { 1: '$ Económico', 2: '$$ Moderado', 3: '$$$ Premium' };
    return symbols[range] || '';
  };

  const openMaps = () => {
    if (!place.address) {
      Alert.alert('Sin dirección', 'Este lugar no tiene dirección registrada');
      return;
    }
    const address = encodeURIComponent(`${place.address}, Medellín, Colombia`);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir Google Maps');
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{getTypeEmoji(place.place_type || place.type)}</Text>
        <Text style={styles.heroName}>{place.name}</Text>
        <Text style={styles.heroType}>{place.place_type || place.type}</Text>
      </View>

      {/* Info */}
      <View style={styles.content}>

        {/* Rating y precio */}
        <View style={styles.badgesRow}>
          {place.rating && (
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#E85D04" />
              <Text style={styles.badgeText}>{place.rating}</Text>
            </View>
          )}
          {place.price_range && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getPriceSymbol(place.price_range)}</Text>
            </View>
          )}
          {place.price_symbol && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{place.price_symbol}</Text>
            </View>
          )}
        </View>

        {/* Botón Google Maps */}
        <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
          <Ionicons name="map" size={20} color="#fff" />
          <Text style={styles.mapsButtonText}>Ver ubicación en Google Maps</Text>
        </TouchableOpacity>

        {/* Descripción */}
        {place.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.sectionText}>{place.description}</Text>
          </View>
        )}

        {/* Dirección */}
        {place.address && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#E85D04" />
            <Text style={styles.infoText}>{place.address}</Text>
          </View>
        )}

        {/* Teléfono */}
        {place.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#E85D04" />
            <Text style={styles.infoText}>{place.phone}</Text>
          </View>
        )}

        {/* Horario */}
        {place.opening_hours && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#E85D04" />
            <Text style={styles.infoText}>{place.opening_hours}</Text>
          </View>
        )}

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#E85D04',
  },
  hero: {
    backgroundColor: '#E85D04',
    alignItems: 'center',
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  heroName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  heroType: {
    fontSize: 14,
    color: '#ffe0cc',
    textTransform: 'capitalize',
  },
  content: { padding: 24 },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: { fontSize: 14, color: '#E85D04', fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionText: { fontSize: 15, color: '#666', lineHeight: 22 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  mapsButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
  },
  mapsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  infoText: { fontSize: 14, color: '#333', flex: 1 },
});

export default PlaceDetailScreen;