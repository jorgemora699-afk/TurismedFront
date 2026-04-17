import client from './client';

export const registerUser = async (name, email, password, phone) => {
  try {
    const response = await client.post('/users/register', { name, email, password, phone });
    return response.data;
  } catch (error) {
    if (error.response) {
      // El servidor respondió con error (400, 409, etc.)
      return error.response.data; // Retorna el body del error tal cual
    }
    // Sin respuesta — problema de red real
    return { success: false, message: 'No se pudo conectar con el servidor' };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await client.post('/users/login', { email, password });
    return response.data;
  } catch (error) {
    if (error.response) {
      // 401 → el servidor respondió, retorna su mensaje
      return error.response.data;
    }
    return { success: false, message: 'No se pudo conectar con el servidor' };
  }
};