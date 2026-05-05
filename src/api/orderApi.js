import apiClient from './apiClient';

export const placeOrder = async ({ shippingAddress, shippingDetails, paymentMethod = 'COD' }) => {
  const response = await apiClient.post('/orders', { shippingAddress, shippingDetails, paymentMethod });
  return response.data;
};

export const fetchMyOrders = async () => {
  const response = await apiClient.get('/orders/my');
  return response.data;
};

export const fetchAllOrders = async () => {
  const response = await apiClient.get('/orders');
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await apiClient.put(`/orders/${orderId}`, { status });
  return response.data;
};

export const createRazorpayOrder = async () => {
  const response = await apiClient.post('/payment/create-order');
  return response.data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const response = await apiClient.post('/payment/verify', paymentData);
  return response.data;
};
