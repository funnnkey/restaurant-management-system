const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  logo: {
    type: String,
  },
  taxRate: {
    type: Number,
    default: 18, // GST 18%
  },
  currency: {
    type: String,
    default: '₹',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
