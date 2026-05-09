import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fetchProducts } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const LOCATION_CACHE_KEY = 'marketHubDeliveryLocation';
const LOCATION_CACHE_MAX_AGE = 1000 * 60 * 60 * 6;

const formatStateCode = (value) => {
  if (!value) {
    return '';
  }

  const normalized = String(value).trim();

  const knownCodes = {
    'andaman and nicobar islands': 'AN',
    'andhra pradesh': 'AP',
    'arunachal pradesh': 'AR',
    assam: 'AS',
    bihar: 'BR',
    chandigarh: 'CH',
    chhattisgarh: 'CG',
    'dadra and nagar haveli and daman and diu': 'DN',
    delhi: 'DL',
    goa: 'GA',
    gujarat: 'GJ',
    haryana: 'HR',
    'himachal pradesh': 'HP',
    'jammu and kashmir': 'JK',
    jharkhand: 'JH',
    karnataka: 'KA',
    kerala: 'KL',
    ladakh: 'LA',
    lakshadweep: 'LD',
    'madhya pradesh': 'MP',
    maharashtra: 'MH',
    manipur: 'MN',
    meghalaya: 'ML',
    mizoram: 'MZ',
    nagaland: 'NL',
    odisha: 'OD',
    puducherry: 'PY',
    punjab: 'PB',
    rajasthan: 'RJ',
    sikkim: 'SK',
    'tamil nadu': 'TN',
    telangana: 'TS',
    tripura: 'TR',
    'uttar pradesh': 'UP',
    uttarakhand: 'UK',
    'west bengal': 'WB',
  };

  const directMatch = knownCodes[normalized.toLowerCase()];
  if (directMatch) {
    return directMatch;
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return normalized.slice(0, 2).toUpperCase();
  }

  return parts.map((part) => part[0]).join('').slice(0, 3).toUpperCase();
};

const parseLocationLabel = (address = {}) => {
  const city =
    address.city ||
    address.town ||
    address.county ||
    address.state_district ||
    address.village ||
    address.suburb;
  const region = address.state || address.region;

  if (!city && !region) {
    return 'Location unavailable';
  }

  if (!city) {
    return region;
  }

  if (!region) {
    return city;
  }

  return `${city}, ${formatStateCode(region)}`;
};

const readCachedLocation = () => {
  try {
    const savedValue = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!savedValue) {
      return null;
    }

    const parsedValue = JSON.parse(savedValue);
    if (!parsedValue?.label || !parsedValue?.savedAt) {
      return null;
    }

    if (Date.now() - parsedValue.savedAt > LOCATION_CACHE_MAX_AGE) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }

    return parsedValue.label;
  } catch (error) {
    return null;
  }
};

const saveCachedLocation = (label) => {
  try {
    localStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({
        label,
        savedAt: Date.now(),
      }),
    );
  } catch (error) {
    // Ignore localStorage write failures.
  }
};

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
  const [deliveryLabel, setDeliveryLabel] = useState(() => readCachedLocation() || 'Detecting location...');

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

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setDeliveryLabel('Location unavailable');
      return undefined;
    }

    let isMounted = true;

    const applyLabel = (value) => {
      if (!isMounted) {
        return;
      }

      setDeliveryLabel(value);
    };

    const fetchPlaceFromCoordinates = async (latitude, longitude) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          },
        );

        if (!response.ok) {
          throw new Error('Reverse geocoding failed');
        }

        const result = await response.json();
        const nextLabel = parseLocationLabel(result?.address);

        applyLabel(nextLabel);

        if (nextLabel !== 'Location unavailable') {
          saveCachedLocation(nextLabel);
        }
      } catch (error) {
        const cachedLabel = readCachedLocation();
        applyLabel(cachedLabel || 'Location unavailable');
      }
    };

    const requestCurrentPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchPlaceFromCoordinates(position.coords.latitude, position.coords.longitude);
        },
        () => {
          applyLabel('Location unavailable');
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 1000 * 60 * 15,
        },
      );
    };

    const initializeLocation = async () => {
      try {
        if (!navigator.permissions?.query) {
          requestCurrentPosition();
          return;
        }

        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

        if (!isMounted) {
          return;
        }

        if (permissionStatus.state === 'denied') {
          applyLabel('Location unavailable');
          return;
        }

        requestCurrentPosition();
      } catch (error) {
        requestCurrentPosition();
      }
    };

    initializeLocation();

    return () => {
      isMounted = false;
    };
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
            d="M14.92 4.607a.75.75 0 0 1 .162 1.03 7.25 7.25 0 1 0 3.281 8.308.75.75 0 1 1 1.446.394 8.75 8.75 0 1 1-3.96-10.056.75.75 0 0 1-.93 1.324Z"
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
            d="M12 4.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V5.5a.75.75 0 0 1 .75-.75Zm0 11.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V17a.75.75 0 0 1 .75-.75Zm7.25-5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5h1.5Zm-13 0a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5h1.5Zm10.127-4.377a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 0 1-1.06-1.06l1.06-1.061Zm-8.754 8.754a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 1 1-1.06-1.06l1.06-1.061Zm9.814 1.06a.75.75 0 0 1 0 1.061.75.75 0 0 1-1.06 0l-1.061-1.06a.75.75 0 0 1 1.06-1.061l1.061 1.06Zm-8.754-8.754a.75.75 0 1 1-1.06 1.06L6.812 7.935a.75.75 0 0 1 1.06-1.06l1.061 1.06ZM12 8.25A3.75 3.75 0 1 1 8.25 12 3.754 3.754 0 0 1 12 8.25Zm0 1.5A2.25 2.25 0 1 0 14.25 12 2.253 2.253 0 0 0 12 9.75Z"
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
        <div className="nav-brand-group">
          <Link to="/" className="brand" onClick={closeMenu}>
            <span className="brand-mark">Market</span>Hub
          </Link>
          <div className="nav-delivery" aria-label="Delivery location">
            <span className="nav-delivery-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="nav-delivery-icon-svg">
                <path
                  d="M12 2.75a6.75 6.75 0 0 1 6.75 6.75c0 4.718-5.202 10.455-6.225 11.538a.75.75 0 0 1-1.09 0C10.452 19.955 5.25 14.218 5.25 9.5A6.75 6.75 0 0 1 12 2.75Zm0 1.5A5.25 5.25 0 0 0 6.75 9.5c0 3.327 3.422 7.738 5.25 9.8 1.828-2.062 5.25-6.473 5.25-9.8A5.25 5.25 0 0 0 12 4.25Zm0 2.5A2.75 2.75 0 1 1 9.25 9.5 2.753 2.753 0 0 1 12 6.75Zm0 1.5A1.25 1.25 0 1 0 13.25 9.5 1.251 1.251 0 0 0 12 8.25Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <div className="nav-delivery-text">
              <span className="nav-delivery-label">Deliver to</span>
              <span className="nav-delivery-value">{deliveryLabel}</span>
            </div>
          </div>
        </div>

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
