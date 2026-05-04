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
    useCallback(() => { loadUsers(); }, [])
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await client.get('/users');
      if (response.data.success) setUsers(response.data.data);
    } catch {
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
      const response = await client.patch(`/users/${editing.id}`, { name, email, phone });
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

  const handleDelete = (userId, userName) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de eliminar a ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
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

  const getInitials = (name) =>
    name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const AVATAR_COLORS = ['#E85D04', '#9B2226', '#6A0572', '#386641', '#774936', '#1d3557'];
  const getAvatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

  const renderUser = ({ item, index }) => (
    <View style={styles.card}>
      {/* Sidebar de color */}
      <View style={[styles.cardSidebar, { backgroundColor: getAvatarColor(item.id) }]} />

      <View style={styles.cardBody}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.id) + '20' }]}>
          <Text style={[styles.avatarText, { color: getAvatarColor(item.id) }]}>
            {getInitials(item.name)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={11} color="#aaa" />
              <Text style={styles.userPhone}>{item.phone}</Text>
            </View>
          )}
          <View style={[
            styles.roleBadge,
            item.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser
          ]}>
            <Text style={[
              styles.roleText,
              item.role === 'admin' ? styles.roleTextAdmin : styles.roleTextUser
            ]}>
              {item.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
            </Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil" size={15} color="#E85D04" />
          </TouchableOpacity>
          {item.id !== currentUser.id && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Ionicons name="trash" size={15} color="#e53935" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Cargando usuarios…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {users.filter(u => u.role === 'admin').length}
          </Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {users.filter(u => u.has_completed_questionnaire).length}
          </Text>
          <Text style={styles.statLabel}>Con cuestionario</Text>
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal editar */}
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
              <View style={[styles.modalAvatar, { backgroundColor: getAvatarColor(editing?.id || 0) }]}>
                <Text style={styles.modalAvatarText}>{getInitials(editing?.name)}</Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>Editar usuario</Text>
                <Text style={styles.modalSubtitle}>{editing?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Nombre *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre completo"
                placeholderTextColor="#ccc"
              />
            </View>

            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Correo electrónico"
                placeholderTextColor="#ccc"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Teléfono</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Teléfono"
                placeholderTextColor="#ccc"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Guardar cambios</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
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
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '900', color: '#E85D04' },
  statLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#eee', marginVertical: 4 },

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
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  info: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#aaa', marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  userPhone: { fontSize: 12, color: '#aaa' },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  roleBadgeAdmin: { backgroundColor: '#fff3e0' },
  roleBadgeUser: { backgroundColor: '#f0f0f0' },
  roleText: { fontSize: 11, fontWeight: '700' },
  roleTextAdmin: { color: '#E85D04' },
  roleTextUser: { color: '#888' },

  /* Botones acción */
  actions: { flexDirection: 'column', gap: 8 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  modalAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  modalSubtitle: { fontSize: 13, color: '#aaa', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 20 },

  /* Inputs */
  label: { fontSize: 12, color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#eee',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },

  /* Botones modal */
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#E85D04',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#E85D04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText: { color: '#aaa', fontSize: 15, fontWeight: '600' },
});

export default UsersTab;