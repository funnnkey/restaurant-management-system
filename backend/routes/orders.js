const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { protect, admin } = require('../middleware/auth');

// Get restaurant ID helper
const getRestaurantId = (req) => {
  return req.user.role === 'superadmin' 
    ? req.query.restaurantId || req.body.restaurantId 
    : req.user.restaurantId;
};

// @route   GET /api/orders
// @desc    Get all orders for a restaurant
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { status, orderType, startDate, endDate, page = 1, limit = 50 } = req.query;

    let query = { restaurantId };

    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/stats/today
// @desc    Get today's order statistics
// @access  Private
router.get('/stats/today', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
    
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const readyOrders = orders.filter(o => o.status === 'ready').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    res.json({
      totalOrders,
      totalRevenue,
      totalTax,
      totalDiscount,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      pendingOrders,
      readyOrders,
      deliveredOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization - user must be superadmin or own this restaurant
    if (req.user.role !== 'superadmin' && order.restaurantId.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    
    const { 
      orderType, 
      items, 
      customerName, 
      customerPhone, 
      tableNumber, 
      deliveryAddress,
      notes,
      discount,
      discountType 
    } = req.body;

    // Validate inputs
    if (!orderType || !['dine_in', 'take_away', 'delivery'].includes(orderType)) {
      return res.status(400).json({ message: 'Invalid order type' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and cannot be empty' });
    }

    for (const item of items) {
      if (!item.menuItemId || !item.name || !item.quantity || item.price === undefined) {
        return res.status(400).json({ message: 'Missing required item fields' });
      }
      if (item.quantity <= 0 || item.price < 0) {
        return res.status(400).json({ message: 'Invalid quantity or price' });
      }
    }

    if (discount !== undefined && discount < 0) {
      return res.status(400).json({ message: 'Discount cannot be negative' });
    }

    if (discountType && !['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ message: 'Invalid discount type' });
    }

    // Get restaurant tax rate
    const restaurant = await Restaurant.findById(restaurantId);
    const taxRate = restaurant?.taxRate || 18;

    // Calculate order totals
    let subtotal = 0;
    const orderItems = items.map(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      return {
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
      };
    });

    // Calculate discount
    let discountAmount = 0;
    if (discount && discount > 0) {
      if (discountType === 'percentage') {
        if (discount > 100) {
          return res.status(400).json({ message: 'Discount percentage cannot exceed 100' });
        }
        discountAmount = (subtotal * discount) / 100;
      } else {
        if (discount > subtotal) {
          return res.status(400).json({ message: 'Fixed discount cannot exceed subtotal' });
        }
        discountAmount = discount;
      }
    }

    // Calculate tax
    const taxableAmount = subtotal - discountAmount;
    const tax = (taxableAmount * taxRate) / 100;

    // Calculate total
    const total = taxableAmount + tax;

    const order = await Order.create({
      restaurantId,
      orderType,
      items: orderItems,
      subtotal,
      tax,
      taxRate,
      discount: discountAmount,
      discountType: discountType || 'percentage',
      total,
      customerName,
      customerPhone,
      tableNumber,
      deliveryAddress,
      notes,
      status: 'pending',
      paymentStatus: 'pending',
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update an order
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role !== 'superadmin' && order.restaurantId.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // If order has a bill, don't allow editing
    if (order.billId) {
      return res.status(400).json({ message: 'Cannot edit order with existing bill' });
    }

    const { items, discount, discountType, notes } = req.body;

    // Recalculate if items changed
    if (items) {
      let subtotal = 0;
      const orderItems = items.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return {
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: itemTotal,
        };
      });

      // Calculate discount
      let discountAmount = 0;
      if (discount) {
        if (discountType === 'percentage') {
          discountAmount = (subtotal * discount) / 100;
        } else {
          discountAmount = discount;
        }
      }

      // Calculate tax
      const taxableAmount = subtotal - discountAmount;
      const tax = (taxableAmount * order.taxRate) / 100;
      const total = taxableAmount + tax;

      order.items = orderItems;
      order.subtotal = subtotal;
      order.discount = discountAmount;
      order.tax = tax;
      order.total = total;
    }

    if (notes !== undefined) order.notes = notes;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    
    // If cancelled, update payment status
    if (status === 'cancelled') {
      order.paymentStatus = 'refunded';
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status
// @access  Private
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const { paymentMethod, paymentStatus } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel an order
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role !== 'superadmin' && order.restaurantId.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this order' });
    }

    // If order has a bill, don't allow cancellation
    if (order.billId) {
      return res.status(400).json({ message: 'Cannot cancel order with existing bill' });
    }

    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();

    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
