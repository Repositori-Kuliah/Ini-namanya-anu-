/**
 * Pure Functional Billing and Financial Calculation (JavaScript).
 * Zero side effects, deterministic calculation matching SQL rules.
 */

import { ok, err } from '../fp/result.js';

export const sum = (xs) => xs.reduce((acc, curr) => acc + curr, 0);

export const itemSubtotal = (unitPrice, quantity) =>
  Math.max(0, Math.round(unitPrice * quantity));

/** Layanan 5% dari subtotal */
export const calculateServiceFee = (subtotal) =>
  Math.round(subtotal * 0.05);

/** Pajak PB1 10% dari (subtotal + layanan) */
export const calculateTax = (subtotal, serviceFee) =>
  Math.round((subtotal + serviceFee) * 0.1);

/**
 * Pure function: calculates itemized bill breakdown from subtotal
 * @param {number} subtotal
 */
export const calculateBill = (subtotal) => {
  const safeSubtotal = Math.max(0, Math.round(subtotal));
  const serviceFee = calculateServiceFee(safeSubtotal);
  const tax = calculateTax(safeSubtotal, serviceFee);
  const total = safeSubtotal + serviceFee + tax;

  return Object.freeze({
    subtotal: safeSubtotal,
    serviceFee,
    tax,
    total,
  });
};

/**
 * Reverse calculate subtotal from total amount (1.155 divisor)
 * @param {number} total
 */
export const subtotalOfTotal = (total) =>
  Math.round(total / 1.155);

/**
 * Pure function: aggregate multiple order subtotals into one session bill
 * @param {number[]} orderSubtotals
 */
export const aggregateSessionBills = (orderSubtotals) => {
  const bills = orderSubtotals.map(calculateBill);
  const aggregated = bills.reduce(
    (acc, b) => ({
      subtotal: acc.subtotal + b.subtotal,
      serviceFee: acc.serviceFee + b.serviceFee,
      tax: acc.tax + b.tax,
      total: acc.total + b.total,
    }),
    { subtotal: 0, serviceFee: 0, tax: 0, total: 0 }
  );

  return Object.freeze(aggregated);
};

/**
 * Pure change calculation
 * @param {number} received
 * @param {number} totalDue
 */
export const calculateChange = (received, totalDue) => {
  if (received < totalDue) {
    return err(
      `Uang diterima (Rp${received.toLocaleString('id-ID')}) kurang dari total tagihan (Rp${totalDue.toLocaleString('id-ID')})`
    );
  }
  return ok(received - totalDue);
};

export const formatRupiah = (amount) =>
  'Rp' + Math.round(amount).toLocaleString('id-ID');
