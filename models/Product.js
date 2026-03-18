const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  price: Number,
  quantity: Number,
  expire: Date,
  userId: mongoose.Schema.Types.ObjectId,
});

productSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);
