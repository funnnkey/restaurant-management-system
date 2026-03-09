const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { protect, admin } = require('../middleware/auth');

// Get restaurant ID helper
const getRestaurantId = (req) => {
  return req.user.role === 'superadmin' 
    ? req.query.restaurantId || req.body.restaurantId 
    : req.user.restaurantId;
};

// @route   GET /api/inventory
// @desc    Get all inventory items for a restaurant
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { category, isActive } = req.query;

    let query = { restaurantId };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const items = await Inventory.find(query).sort({ name: 1 });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/low-stock', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);

    const items = await Inventory.find({ 
      restaurantId,
      isActive: true,
      $expr: { $lte: ['$quantity', '$alertThreshold'] }
    });

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Add a new inventory item
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const restaurantId = req.user.role === 'superadmin' 
      ? req.body.restaurantId 
      : req.user.restaurantId;

    const { name, quantity, unit, alertThreshold, category, purchasePrice, isActive } = req.body;

    // Validate inputs
    if (!name) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    if (!unit || !['kg', 'g', 'l', 'ml', 'pcs', 'pack', 'dozen'].includes(unit)) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    if (quantity !== undefined && (quantity < 0 || !Number.isInteger(quantity))) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    if (alertThreshold !== undefined && (alertThreshold < 0 || !Number.isInteger(alertThreshold))) {
      return res.status(400).json({ message: 'Invalid alert threshold' });
    }

    if (purchasePrice !== undefined && purchasePrice < 0) {
      return res.status(400).json({ message: 'Invalid purchase price' });
    }

    const item = await Inventory.create({
      restaurantId,
      name,
      quantity: quantity || 0,
      unit,
      alertThreshold: alertThreshold || 10,
      category: category || 'other',
      purchasePrice: purchasePrice || 0,
      isActive: isActive !== false,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update an inventory item
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id/adjust
// @desc    Adjust inventory quantity
// @access  Private/Admin
router.put('/:id/adjust', protect, admin, async (req, res) => {
  try {
    const { adjustment, operation } = req.body;

    // Validate inputs
    if (adjustment === undefined) {
      return res.status(400).json({ message: 'Adjustment value is required' });
    }

    if (adjustment < 0 || !Number.isInteger(adjustment)) {
      return res.status(400).json({ message: 'Adjustment must be a non-negative integer' });
    }

    if (!operation || !['add', 'subtract'].includes(operation)) {
      return res.status(400).json({ message: 'Operation must be "add" or "subtract"' });
    }

    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (operation === 'add') {
      item.quantity += adjustment;
    } else if (operation === 'subtract') {
      if (adjustment > item.quantity) {
        return res.status(400).json({ message: 'Cannot subtract more than available quantity' });
      }
      item.quantity -= adjustment;
    }

    await item.save();
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete an inventory item
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/stats
// @desc    Get inventory statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);

    const totalItems = await Inventory.countDocuments({ restaurantId, isActive: true });
    
    const lowStockItems = await Inventory.countDocuments({
      restaurantId,
      isActive: true,
      $expr: { $lte: ['$quantity', '$alertThreshold'] }
    });

    const outOfStock = await Inventory.countDocuments({
      restaurantId,
      isActive: true,
      quantity: 0
    });

    const items = await Inventory.find({ restaurantId, isActive: true });
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

    res.json({
      totalItems,
      lowStockItems,
      outOfStock,
      totalValue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
