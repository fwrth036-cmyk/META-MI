const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('.'));

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || "PUT_YOUR_PAYMOB_API_KEY_HERE";
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID || 123456;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID || 123456;

let orders = [];
let fake_attempts = 0;

app.post('/api/create-payment', async (req, res) => {
  const { net, pkg, price, buy, phone, method } = req.body;
  if (!net || !price || !phone) return res.json({ ok: false, error: 'بيانات ناقصة' });
  const orderId = 'META-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
  const order = { id: orderId, net, pkg, price, buy, phone, method, status: 'pending', code: null, created: Date.now() };
  orders.unshift(order);
  try {
    const auth = await fetch('https://accept.paymob.com/api/auth/tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: PAYMOB_API_KEY }) }).then(r => r.json());
    const payOrder = await fetch('https://accept.paymob.com/api/ecommerce/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` }, body: JSON.stringify({ delivery_needed: false, amount_cents: price * 100, currency: 'EGP', merchant_order_id: orderId, items: [{ name: `${net} - ${pkg}`, amount_cents: price * 100, quantity: 1 }] }) }).then(r => r.json());
    const key = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth