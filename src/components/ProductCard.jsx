import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ProductCard = ({ product, adding, onAddToCart }) => {
  const navigate = useNavigate();
  const stock = Number(product.stock ?? 0);
  const originalPrice = Number(product.price ?? 0);
  const discountedPrice = Number(product.discountPrice ?? 0);
  const hasDiscount = discountedPrice > 0 && discountedPrice < originalPrice;
  const effectivePrice = hasDiscount ? discountedPrice : originalPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0;

  let stockLabel = 'In Stock';
  let stockClass = 'stock-in';

  if (stock <= 0) {
    stockLabel = 'Out of Stock';
    stockClass = 'stock-out';
  } else if (stock <= 5) {
    stockLabel = 'Low Stock';
    stockClass = 'stock-low';
  }

  const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img
          src={product.image || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="product-image"
          onClick={() => navigate(`/products/${product._id}`)}
          onError={(event) => {
            event.target.src = 'https://via.placeholder.com/300';
          }}
        />

        <span className="price-badge">{formatPrice(effectivePrice)}</span>
        {hasDiscount ? (
          <span className="stock-chip discount-chip">
            {discountPercent}% OFF
          </span>
        ) : null}
        <span className={`stock-chip ${stockClass}`}>{stockLabel}</span>
      </div>

      <div className="product-content">
        <p className="product-category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">
          {formatPrice(effectivePrice)}
          {hasDiscount ? (
            <span className="product-price-original">
              {formatPrice(originalPrice)}
            </span>
          ) : null}
        </p>
      </div>

      <div className="product-card-actions">
        <Link to={`/products/${product._id}`} className="btn-secondary">
          View Details
        </Link>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onAddToCart(product._id)}
          disabled={adding}
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
