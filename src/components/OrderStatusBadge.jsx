import React from 'react';
import { getOrderStatusLabel } from '../orderStatus';

const OrderStatusBadge = ({ status, className = '' }) => {
  const normalizedStatus = String(status || 'pending').toLowerCase();

  return (
    <span className={`order-status-badge status-${normalizedStatus} ${className}`.trim()}>
      {getOrderStatusLabel(normalizedStatus)}
    </span>
  );
};

export default OrderStatusBadge;
