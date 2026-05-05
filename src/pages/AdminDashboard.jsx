import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  uploadProductImage,
} from '../api/productApi';
import { fetchAllOrders } from '../api/orderApi';
import { fetchAllUsers } from '../api/userApi';


const initialForm = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  category: 'vegetables',
  image: '',
  stock: '',
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    revenue: 0,
    products: 0,
    orders: 0,
    users: 0,
  });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [productsData, ordersData, usersData] = await Promise.all([
        fetchProducts(),
        fetchAllOrders(),
        fetchAllUsers(),
      ]);

      const nextProducts = Array.isArray(productsData) ? productsData : [];
      const nextOrders = Array.isArray(ordersData) ? ordersData : [];
      const nextUsers = Array.isArray(usersData) ? usersData : [];
      const totalRevenue = nextOrders.reduce(
        (sum, order) => sum + Number(order.totalPrice ?? order.totalAmount ?? 0),
        0
      );

      setProducts(nextProducts);
      setOrders(nextOrders);
      setStats({
        revenue: totalRevenue,
        products: nextProducts.length,
        orders: nextOrders.length,
        users: nextUsers.length,
      });
    } catch (err) {
      setError('Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const recentOrders = useMemo(
    () => orders.slice(0, 4),
    [orders]
  );

  const orderChartData = useMemo(
    () =>
      orders
        .slice(0, 8)
        .map((order) => ({
          orderId: `#${order._id.slice(-6).toUpperCase()}`,
          totalPrice: Number(order.totalPrice ?? order.totalAmount ?? 0),
        }))
        .reverse(),
    [orders]
  );

  const topSellingProducts = useMemo(() => {
    const salesByProduct = orders.reduce((accumulator, order) => {
      (order.items || []).forEach((item) => {
        const productId = item.product?._id || item.product;

        if (!productId) {
          return;
        }

        if (!accumulator[productId]) {
          accumulator[productId] = {
            id: productId,
            name: item.product?.name || 'Product',
            quantity: 0,
            revenue: 0,
          };
        }

        accumulator[productId].quantity += Number(item.quantity || 0);
        accumulator[productId].revenue += Number(item.price || 0) * Number(item.quantity || 0);
      });

      return accumulator;
    }, {});

    return Object.values(salesByProduct)
      .sort((first, second) => {
        if (second.quantity !== first.quantity) {
          return second.quantity - first.quantity;
        }

        return second.revenue - first.revenue;
      })
      .slice(0, 5);
  }, [orders]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase();
    const searchedProducts = normalizedSearch
      ? products.filter((product) =>
        String(product.name || '').toLowerCase().includes(normalizedSearch)
      )
      : products;

    if (productSort === 'price-low-high') {
      return [...searchedProducts].sort((first, second) => Number(first.price || 0) - Number(second.price || 0));
    }

    return searchedProducts;
  }, [products, productSearch, productSort]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingImage(true);
      setError('');
      setSuccess('');

      const response = await uploadProductImage(file);

      setForm((prev) => ({
        ...prev,
        image: response.imageUrl || '',
      }));
      setSuccess('Image uploaded successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId('');
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      discountPrice: String(product.discountPrice ?? ''),
      category: product.category || 'vegetables',
      image: product.image || '',
      stock: String(product.stock ?? 0),
    });
    setEditingId(product._id);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    const shouldDelete = window.confirm('Delete this product?');

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingProductId(productId);
      setError('');
      setSuccess('');
      await deleteProduct(productId);

      setProducts((prev) => prev.filter((item) => item._id !== productId));
      setStats((prev) => ({ ...prev, products: Math.max(prev.products - 1, 0) }));

      if (editingId === productId) {
        resetForm();
      }

      setSuccess('Product deleted successfully.');
      toast.success('Product deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeletingProductId('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.description || form.price === '' || !form.category || form.stock === '') {
      setError('Name, description, price, category, and stock are required.');
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
      stock: Number(form.stock),
    };

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editingId) {
        const response = await updateProduct(editingId, payload);
        const updatedProduct = response.product || response.data || response;
        setProducts((prev) => prev.map((item) => (item._id === editingId ? updatedProduct : item)));
        setSuccess('Product updated successfully.');
      } else {
        const response = await createProduct(payload);
        const createdProduct = response.product || response.data || response;
        setProducts((prev) => [createdProduct, ...prev]);
        setStats((prev) => ({ ...prev, products: prev.products + 1 }));
        setSuccess('Product added successfully.');
        toast.success('Product added successfully');
      }

      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="hero-badge admin-badge">Admin Panel</p>
          <h2 className="section-title">Dashboard Overview</h2>
          <p className="admin-subtitle">
            Monitor store activity and manage products from one place.
          </p>
        </div>
        <Link to="/products" className="btn-secondary">View Store</Link>
      </div>

      {error ? <p className="status-msg error">{error}</p> : null}
      {success ? <p className="status-msg">{success}</p> : null}
      {loading ? (
        <p className="status-msg admin-loading-msg">
          <span className="admin-spinner" />
          Loading dashboard data...
        </p>
      ) : null}

      <div className="admin-stats-grid">
        <article className="admin-stat-card">
          <p className="admin-stat-label">Revenue</p>
          <h3>{formatCurrency(stats.revenue)}</h3>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Orders</p>
          <h3>{stats.orders}</h3>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Products</p>
          <h3>{stats.products}</h3>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Users</p>
          <h3>{stats.users}</h3>
        </article>
      </div>

      <section className="admin-panel admin-chart-panel">
        <div className="admin-list-header">
          <h3>Order Revenue Chart</h3>
          <span>{orderChartData.length} recent orders</span>
        </div>

        {loading ? (
          <p className="status-msg admin-loading-msg">
            <span className="admin-spinner" />
            Loading chart data...
          </p>
        ) : orderChartData.length === 0 ? (
          <p className="status-msg">No order data available for charting yet.</p>
        ) : (
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe6dd" />
                <XAxis dataKey="orderId" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #dbe6dd',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Bar dataKey="totalPrice" fill="#0f7a42" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="admin-insights-grid">
        <section className="admin-panel">
          <div className="admin-list-header">
            <h3>Recent Orders</h3>
            <span>{orders.length} total</span>
          </div>

          {loading ? (
            <p className="status-msg admin-loading-msg">
              <span className="admin-spinner" />
              Loading recent orders...
            </p>
          ) : recentOrders.length === 0 ? (
            <p className="status-msg">No orders found</p>
          ) : (
            <div className="admin-insight-list">
              {recentOrders.map((order) => (
                <article key={order._id} className="admin-insight-item">
                  <div>
                    <h4>Order #{order._id.slice(-6).toUpperCase()}</h4>
                    <p>{order.user?.name || order.shippingDetails?.name || 'Customer'}</p>
                  </div>
                  <div className="admin-insight-meta">
                    <span className="admin-order-status-chip">{order.status || 'pending'}</span>
                    <strong>{formatCurrency(order.totalPrice ?? order.totalAmount)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-list-header">
            <h3>Top Selling Products</h3>
            <span>{topSellingProducts.length} ranked</span>
          </div>

          {loading ? (
            <p className="status-msg admin-loading-msg">
              <span className="admin-spinner" />
              Loading product sales...
            </p>
          ) : topSellingProducts.length === 0 ? (
            <p className="status-msg">No product sales data available yet.</p>
          ) : (
            <div className="admin-insight-list">
              {topSellingProducts.map((item, index) => (
                <article key={item.id} className="admin-insight-item">
                  <div>
                    <h4>{index + 1}. {item.name}</h4>
                    <p>{item.quantity} units sold</p>
                  </div>
                  <div className="admin-insight-meta">
                    <strong>{formatCurrency(item.revenue)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="admin-layout">
        <section className="admin-panel">
          <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>

          <form onSubmit={handleSubmit} className="admin-form">
            <label htmlFor="name">Product Name</label>
            <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required />

            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} rows="4" required />

            <div className="admin-form-grid">
              <div>
                <label htmlFor="price">Price</label>
                <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
              </div>

              <div>
                <label htmlFor="discountPrice">Discount Price</label>
                <input id="discountPrice" name="discountPrice" type="number" min="0" step="0.01" value={form.discountPrice} onChange={handleChange} placeholder="Optional" />
              </div>
            </div>

            <div className="admin-form-grid">
              <div>
                <label htmlFor="stock">Stock</label>
                <input id="stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
              </div>

              <div>
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={form.category} onChange={handleChange}>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="dairy">Dairy</option>
                  <option value="grocery">Grocery</option>
                </select>
              </div>
            </div>

            <label htmlFor="image">Image URL</label>
            <input id="image" name="image" type="url" value={form.image} onChange={handleChange} placeholder="https://..." />

            <label htmlFor="imageUpload">Upload Image</label>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />

            {uploadingImage ? <p className="product-category">Uploading image...</p> : null}

            {form.image ? (
              <div className="admin-image-preview">
                <img
                  src={form.image}
                  alt="Product preview"
                  className="admin-image-preview-thumb"
                />
              </div>
            ) : null}

            <div className="admin-form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="admin-spinner admin-spinner-light" />
                    Saving...
                  </>
                ) : editingId ? 'Update Product' : 'Add Product'}
              </button>
              {editingId ? (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-list-header">
            <h3>Product List</h3>
            <span>{filteredProducts.length} of {products.length} items</span>
          </div>

          <div className="admin-product-tools">
            <input
              type="search"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Search products by name"
              className="admin-search-input"
            />

            <select
              value={productSort}
              onChange={(event) => setProductSort(event.target.value)}
              className="admin-search-input admin-sort-select"
            >
              <option value="">Default Sort</option>
              <option value="price-low-high">Price: Low to High</option>
            </select>
          </div>

          {loading ? (
            <p className="status-msg admin-loading-msg">
              <span className="admin-spinner" />
              Loading products...
            </p>
          ) : null}
          {!loading && filteredProducts.length === 0 ? <p className="status-msg">No products found</p> : null}

          <div className="admin-product-list">
            {filteredProducts.map((product) => {
              const hasDiscount = product.discountPrice !== null && product.discountPrice !== undefined && Number(product.discountPrice) > 0;
              const stockCount = Number(product.stock ?? 0);
              const isLowStock = stockCount < 20;

              return (
                <article key={product._id} className="admin-product-item">
                  <img
                    src={product.image || 'https://via.placeholder.com/120x90?text=Product'}
                    alt={product.name}
                    className="admin-product-thumb"
                  />

                  <div className="admin-product-meta">
                    <h4>{product.name}</h4>
                    <p>{product.category}</p>
                    <p>
                      Price: Rs. {Number(product.price || 0).toFixed(2)}
                      {hasDiscount ? ` | Discount: Rs. ${Number(product.discountPrice).toFixed(2)}` : ''}
                      {' | '}
                      <span className={isLowStock ? 'admin-low-stock-text' : ''}>
                        Stock: {stockCount}
                      </span>
                      {isLowStock ? <span className="admin-low-stock-badge">Low Stock</span> : null}
                    </p>
                  </div>

                  <div className="admin-product-actions">
                    <button type="button" className="btn-secondary" onClick={() => handleEdit(product)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-primary danger-btn"
                      onClick={() => handleDelete(product._id)}
                      disabled={deletingProductId === product._id}
                    >
                      {deletingProductId === product._id ? (
                        <>
                          <span className="admin-spinner admin-spinner-light" />
                          Deleting...
                        </>
                      ) : 'Delete'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
};

export default AdminDashboard;
