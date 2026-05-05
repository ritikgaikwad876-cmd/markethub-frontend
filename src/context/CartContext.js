import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addItemToCart,
  fetchMyCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from '../api/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [] });
      return;
    }

    try {
      setLoading(true);
      const data = await fetchMyCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const data = await addItemToCart(productId, quantity);
    setCart(data.cart);
    return data.cart;
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const data = await updateCartItemQuantity(productId, quantity);
    setCart(data.cart);
    return data.cart;
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const data = await removeItemFromCart(productId);
    setCart(data.cart);
    return data.cart;
  }, []);

  const clearCartLocal = useCallback(() => {
    setCart({ items: [] });
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCartLocal,
    }),
    [cart, loading, refreshCart, addToCart, updateQuantity, removeFromCart, clearCartLocal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
};
