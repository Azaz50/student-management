const express = require('express');
const Razorpay = require('razorpay');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
require('dotenv').config();

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order Route
router.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json({ ...order, key: process.env.RAZORPAY_KEY_ID });

  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Verify Payment Route
router.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);

    if (isValidSignature) {
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(400).json({ status: 'verification_failed' });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
