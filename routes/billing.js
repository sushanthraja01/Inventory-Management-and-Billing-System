const express = require("express");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get product by ID or name
router.post("/getProduct", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { identifier } = req.body;

    const query = isNaN(identifier)
      ? { name: identifier, userId }
      : { id: parseInt(identifier), userId };

    const product = await Product.findOne(query);
    res.json(product || {});
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ error: "Failed to fetch product." });
  }
});

// Update inventory quantity (for billing)
router.post("/updateInventory", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, qtyChange } = req.body;

    const product = await Product.findOne({ _id: productId, userId });
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.quantity += qtyChange;
    await product.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Update inventory error:", err);
    res.status(500).json({ error: "Failed to update inventory." });
  }
});

// Search suggestions
router.get("/suggestions", requireAuth, async (req, res) => {
  try {
    const query = req.query.q || "";
    const userId = req.session.userId;

    if (query.length === 0) {
      return res.json([]);
    }

    const suggestions = await Product.find({
      name: { $regex: query, $options: "i" },
      userId,
    })
      .limit(10)
      .select("name -_id");

    res.json(suggestions.map((p) => p.name));
  } catch (err) {
    console.error("Suggestions error:", err);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});

// Get product by ID param (for billing by ID)
router.post("/products/id/:id", requireAuth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.session.userId;
    const productId = Number(req.params.id);

    const product = await Product.findOne({ id: productId, userId });
    if (!product) return res.status(404).json({ error: "Item not found" });
    if (product.quantity < quantity) return res.status(400).json({ error: "Insufficient quantity" });

    await Product.updateOne({ id: productId, userId }, { $inc: { quantity: -quantity } });
    res.status(200).json({ id: product.id, name: product.name, price: product.price, quantity });
  } catch (err) {
    console.error("Product by ID error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get product by name param (for billing by name)
router.post("/products/name/:name", requireAuth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.session.userId;
    const name = req.params.name;

    const product = await Product.findOne({ name, userId });
    if (!product) return res.status(404).json({ error: "Item not found" });
    if (product.quantity < quantity) return res.status(400).json({ error: "Insufficient quantity" });

    await Product.updateOne({ name, userId }, { $inc: { quantity: -quantity } });
    res.status(200).json({ id: product.id, name: product.name, price: product.price, quantity });
  } catch (err) {
    console.error("Product by name error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
