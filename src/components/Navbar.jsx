import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fetchProducts } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const cartCount = (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        setProducts([]);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setSearchTerm(queryParams.get('search') || '');
    setShowSuggestions(false);
  }, [location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedSearch = searchTerm.trim().toLowerCase();
  const suggestions = trimmedSearch
    ? products.filter((product) => String(product.name || '').toLowerCase().includes(trimmedSearch)).slice(0, 5)
    : [];

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const value = searchTerm.trim();

    if (!value) {
      navigate('/products');
      setShowSuggestions(false);
      closeMenu();
      return;
    }

    navigate(`/products?search=${encodeURIComponent(value)}`);
    setShowSuggestions(false);
    closeMenu();
  };

  const handleSuggestionClick = (productId) => {
    navigate(`/products/${productId}`);
    setShowSuggestions(false);
    closeMenu();
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark">Market</span>Hub
        </Link>

        <button
          type="button"
          className="menu-toggle"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? 'Close' : 'Menu'}
        </button>

        <nav className={`main-nav ${isMenuOpen ? 'is-open' : ''}`}>
          <div className="nav-search" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="nav-search-form">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setShowSuggestions(Boolean(event.target.value.trim()));
                }}
                onFocus={() => setShowSuggestions(Boolean(searchTerm.trim()))}
                placeholder="Search products"
                aria-label="Search products"
                className="nav-search-input"
                autoComplete="off"
              />
            </form>

            {showSuggestions && suggestions.length > 0 ? (
              <div className="nav-search-dropdown">
                {suggestions.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    className="nav-search-suggestion"
                    onMouseDown={() => handleSuggestionClick(product._id)}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/products" onClick={closeMenu}>Products</NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
              <NavLink to="/register" onClick={closeMenu}>Register</NavLink>
            </>
          ) : isAdmin ? (
            <>
              <NavLink to="/admin" onClick={closeMenu}>Admin Dashboard</NavLink>
              <NavLink to="/admin/orders" onClick={closeMenu}>Manage Orders</NavLink>
              <div className="nav-user-block">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/cart" onClick={closeMenu}>Cart ({cartCount})</NavLink>
              <NavLink to="/orders" onClick={closeMenu}>Orders</NavLink>
              <div className="nav-user-block">
                <span className="user-chip">Hi, {user?.name?.split(' ')[0] || 'User'}</span>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
