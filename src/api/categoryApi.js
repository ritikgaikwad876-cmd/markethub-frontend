import apiClient from './apiClient';

export const fetchCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

export const createCategory = async (name) => {
  const response = await apiClient.post('/categories', { name });
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await apiClient.delete(`/categories/${categoryId}`);
  return response.data;
};
