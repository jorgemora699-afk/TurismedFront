import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from '../api/authApi';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser  = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Pasar el token explícitamente porque aún no está en el estado
          const response = await client.get('/users/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (response.data.success) {
            setToken(storedToken);
            // ✅ FIX: usar datos frescos del servidor (no el snapshot guardado)
            //    Así has_completed_questionnaire siempre refleja el estado real
            const freshUser = response.data.data;
            setUser(freshUser);
            await AsyncStorage.setItem('user', JSON.stringify(freshUser));
          } else {
            await AsyncStorage.multiRemove(['token', 'user']);
          }
        } catch {
          // 401 = token expirado, 404 = usuario eliminado
          await AsyncStorage.multiRemove(['token', 'user']);
        }
      }
    } catch (error) {
      console.log('Error cargando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: refresca el usuario desde el servidor y actualiza el contexto
  //    Llamar tras acciones que cambien el estado del usuario en el backend
  //    (p. ej. completar el cuestionario)
  const refreshUser = async () => {
    try {
      const response = await client.get('/users/me');
      if (response.data.success) {
        const freshUser = response.data.data;
        setUser(freshUser);
        await AsyncStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (error) {
      console.log('Error refrescando usuario:', error);
    }
  };

  const login = async (email, password) => {
    const response = await loginUser(email, password);
    if (response.success) {
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    return response;
  };

  const register = async (name, email, password, phone) => {
    const response = await registerUser(name, email, password, phone);
    return response;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(['token', 'user']);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);