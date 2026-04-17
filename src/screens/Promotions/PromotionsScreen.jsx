import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getActivePromotions, redeemPromotion, getUserPromotions } from '../../api/promotionsApi';
import { useAuth } from '../../context/AuthContext';

const PromotionsScreen = () => {
  const [promotions, setPromotions] = useState([]);
  const [redeemedIds, setRedeemedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeResponse, userResponse] = await Promise.all([
        getActivePromotions(),
        getUserPromotions(user.id),
      ]);

      console.log('Promociones activas:', JSON.stringify(activeResponse));
      console.log('Promociones usuario:', JSON.stringify(userResponse));

      if (activeResponse.success) {
        setPromotions(activeResponse.data.promotions);
      }

      if (userResponse.success) {
        console.log('Redemptions data:', JSON.stringify(userResponse.data));
        const ids = userResponse.data.redemptions.map(p => p.promotion.id);
        console.log('IDs redimidos:', ids);
        setRedeemedIds(ids);
      }
    } catch (error) {
      console.log('Error loadData:', JSON.stringify(error.response?.data));
      Alert.alert('Error', 'No se pudieron cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Ingresa un código de promoción');
      return;
    }

    setRedeeming(true);
    try {
      const response = await redeemPromotion(code.trim(), user.id);

      if (response.success) {
        Alert.alert('¡Éxito!', 'Promoción canjeada exitosamente 🎉');
        setModalVisible(false);
        setCode('');
        loadData();
      } else {
        Alert.alert('Error', response.message || 'Código inválido');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo canjear el código');
    } finally {
      setRedeeming(false);
    }
  };

  const renderPromotion = ({ item }) => {
    const isRedeemed = redeemedIds.includes(item.id);

    return (
      <View style={[styles.card, isRedeemed && styles.cardRedeemed]}>
        <View style={styles.cardTop}>
          <Text style={styles.promoEmoji}>{isRedeemed ? '✅' : '🎁'}</Text>
          <View style={styles.promoInfo}>
            <Text style={[styles.promoTitle, isRedeemed && styles.promoTitleRedeemed]}>
              {item.description || 'Promoción especial'}
            </Text>
            <Text style={styles.promoPlace}>{item.place_name || 'Lugar'}</Text>
          </View>
          {isRedeemed && (
            <View style={styles.redeemedBadge}>
              <Text style={styles.redeemedBadgeText}>Canjeada</Text>
            </View>
          )}
        </View>
        <View style={[styles.codeContainer, isRedeemed && styles.codeContainerRedeemed]}>
          <Text style={styles.codeLabel}>Código:</Text>
          <Text style={[styles.codeText, isRedeemed && styles.codeTextRedeemed]}>
            {item.code}
          </Text>
        </View>
        {item.expires_at && (
          <Text style={styles.expiry}>
            Vence: {new Date(item.expires_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Promociones 🎁</Text>
        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.redeemButtonText}>Canjear código</Text>
        </TouchableOpacity>
      </View>

      {promotions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No hay promociones activas por ahora</Text>
        </View>
      ) : (
        <FlatList
          data={promotions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPromotion}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Canjear Promoción</Text>
            <Text style={styles.modalSubtitle}>Ingresa el código que recibiste</Text>

            <TextInput
              style={styles.codeInput}
              placeholder="Ej: TURIS-ABC123"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleRedeem}
              disabled={redeeming}
            >
              {redeeming
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Canjear</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => { setModalVisible(false); setCode(''); }}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  redeemButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  redeemButtonText: {
    color: '#E85D04',
    fontWeight: 'bold',
    fontSize: 13,
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
  cardRedeemed: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  promoInfo: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  promoTitleRedeemed: {
    color: '#999',
  },
  promoPlace: {
    fontSize: 13,
    color: '#E85D04',
    marginTop: 2,
  },
  redeemedBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  redeemedBadgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  codeContainerRedeemed: {
    backgroundColor: '#f0f0f0',
  },
  codeLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  codeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E85D04',
    letterSpacing: 1,
  },
  codeTextRedeemed: {
    color: '#999',
  },
  expiry: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#E85D04',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 15,
  },
});

export default PromotionsScreen;