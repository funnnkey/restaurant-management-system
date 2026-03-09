const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Quantity cannot be negative'],
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'pcs', 'pack', 'dozen'],
  },
  alertThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Alert threshold cannot be negative'],
  },
  category: {
    type: String,
    enum: ['vegetables', 'fruits', 'meat', 'dairy', 'grains', 'spices', 'beverages', 'packaging', 'other'],
    default: 'other',
  },
  purchasePrice: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Inventory', inventorySchema);
