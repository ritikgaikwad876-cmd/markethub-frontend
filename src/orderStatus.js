export const ORDER_STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'];

export const getOrderStatusLabel = (status) => {
  const normalizedStatus = String(status || '').toLowerCase();

  if (!normalizedStatus) {
    return 'Pending';
  }

  return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
};

export const getOrderStatusIndex = (status) =>
  ORDER_STATUS_FLOW.indexOf(String(status || '').toLowerCase());
