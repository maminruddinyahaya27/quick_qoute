function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function computeTotals(items, taxRate = 0, discount = 0) {
  const subtotal = (items || []).reduce(
    (sum, it) => sum + Number(it.quantity || 0) * Number(it.rate || 0),
    0
  );
  const discounted = subtotal - Number(discount || 0);
  const taxAmount = (discounted * Number(taxRate || 0)) / 100;
  const total = discounted + taxAmount;

  return {
    subtotal: round2(subtotal),
    taxAmount: round2(taxAmount),
    total: round2(total),
  };
}

export function formatMoney(n) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
