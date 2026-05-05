import apiClient from './apiClient';

export const fetchProducts = async () => {
  const response = await apiClient.get('/products');
  return response.data;
};

export const fetchProductById = async (productId) => {
  const response = await apiClient.get(`/products/${productId}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await apiClient.post('/products', productData);
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await apiClient.put(`/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await apiClient.delete(`/products/${productId}`);
  return response.data;
};

export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post('/products/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
