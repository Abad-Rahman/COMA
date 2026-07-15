import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductPrice, normalizeProduct, compareOrders } from '../src/utils/helpers.js';

test('normalizeProduct keeps old and new prices when only a single price exists', () => {
  const product = normalizeProduct({ name: 'Test', price: 35 });
  assert.equal(product.oldPrice, 35);
  assert.equal(product.newPrice, 35);
  assert.equal(product.price, 35);
});

test('getProductPrice returns the correct price for each customer price type', () => {
  const product = normalizeProduct({ name: 'Test', oldPrice: 35, newPrice: 55 });
  assert.equal(getProductPrice(product, 'oldPrice'), 35);
  assert.equal(getProductPrice(product, 'newPrice'), 55);
  assert.equal(getProductPrice(product, 'unknown'), 35);
});

test('compareOrders puts newer dates first and then higher order numbers first', () => {
  const a = { date: '2026-07-15', orderNo: '02-W2-Jul' };
  const b = { date: '2026-07-15', orderNo: '10-W2-Jul' };
  const c = { date: '2026-07-14', orderNo: '01-W1-Jul' };

  assert.equal(compareOrders(a, b) > 0, true);
  assert.equal(compareOrders(b, c) < 0, true);
});
