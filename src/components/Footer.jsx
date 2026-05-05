import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LEFT */}
        <div className="footer-section">
          <h2 className="footer-logo">MarketHub</h2>
          <p>Fresh groceries delivered to your doorstep with quality and trust.</p>
        </div>

        {/* CENTER */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">Orders</Link>
        </div>

        {/* RIGHT */}
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: support@markethub.com</p>
          <p>Phone: +91 8319540876</p>
          <p>Indore, India</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 MarketHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;