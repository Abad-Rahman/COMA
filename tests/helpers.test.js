import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductPrice, normalizeProduct } from '../src/utils/helpers.js';

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
