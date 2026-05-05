import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const formatDate = (value) => {
  if (!value) {
    return new Date().toLocaleString();
  }

  return new Date(value).toLocaleString();
};

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order || null;

  return (
    <section className="auth-card" style={{ maxWidth: '720px' }}>
      <p className="hero-badge admin-badge">Order Confirmed</p>
      <h2 className="section-title">Your order was placed successfully</h2>
      <p className="details-description">
        We have received your order and started processing it. You can track the full details from your orders page.
      </p>

      <div className="order-card" style={{ marginTop: '1rem' }}>
        <div className="order-head">
          <h3>
            Order {order?._id ? `#${order._id.slice(-6).toUpperCase()}` : 'Summary'}
          </h3>
          <span className="order-status">{order?.status || 'placed'}</span>
        </div>

        <p className="order-meta">Placed on: {formatDate(order?.createdAt)}</p>
        <p className="order-meta">Shipping: {order?.shippingAddress || 'Saved delivery address'}</p>
        <p className="order-meta">Payment: {order?.paymentMethod || 'COD'}</p>

        {Array.isArray(order?.items) && order.items.length > 0 ? (
          <ul className="order-items">
            {order.items.map((item, index) => (
              <li key={`${order._id || 'order'}-${index}`}>
                {(item.product && item.product.name) || item.name || 'Product'} x {item.quantity} - Rs. {item.price * item.quantity}
              </li>
            ))}
          </ul>
        ) : (
          <p className="order-meta">Your order items are now available in the orders page.</p>
        )}

        <p className="order-total">Total: Rs. {order?.totalAmount || 0}</p>
      </div>

      <div className="details-actions">
        <Link to="/orders" className="btn-primary">Go to Orders</Link>
        <Link to="/products" className="btn-secondary">Continue Shopping</Link>
      </div>
    </section>
  );
};

export default OrderSuccess;
