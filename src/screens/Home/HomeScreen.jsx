import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getRecommendations } from '../../api/placesApi';

const HomeScreen = ({ navigation }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
    }, [])
  );

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await getRecommendations(user.id);
      if (response.success) {
        setRecommendations(response.data);
      }
    } catch (error) {
      Alert.alert(
        'Bienvenido',
        'Primero responde el cuestionario para ver tus recomendaciones',
        [{ text: 'Ir al cuestionario', onPress: () => navigation.navigate('Questionnaire') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeEmoji = (type) => {
    const emojis = {
      restaurant: '🍽️',
      bar: '🍺',
      club: '🎵',
      cafe: '☕',
      park: '🌳',
    };
    return emojis[type] || '📍';
  };

  const renderPlace = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PlaceDetail', { place: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{getTypeEmoji(item.type || item.place_type)}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.placeName}>{item.name}</Text>
          <Text style={styles.placeType}>{item.type || item.place_type}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      )}
      {item.address && (
        <Text style={styles.address}>📍 {item.address}</Text>
      )}
    </TouchableOpacity>
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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name} 👋</Text>
          <Text style={styles.subtitle}>Lugares recomendados para ti</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {recommendations.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No hay recomendaciones aún</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Questionnaire')}
          >
            <Text style={styles.buttonText}>Responder cuestionario</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPlace}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#E85D04',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#ffe0cc',
    marginTop: 2,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  placeType: {
    fontSize: 13,
    color: '#E85D04',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  address: {
    fontSize: 13,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#E85D04',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default HomeScreen;