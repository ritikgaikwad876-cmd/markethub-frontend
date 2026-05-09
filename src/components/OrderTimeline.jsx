import React from 'react';
import { ORDER_STATUS_FLOW, getOrderStatusIndex, getOrderStatusLabel } from '../orderStatus';

const OrderTimeline = ({ status }) => {
  const currentIndex = getOrderStatusIndex(status);

  if (currentIndex < 0) {
    return null;
  }

  return (
    <div className="order-tracking" aria-label="Order tracking progress">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div
            key={step}
            className={`order-tracking-step${isCompleted ? ' is-completed' : ''}${isActive ? ' is-active' : ''}`}
          >
            <span className="order-tracking-dot" aria-hidden="true" />
            <span className="order-tracking-label">{getOrderStatusLabel(step)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
