import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchProducts } from '../api/productApi';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [addingId, setAddingId] = useState('');

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoadingFeatured(true);
        const products = await fetchProducts();
        setFeaturedProducts((products || []).slice(0, 12));
      } catch (error) {
        setFeaturedError('Unable to load featured products right now.');
      } finally {
        setLoadingFeatured(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    try {
      setAddingId(productId);
      await addToCart(productId, 1);
      toast.success('Item added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAddingId('');
    }
  };

  return (
    <section className="home-page">
      <div className="hero hero-split">
        <div className="hero-copy">
          <p className="hero-badge">Farm Fresh Grocery Platform</p>
          <h1>Fresh groceries delivered with MarketHub</h1>
          <p>
            Browse vegetables, fruits, dairy, and essentials from our latest catalog.
            Trusted quality, best prices, and doorstep delivery.
          </p>

          <div className="hero-actions">
            <Link to="/products" className="btn-primary">Explore Products</Link>
            <Link to="/cart" className="btn-secondary">Go to Cart</Link>
          </div>
        </div>

        <div className="hero-media">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="hero-main-image"
          />
          <img
            src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80"
            alt=""
            className="hero-float-image"
          />
        </div>
      </div>

      <section className="category-section">
        <h2 className="section-title">Shop by Category</h2>

        <div className="category-grid">
          <Link
            to="/products?category=vegetables"
            className="category-card category-veg"
          >
            <h3>Vegetables</h3>
            <p>Leafy greens, roots, and daily cooking essentials.</p>
          </Link>

          <Link
            to="/products?category=fruits"
            className="category-card category-fruit"
          >
            <h3>Fruits</h3>
            <p>Seasonal fresh fruits sourced from trusted farms.</p>
          </Link>

          <Link
            to="/products?category=dairy"
            className="category-card category-dairy"
          >
            <h3>Dairy</h3>
            <p>Milk, paneer, curd and protein-rich daily staples.</p>
          </Link>
        </div>
      </section>

      <section className="featured-section">
        <h2 className="section-title">Featured Products</h2>

        {loadingFeatured ? (
          <p className="status-msg">Loading featured products...</p>
        ) : featuredError ? (
          <p className="status-msg error">{featuredError}</p>
        ) : featuredProducts.length === 0 ? (
          <p className="status-msg">No featured products available.</p>
        ) : (
          <div className="product-grid featured-product-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                adding={addingId === product._id}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      <div className="quick-grid">
        <article className="quick-card">
          <h3>Fast Delivery</h3>
          <p>
            Receive your groceries on time with safe packaging and quality checks.
          </p>
        </article>

        <article className="quick-card">
          <h3>Daily Essentials</h3>
          <p>
            Get vegetables, fruits, dairy and household essentials in one place.
          </p>
        </article>

        <article className="quick-card">
          <h3>Easy Ordering</h3>
          <p>
            Add to cart, place order, and track history with a simple shopping flow.
          </p>
        </article>
      </div>
    </section>
  );
};

export default Home;
