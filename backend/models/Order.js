const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  orderType: {
    type: String,
    enum: ['dine_in', 'take_away', 'delivery'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending',
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 18,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  customerName: {
    type: String,
  },
  customerPhone: {
    type: String,
  },
  tableNumber: {
    type: String,
  },
  deliveryAddress: {
    type: String,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet', 'pending'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);
