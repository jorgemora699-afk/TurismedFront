import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';

const UsersTab = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await client.get('/users');
      console.log('Users response:', JSON.stringify(response.data));
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.log('Users error:', JSON.stringify(error.response?.data));
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user) => {
    setEditing(user);
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const response = await client.patch(`/users/${editing.id}`, {
        name,
        email,
        phone,
      });

      if (response.data.success) {
        Alert.alert('¡Listo!', 'Usuario actualizado exitosamente');
        setModalVisible(false);
        loadUsers();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de eliminar a ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await client.delete(`/users/${userId}`);
              if (response.data.success) {
                Alert.alert('Listo', 'Usuario eliminado');
                loadUsers();
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar');
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.phone && <Text style={styles.phone}>📞 {item.phone}</Text>}
          <View style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}>
            <Text style={styles.roleText}>
              {item.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEdit(item)}>
          <Ionicons name="pencil-outline" size={20} color="#E85D04" />
        </TouchableOpacity>
        {item.id !== currentUser.id && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={20} color="#e53935" />
          </TouchableOpacity>
        )}
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
        <Text style={styles.statsText}>Total: {users.length} usuarios</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
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
            <Text style={styles.modalTitle}>Editar usuario</Text>
            <Text style={styles.modalSubtitle}>{editing?.email}</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nombre completo"
            />

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Teléfono"
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Guardar cambios</Text>
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
  },
  statsText: { fontSize: 13, color: '#666', fontWeight: '500' },
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E85D04',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#333' },
  email: { fontSize: 12, color: '#999', marginBottom: 2 },
  phone: { fontSize: 12, color: '#999', marginBottom: 4 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeAdmin: { backgroundColor: '#fff3e0' },
  roleText: { fontSize: 11, color: '#666', fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 4 },
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
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#999', marginBottom: 20 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
  },
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

export default UsersTab;