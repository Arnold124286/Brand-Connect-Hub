const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { initiateSTKPush } = require('../utils/mpesa');

const FEE = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10') / 100;

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', authenticate, requireRole('brand'), async (req, res) => {
  const { projectId, vendorId, amount, milestoneId, bidId } = req.body;
  if (!projectId || !vendorId || !amount) return res.status(400).json({ error: 'projectId, vendorId, amount required' });
  try {
    const proj = await db.query('SELECT title FROM projects WHERE pid=$1 AND brand_id=$2', [projectId, req.user.uid]);
    if (!proj.rows.length) return res.status(404).json({ error: 'Project not found or unauthorized' });
    const vendor = await db.query('SELECT u.full_name FROM vendor_profiles vp JOIN users u ON u.uid = vp.uid WHERE vp.id=$1', [vendorId]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    const platformFee = parseFloat((amount * FEE).toFixed(2));
    const netAmount = parseFloat((amount - platformFee).toFixed(2));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'kes',
          product_data: { name: `Escrow for Project: ${proj.rows[0].title}`, description: `Payment to ${vendor.rows[0].full_name}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/cancel`,
      metadata: { brandUid: req.user.uid, projectId, vendorId, bidId: bidId || '', amount: amount.toString(), milestoneId: milestoneId || '', platformFee: platformFee.toString(), netAmount: netAmount.toString() }
    });
    res.json({ url: session.url });
  } catch (err) { res.status(500).json({ error: 'Stripe Session Error' }); }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); } catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { brandUid, projectId, vendorId, bidId, amount, milestoneId, platformFee, netAmount } = session.metadata;
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO transactions (project_id, milestone_id, brand_id, vendor_id, amount, platform_fee, net_amount, payment_method, payment_ref, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'escrow_held')`,
        [projectId, milestoneId || null, brandUid, vendorId, parseFloat(amount), parseFloat(platformFee), parseFloat(netAmount), 'stripe', session.id]);
      await client.query(`UPDATE projects SET status='in_progress', assigned_vendor=$1 WHERE pid=$2`, [vendorId, projectId]);
      if (bidId) { await client.query(`UPDATE bids SET status='rejected' WHERE project_id=$1 AND id != $2`, [projectId, bidId]); await client.query(`UPDATE bids SET status='accepted' WHERE id=$1`, [bidId]); }
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); } finally { client.release(); }
  }
  res.json({ received: true });
});

router.post('/mpesa/stkpush', authenticate, async (req, res) => {
  const { amount, phoneNumber } = req.body;
  if (!amount || !phoneNumber) return res.status(400).json({ error: 'Amount and Phone required' });
  try {
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone;
    if (formattedPhone.length !== 12) return res.status(400).json({ error: 'Invalid Kenyan phone number format.' });
    const result = await initiateSTKPush(amount, formattedPhone);
    await db.query(`INSERT INTO transactions (brand_id, amount, payment_method, payment_ref, status) VALUES ($1, $2, 'mpesa', $3, 'pending')`, [req.user.uid, amount, result.CheckoutRequestID]);
    res.json({ message: 'STK Push initiated', checkoutID: result.CheckoutRequestID });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/mpesa/callback', async (req, res) => {
  const { Body } = req.body;
  if (!Body || !Body.stkCallback) return res.status(400).json({ error: 'Invalid callback body' });
  const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = Body.stkCallback;
  if (ResultCode === 0) {
    const metadata = CallbackMetadata.Item;
    const amountVal = metadata.find(i => i.Name === 'Amount')?.Value;
    const receiptVal = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const txn = await client.query(`UPDATE transactions SET status='released', payment_ref=$1, updated_at=NOW() WHERE payment_ref=$2 RETURNING brand_id`, [receiptVal, CheckoutRequestID]);
      if (txn.rows.length) await client.query(`UPDATE brand_profiles SET wallet_balance = wallet_balance + $1 WHERE uid = $2`, [amountVal, txn.rows[0].brand_id]);
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); } finally { client.release(); }
  } else { await db.query(`UPDATE transactions SET status='failed' WHERE payment_ref=$1`, [CheckoutRequestID]); }
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

router.post('/deposit', authenticate, requireRole('brand'), async (req, res) => {
  const { amount } = req.body;
  try {
    const { rows } = await db.query(`UPDATE brand_profiles SET wallet_balance = wallet_balance + $1 WHERE uid = $2 RETURNING wallet_balance`, [amount, req.user.uid]);
    await db.query(`INSERT INTO transactions (brand_id, amount, payment_method, status, payment_ref) VALUES ($1, $2, 'wallet_funding', 'released', 'FUND_WALLET')`, [req.user.uid, amount]);
    res.json({ message: 'Wallet funded!', balance: rows[0].wallet_balance });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/withdraw', authenticate, requireRole('vendor'), async (req, res) => {
  const { amount, method, details } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const vendor = await client.query('SELECT total_earnings FROM vendor_profiles WHERE uid = $1', [req.user.uid]);
    if (parseFloat(vendor.rows[0].total_earnings) < parseFloat(amount)) throw new Error('Insufficient earnings');
    await client.query('UPDATE vendor_profiles SET total_earnings = total_earnings - $1 WHERE uid = $2', [amount, req.user.uid]);
    await client.query(`INSERT INTO transactions (vendor_id, amount, payment_method, status, payment_ref) VALUES ($1, $2, $3, 'pending', $4)`,
      [req.user.uid, amount, method, `WITHDRAW_${method.toUpperCase()}_${Date.now()}`]);
    await client.query('COMMIT');
    res.json({ message: 'Withdrawal request submitted' });
  } catch (err) { await client.query('ROLLBACK'); res.status(400).json({ error: err.message }); } finally { client.release(); }
});

router.post('/pay-from-wallet', authenticate, requireRole('brand'), async (req, res) => {
  const { projectId, vendorId, amount, bidId } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const brand = await client.query('SELECT wallet_balance FROM brand_profiles WHERE uid = $1', [req.user.uid]);
    if (parseFloat(brand.rows[0].wallet_balance) < parseFloat(amount)) throw new Error('Insufficient balance');
    await client.query('UPDATE brand_profiles SET wallet_balance = wallet_balance - $1 WHERE uid = $2', [amount, req.user.uid]);
    const platformFee = parseFloat((amount * FEE).toFixed(2));
    const netAmount = parseFloat((amount - platformFee).toFixed(2));
    await client.query(`INSERT INTO transactions (project_id, brand_id, vendor_id, amount, platform_fee, net_amount, payment_method, status, payment_ref) VALUES ($1, $2, $3, $4, $5, $6, 'wallet', 'escrow_held', 'WALLET_PAY')`,
      [projectId, req.user.uid, vendorId, amount, platformFee, netAmount]);
    await client.query(`UPDATE projects SET status='in_progress', assigned_vendor=$1 WHERE pid=$2`, [vendorId, projectId]);
    if (bidId) { await client.query(`UPDATE bids SET status='rejected' WHERE project_id=$1 AND id != $2`, [projectId, bidId]); await client.query(`UPDATE bids SET status='accepted' WHERE id=$1`, [bidId]); }
    await client.query('COMMIT');
    res.json({ message: 'Success' });
  } catch (err) { await client.query('ROLLBACK'); res.status(400).json({ error: err.message }); } finally { client.release(); }
});

module.exports = router;
