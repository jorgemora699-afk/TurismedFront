import client from './client';

export const getActivePromotions = async () => {
  const response = await client.get('/promotions/active');
  return response.data;
};

export const redeemPromotion = async (code, userId) => {
  const response = await client.post('/promotions/redeem', {
    code: String(code),
    user_id: parseInt(userId),
  });
  return response.data;
};

export const getUserPromotions = async (userId) => {
  const response = await client.get(`/promotions/user/${userId}`);
  return response.data;
};