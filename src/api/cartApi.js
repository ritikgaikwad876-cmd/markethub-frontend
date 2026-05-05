import apiClient from './apiClient';

export const fetchMyCart = async () => {
  const response = await apiClient.get('/cart');
  return response.data;
};

export const addItemToCart = async (productId, quantity = 1) => {
  const response = await apiClient.post('/cart/items', { productId, quantity });
  return response.data;
};

export const updateCartItemQuantity = async (productId, quantity) => {
  const response = await apiClient.patch(`/cart/items/${productId}`, { quantity });
  return response.data;
};

export const removeItemFromCart = async (productId) => {
  const response = await apiClient.delete(`/cart/items/${productId}`);
  return response.data;
};
