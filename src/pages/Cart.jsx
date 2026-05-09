import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createRazorpayOrder, placeOrder, verifyRazorpayPayment } from '../api/orderApi';
import { useCart } from '../context/CartContext';
import { getProductUnit } from '../productUnit';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, removeFromCart, clearCartLocal } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [payingNow, setPayingNow] = useState(false);

  const loadRazorpayScript = () => {
    if (window.Razorpay) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const resetCheckoutForm = () => {
    setCustomerName('');
    setPhoneNumber('');
    setShippingAddress('');
  };

  const validateCheckoutDetails = () => {
    if (!customerName.trim() || !phoneNumber.trim() || !shippingAddress.trim()) {
      alert('Please enter name, phone number, and address');
      return false;
    }

    return true;
  };

  const handleIncrease = async (productId, currentQty) => {
    try {
      await updateQuantity(productId, currentQty + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleDecrease = async (productId, currentQty) => {
    try {
      await updateQuantity(productId, currentQty - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'RAZORPAY') {
      return;
    }

    if (!validateCheckoutDetails()) {
      return;
    }

    try {
      setPlacingOrder(true);
      const response = await placeOrder({
        shippingAddress,
        shippingDetails: {
          name: customerName,
          phone: phoneNumber,
          address: shippingAddress,
        },
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'RAZORPAY',
      });
      clearCartLocal();
      resetCheckoutForm();
      navigate('/order-success', {
        state: {
          order: response.order || null,
        },
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePayNow = async () => {
    if (!validateCheckoutDetails()) {
      return;
    }

    try {
      setPayingNow(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay checkout failed to load. Please try again.');
        return;
      }

      const razorpayOrder = await createRazorpayOrder();

      const options = {
        key: razorpayOrder.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'MarketHub',
        description: 'MarketHub grocery order payment',
        order_id: razorpayOrder.orderId,
        prefill: {
          name: customerName,
          contact: phoneNumber,
        },
        notes: {
          address: shippingAddress,
        },
        theme: {
          color: '#0f7a42',
        },
        handler: async (response) => {
          try {
            await verifyRazorpayPayment(response);

            const orderResponse = await placeOrder({
              shippingAddress,
              shippingDetails: {
                name: customerName,
                phone: phoneNumber,
                address: shippingAddress,
              },
              paymentMethod: 'RAZORPAY',
            });

            clearCartLocal();
            resetCheckoutForm();
            navigate('/order-success', {
              state: {
                order: orderResponse.order || null,
              },
            });
            setPayingNow(false);
          } catch (error) {
            setPayingNow(false);
            alert(error.response?.data?.message || 'Payment verified but order placement failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setPayingNow(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => {
        alert('Payment failed. Please try again.');
        setPayingNow(false);
      });
      razorpay.open();
    } catch (err) {
      setPayingNow(false);
      alert(err.response?.data?.message || 'Unable to start Razorpay payment');
    }
  };

  const subtotal = useMemo(() => {
    return (cart.items || []).reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  }, [cart.items]);

  if (loading) {
    return <p className="status-msg">Loading cart...</p>;
  }

  return (
    <section>
      <h2 className="section-title">Cart</h2>

      {!cart.items || cart.items.length === 0 ? (
        <p className="status-msg">Your cart is empty. <Link to="/products">Browse products</Link></p>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.items.map((item) => {
              const product = item.product || {};
              const productId = product._id || item.product;
              const productUnit = getProductUnit(product);

              return (
                <article key={productId} className="cart-item">
                  <img
                    src={product.image || 'https://via.placeholder.com/120x90?text=Item'}
                    alt={product.name || 'Product'}
                    className="cart-thumb"
                  />

                  <div className="cart-item-info">
                    <h3>{product.name || 'Product item'}</h3>
                    {productUnit ? <p className="product-size-inline cart-item-size">{productUnit}</p> : null}
                    <p className="product-category">Rs. {item.priceSnapshot} each</p>
                    <div className="qty-controls">
                      <button type="button" onClick={() => handleDecrease(productId, item.quantity)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => handleIncrease(productId, item.quantity)}>+</button>
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <p>Rs. {item.priceSnapshot * item.quantity}</p>
                    <button type="button" className="btn-secondary" onClick={() => handleRemove(productId)}>
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart-summary">
            <h3>Order Summary</h3>
            <p>Items: {cart.items.length}</p>
            <p className="summary-total">Subtotal: Rs. {subtotal}</p>

            <label htmlFor="customerName" className="summary-label">Name</label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
              className="summary-select"
            />

            <label htmlFor="phoneNumber" className="summary-label">Phone Number</label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              className="summary-select"
            />

            <label htmlFor="shippingAddress" className="summary-label">Address</label>
            <textarea
              id="shippingAddress"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Enter full delivery address"
              className="summary-textarea"
            />

            <label htmlFor="paymentMethod" className="summary-label">Payment Method</label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="summary-select"
            >
              <option value="COD">Cash on Delivery</option>
              <option value="RAZORPAY">Razorpay</option>
            </select>

            {paymentMethod === 'COD' ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
              >
                {placingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handlePayNow}
                disabled={payingNow}
              >
                {payingNow ? 'Starting Payment...' : 'Pay Now'}
              </button>
            )}
          </aside>
        </div>
      )}
    </section>
  );
};

export default Cart;
