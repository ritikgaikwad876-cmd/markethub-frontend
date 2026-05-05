import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchProducts } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

const normalizeText = (text) => {
  const map = {
    tamatar: 'tomato',
    aloo: 'potato',
    pyaz: 'onion',
    doodh: 'milk',
    kela: 'banana',
    seb: 'apple',
  };

  const lower = String(text || '').toLowerCase().trim();
  return map[lower] || lower;
};

const Product = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category') || '';
  const searchQuery = queryParams.get('search') || '';

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await fetchProducts();
        const normalizedSearch = normalizeText(searchQuery);
        const filteredProducts = data.filter((product) => {
          const productName = String(product.name || '').toLowerCase();
          const matchesCategory = !category || (product.category && product.category.toLowerCase() === category.toLowerCase());
          const matchesSearch = !normalizedSearch || productName.includes(normalizedSearch) || normalizedSearch.includes(productName);

          return matchesCategory && matchesSearch;
        });

        setProducts(filteredProducts);
      } catch (err) {
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [category, searchQuery]);

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/products' } });
      return;
    }

    try {
      setAddingId(productId);
      await addToCart(productId, 1);
      toast.success('Item added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAddingId('');
    }
  };

  const sortedProducts = [...products];

  if (sortOrder === 'low-to-high') {
    sortedProducts.sort((a, b) => a.price - b.price);
  }

  if (sortOrder === 'high-to-low') {
    sortedProducts.sort((a, b) => b.price - a.price);
  }

  if (loading) {
    return <p className="status-msg">Loading products...</p>;
  }

  if (error) {
    return <p className="status-msg error">{error}</p>;
  }

  return (
    <section>
      <h2 className="section-title">
        {category ? `${category.toUpperCase()} Products` : 'Available Products'}
      </h2>

      {searchQuery ? (
        <p className="product-category" style={{ marginBottom: '1rem' }}>
          Search: {searchQuery}
        </p>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="summary-select"
          style={{ width: '220px', marginBottom: 0 }}
        >
          <option value="">Sort by Price</option>
          <option value="low-to-high">Low to High</option>
          <option value="high-to-low">High to Low</option>
        </select>
      </div>

      {sortedProducts.length === 0 ? (
        <p className="status-msg">No products found.</p>
      ) : (
        <div className="product-grid">
          {sortedProducts.map((item) => (
            <ProductCard
              key={item._id}
              product={item}
              adding={addingId === item._id}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Product;
