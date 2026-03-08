const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { protect, admin } = require('../middleware/auth');

// Generate bill number
const generateBillNumber = async (restaurantId) => {
  const count = await Bill.countDocuments({ restaurantId });
  const billNumber = `BILL-${String(count + 1).padStart(6, '0')}`;
  return billNumber;
};

// Get restaurant ID helper
const getRestaurantId = (req) => {
  return req.user.role === 'superadmin' 
    ? req.query.restaurantId || req.body.restaurantId 
    : req.user.restaurantId;
};

// @route   GET /api/bills
// @desc    Get all bills for a restaurant
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { startDate, endDate, paymentStatus, page = 1, limit = 50 } = req.query;

    let query = { restaurantId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const bills = await Bill.find(query)
      .populate('orderId', 'orderType tableNumber customerName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Bill.countDocuments(query);

    res.json({
      bills,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bills/:id
// @desc    Get single bill
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('orderId');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bills
// @desc    Create a new bill from order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { orderId, items, discount, discountType, paymentMethod, splitDetails } = req.body;

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if bill already exists
    if (order.billId) {
      return res.status(400).json({ message: 'Bill already exists for this order' });
    }

    // Get restaurant for tax rate
    const restaurant = await Restaurant.findById(restaurantId);
    const taxRate = restaurant?.taxRate || 18;

    // Use provided items or order items
    let billItems = items || order.items;
    let subtotal = billItems.reduce((sum, item) => sum + item.total, 0);

    // Calculate discount
    let discountAmount = 0;
    const finalDiscountType = discountType || order.discountType || 'percentage';
    const finalDiscount = discount || 0;

    if (finalDiscount > 0) {
      if (finalDiscountType === 'percentage') {
        discountAmount = (subtotal * finalDiscount) / 100;
      } else {
        discountAmount = finalDiscount;
      }
    }

    // Calculate tax
    const taxableAmount = subtotal - discountAmount;
    const tax = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + tax;

    // Generate bill number
    const billNumber = await generateBillNumber(restaurantId);

    const bill = await Bill.create({
      restaurantId,
      orderId: order._id,
      billNumber,
      items: billItems,
      subtotal,
      tax,
      taxRate,
      discount: discountAmount,
      discountType: finalDiscountType,
      total,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'paid',
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      splitDetails,
    });

    // Update order with bill
    order.billId = bill._id;
    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod || 'cash';
    order.status = 'delivered';
    await order.save();

    res.status(201).json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bills/:id
// @desc    Update/Edit a bill
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const { items, discount, discountType, paymentMethod, splitDetails } = req.body;

    // Recalculate if items changed
    if (items) {
      let subtotal = items.reduce((sum, item) => sum + item.total, 0);
      
      // Calculate discount
      let discountAmount = 0;
      const finalDiscountType = discountType || bill.discountType || 'percentage';
      const finalDiscount = discount !== undefined ? discount : bill.discount;

      if (finalDiscount > 0) {
        if (finalDiscountType === 'percentage') {
          discountAmount = (subtotal * finalDiscount) / 100;
        } else {
          discountAmount = finalDiscount;
        }
      }

      // Calculate tax
      const taxableAmount = subtotal - discountAmount;
      const tax = (taxableAmount * bill.taxRate) / 100;
      const total = taxableAmount + tax;

      bill.items = items;
      bill.subtotal = subtotal;
      bill.discount = discountAmount;
      bill.discountType = finalDiscountType;
      bill.tax = tax;
      bill.total = total;
    }

    if (paymentMethod) bill.paymentMethod = paymentMethod;
    if (splitDetails) bill.splitDetails = splitDetails;

    const updatedBill = await bill.save();

    // Also update the associated order
    if (bill.orderId) {
      await Order.findByIdAndUpdate(bill.orderId, {
        items: bill.items,
        subtotal: bill.subtotal,
        tax: bill.tax,
        discount: bill.discount,
        total: bill.total,
      });
    }

    res.json(updatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bills/:id
// @desc    Cancel/Refund a bill
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    bill.paymentStatus = 'refunded';
    await bill.save();

    // Update associated order
    if (bill.orderId) {
      await Order.findByIdAndUpdate(bill.orderId, {
        paymentStatus: 'refunded',
        status: 'cancelled',
      });
    }

    res.json({ message: 'Bill refunded', bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bills/order/:orderId
// @desc    Get bill by order ID
// @access  Private
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const bill = await Bill.findOne({ orderId: req.params.orderId });
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
