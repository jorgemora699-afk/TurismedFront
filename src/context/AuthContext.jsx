import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from '../api/authApi';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al abrir la app, verificar si hay sesión guardada
  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        try {
          // Pasar el token explícitamente porque aún no está en el estado
          const response = await client.get('/users/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          if (response.data.success) {
            setToken(storedToken);
            setUser(parsedUser);
          } else {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
          }
        } catch (error) {
          // 401 = token expirado, 404 = usuario eliminado
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.log('Error cargando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // ✅ Sin try/catch — authApi ya maneja todo
    const response = await loginUser(email, password);
    if (response.success) {
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    return response; // ← siempre retorna, sea éxito o error
  };

  const register = async (name, email, password, phone) => {
    // ✅ Sin try/catch — authApi ya maneja todo
    const response = await registerUser(name, email, password, phone);
    return response;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);