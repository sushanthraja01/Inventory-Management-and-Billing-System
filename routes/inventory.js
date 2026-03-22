const express = require("express");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get all inventory items for logged-in user
router.get("/", requireAuth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.userId });
    res.json(products);
  } catch (err) {
    console.error("Fetch inventory error:", err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Add a new product
router.post("/", requireAuth, async (req, res) => {
  try {
    const { id, name, price, quantity, expire } = req.body;
    const today = new Date();

    if (new Date(expire) < today) {
      return res.status(400).json({ error: "Product is expired and cannot be added." });
    }

    const exists = await Product.findOne({ id: Number(id), userId: req.userId });
    if (exists) {
      return res.status(400).json({ error: "Product with this ID already exists" });
    }

    const product = await Product.create({
      id: Number(id),
      name,
      price: Number(price),
      quantity: Number(quantity),
      expire,
      userId: req.userId,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Update a product
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, expire } = req.body;
    const expiryDate = new Date(expire);

    if (isNaN(expiryDate) || expiryDate < new Date()) {
      return res.status(400).json({ error: "Invalid or expired date" });
    }

    const result = await Product.updateOne(
      { _id: id, userId: req.userId },
      { $set: { name, price, quantity, expire } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: "Product update failed" });
    }

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete a product
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await Product.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
