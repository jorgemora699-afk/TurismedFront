import client from './client';

export const getRecommendations = async (userId) => {
  try {
    const response = await client.get(`/recommendations/${userId}`);
    return {
      success: response.data.success,
      data: response.data.data.recommendations
    };
  } catch (error) {
    // Muestra en consola qué está fallando realmente
    console.log('getRecommendations error:', error.response?.status, error.response?.data);
    return { success: false, data: [] };
  }
};

export const getAllPlaces = async () => {
  const response = await client.get('/places');
  return response.data;
};