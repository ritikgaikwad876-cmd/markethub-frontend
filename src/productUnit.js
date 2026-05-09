export const formatProductUnit = (unitValue) => {
  if (!unitValue) {
    return '';
  }

  return String(unitValue)
    .trim()
    .replace(/(\d)\s*([a-zA-Z]+)/g, '$1 $2')
    .replace(/\s+/g, ' ');
};

export const getProductUnit = (productLike) => {
  return formatProductUnit(productLike?.unit || productLike?.product?.unit || '');
};
