import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fetchProducts } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { cart } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
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
    setIsMenuOpen(false);
  }, [location.pathname]);

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

  const themeToggleButton = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-pressed={isDarkMode}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="theme-toggle-icon"
        >
          <path
            d="M12 4.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V5.5a.75.75 0 0 1 .75-.75Zm0 11.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V17a.75.75 0 0 1 .75-.75Zm7.25-5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5h1.5Zm-13 0a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5h1.5Zm10.127-4.377a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 0 1-1.06-1.06l1.06-1.061Zm-8.754 8.754a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 1 1-1.06-1.06l1.06-1.061Zm9.814 1.06a.75.75 0 0 1 0 1.061.75.75 0 0 1-1.06 0l-1.061-1.06a.75.75 0 0 1 1.06-1.061l1.061 1.06Zm-8.754-8.754a.75.75 0 1 1-1.06 1.06L6.812 7.935a.75.75 0 0 1 1.06-1.06l1.061 1.06ZM12 8.25A3.75 3.75 0 1 1 8.25 12 3.754 3.754 0 0 1 12 8.25Zm0 1.5A2.25 2.25 0 1 0 14.25 12 2.253 2.253 0 0 0 12 9.75Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="theme-toggle-icon"
        >
          <path
            d="M14.92 4.607a.75.75 0 0 1 .162 1.03 7.25 7.25 0 1 0 3.281 8.308.75.75 0 1 1 1.446.394 8.75 8.75 0 1 1-3.96-10.056.75.75 0 0 1-.93 1.324Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );

  const rightSideContent = !isAuthenticated ? (
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
  );

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
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
        >
          <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
          <span className={`menu-toggle-box ${isMenuOpen ? 'is-open' : ''}`} aria-hidden="true">
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
            <span className="menu-toggle-bar" />
          </span>
        </button>

        <nav id="primary-navigation" className={`main-nav ${isMenuOpen ? 'is-open' : ''}`}>
          <div className="nav-primary">
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

            <div className="nav-links">
              <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
              <NavLink to="/products" onClick={closeMenu}>Products</NavLink>
            </div>
          </div>

          <div className="nav-right-group">
            {rightSideContent}
            {themeToggleButton}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
