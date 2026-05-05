import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyOrders } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await fetchMyOrders();
        setOrders(data);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load orders';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated]);

  if (loading) {
    return <p className="status-msg">Loading orders...</p>;
  }

  if (error) {
    return <p className="status-msg error">{error}</p>;
  }

  return (
    <section>
      <h2 className="section-title">Order History</h2>

      {orders.length === 0 ? (
        <p className="status-msg">No orders found. <Link to="/products">Start shopping</Link></p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <article key={order._id} className="order-card">
              <div className="order-head">
                <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                <span className="order-status">{order.status}</span>
              </div>

              <p className="order-meta">Placed on: {new Date(order.createdAt).toLocaleString()}</p>
              <p className="order-meta">Name: {order.shippingDetails?.name || 'N/A'}</p>
              <p className="order-meta">Phone: {order.shippingDetails?.phone || 'N/A'}</p>
              <p className="order-meta">Address: {order.shippingDetails?.address || order.shippingAddress}</p>
              <p className="order-meta">Payment: {order.paymentMethod}</p>

              <ul className="order-items">
                {order.items.map((item, index) => (
                  <li key={`${order._id}-${index}`}>
                    {(item.product && item.product.name) || 'Product'} x {item.quantity} - Rs. {item.price * item.quantity}
                  </li>
                ))}
              </ul>

              <p className="order-total">Total: Rs. {order.totalAmount}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Orders;
