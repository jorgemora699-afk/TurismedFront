import client from './client';

export const getRecommendations = async (userId) => {
  const response = await client.get(`/recommendations/${userId}`);

  return {
    success: response.data.success,
    data: response.data.data.recommendations
  };
};

export const getAllPlaces = async () => {
  const response = await client.get('/places');
  return response.data;
};