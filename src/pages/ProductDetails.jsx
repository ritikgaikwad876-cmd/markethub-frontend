import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchProductById } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // Fetch selected product details using route param id.
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        setProduct(data);
      } catch (err) {
        setError('Could not load product details.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id, quantity);
      toast.success('Item added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <p className="status-msg">Loading product details...</p>;
  }

  if (error) {
    return <p className="status-msg error">{error}</p>;
  }

  if (!product) {
    return <p className="status-msg">Product not found.</p>;
  }

  return (
    <section className="details-wrapper">
      <img
        src={product.image || 'https://via.placeholder.com/500x350?text=Product'}
        alt={product.name}
        className="details-image"
      />

      <div className="details-content">
        <h2>{product.name}</h2>
        <p className="product-category">Category: {product.category}</p>
        <p className="product-price">Rs. {product.price}</p>
        <p className="details-description">{product.description}</p>
        <p className="details-stock">Stock: {product.stock}</p>

        <div className="quantity-row">
          <label htmlFor="quantity">Quantity:</label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            className="qty-input"
          />
        </div>

        <div className="details-actions">
          <button className="btn-primary" type="button" onClick={handleAddToCart} disabled={adding}>
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
          <Link to="/products" className="btn-secondary">Back to Products</Link>
        </div>
      </div>
    </section>
  );
};

export default ProductDetails;
