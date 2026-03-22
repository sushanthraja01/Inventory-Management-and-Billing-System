const express = require("express");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get alerts data (expired + expiring soon products)
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const expiredProducts = await Product.find({ userId, expire: { $lt: today } });
    const expiringSoon = await Product.find({ userId, expire: { $gte: today, $lt: nextWeek } });

    const messages = [];

    if (expiredProducts.length > 0) {
      messages.push({
        type: "expired",
        title: "Expired Products",
        products: expiredProducts.map((p) => ({
          name: p.name,
          quantity: p.quantity,
        })),
        note: "The above products are expired. You can remove them.",
      });
    }

    if (expiringSoon.length > 0) {
      messages.push({
        type: "expiring",
        title: "Products Expiring Soon",
        products: expiringSoon.map((p) => {
          const expiryDate = new Date(p.expire);
          const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 3600 * 24));
          return {
            name: p.name,
            quantity: p.quantity,
            expiryDate: expiryDate.toDateString(),
            daysRemaining,
          };
        }),
      });
    }

    res.json({ messages });
  } catch (err) {
    console.error("Alerts error:", err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

module.exports = router;
