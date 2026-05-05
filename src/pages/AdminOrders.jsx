import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchAllOrders, updateOrderStatus } from '../api/orderApi';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await fetchAllOrders();
        const nextOrders = Array.isArray(data) ? data : [];

        setOrders(nextOrders);
        setOrderStatuses(
          nextOrders.reduce((accumulator, order) => {
            accumulator[order._id] = order.status || 'pending';
            return accumulator;
          }, {})
        );
      } catch (err) {
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleOrderStatusChange = (orderId, status) => {
    setOrderStatuses((prev) => ({
      ...prev,
      [orderId]: status,
    }));
  };

  const handleOrderUpdate = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      setError('');
      setSuccess('');

      const response = await updateOrderStatus(orderId, orderStatuses[orderId] || 'pending');
      const updatedOrder = response.order || response.data || response;

      setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder : order)));
      setSuccess('Order status updated successfully.');
      toast.success('Order status updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') {
      return true;
    }

    return (order.status || 'pending') === statusFilter;
  });

  const closeOrderModal = () => {
    setSelectedOrder(null);
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="hero-badge admin-badge">Admin Orders</p>
          <h2 className="section-title">Manage Orders</h2>
          <p className="admin-subtitle">
            Review order history, monitor customer orders, and update delivery status.
          </p>
        </div>
        <Link to="/admin" className="btn-secondary">Back to Dashboard</Link>
      </div>

      {error ? <p className="status-msg error">{error}</p> : null}
      {success ? <p className="status-msg">{success}</p> : null}

      <section className="admin-panel">
        <div className="admin-list-header">
          <h3>Order History</h3>
          <span>{filteredOrders.length} of {orders.length} orders</span>
        </div>

        <div className="admin-filter-row">
          <button
            type="button"
            className={statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            type="button"
            className={statusFilter === 'delivered' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setStatusFilter('delivered')}
          >
            Delivered
          </button>
        </div>

        {loading ? (
          <p className="status-msg admin-loading-msg">
            <span className="admin-spinner" />
            Loading orders...
          </p>
        ) : null}
        {!loading && filteredOrders.length === 0 ? <p className="status-msg">No orders found</p> : null}

        <div className="admin-order-list">
          {filteredOrders.map((order) => (
            <article
              key={order._id}
              className="admin-order-item admin-order-clickable"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOrder(order)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedOrder(order);
                }
              }}
            >
              <div className="admin-order-meta">
                <h4>Order #{order._id.slice(-6).toUpperCase()}</h4>
                <p>User: {order.user?.name || order.shippingDetails?.name || 'Customer'}</p>
                <p>Price: Rs. {Number(order.totalAmount || 0).toFixed(2)}</p>
                <p>Status: {order.status || 'pending'}</p>
                <p>Placed on: {new Date(order.createdAt).toLocaleString()}</p>

                {Array.isArray(order.items) && order.items.length > 0 ? (
                  <ul className="order-items">
                    {order.items.map((item, index) => (
                      <li key={`${order._id}-${index}`}>
                        {(item.product && item.product.name) || 'Product'} x {item.quantity} - Rs. {item.price * item.quantity}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="admin-order-controls" onClick={(event) => event.stopPropagation()}>
                <select
                  value={orderStatuses[order._id] || order.status || 'pending'}
                  onChange={(event) => handleOrderStatusChange(order._id, event.target.value)}
                  className="summary-select"
                >
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                </select>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleOrderUpdate(order._id)}
                  disabled={updatingOrderId === order._id}
                >
                  {updatingOrderId === order._id ? (
                    <>
                      <span className="admin-spinner admin-spinner-light" />
                      Updating...
                    </>
                  ) : 'Update'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedOrder ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={closeOrderModal}>
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="order-details-title" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <p className="product-category">Order Details</p>
                <h3 id="order-details-title">Order #{selectedOrder._id.slice(-6).toUpperCase()}</h3>
              </div>
              <button type="button" className="btn-secondary" onClick={closeOrderModal}>
                Close
              </button>
            </div>

            <div className="admin-modal-content">
              <p>
                <strong>User:</strong> {selectedOrder.user?.name || selectedOrder.shippingDetails?.name || 'Customer'}
              </p>
              <p>
                <strong>Total Price:</strong> Rs. {Number(selectedOrder.totalPrice ?? selectedOrder.totalAmount ?? 0).toFixed(2)}
              </p>
              <p>
                <strong>Status:</strong> {selectedOrder.status || 'pending'}
              </p>

              <div>
                <h4>Order Items</h4>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <ul className="admin-modal-items">
                    {selectedOrder.items.map((item, index) => (
                      <li key={`${selectedOrder._id}-modal-${index}`}>
                        <span>{item.product?.name || 'Product'}</span>
                        <strong>Qty: {item.quantity}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="status-msg">No items found for this order.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};

export default AdminOrders;
