const express = require('express');
const router = express.Router();
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const { protect, admin } = require('../middleware/auth');

// Get restaurant ID helper
const getRestaurantId = (req) => {
  return req.user.role === 'superadmin' 
    ? req.query.restaurantId || req.body.restaurantId 
    : req.user.restaurantId;
};

// @route   GET /api/menu/categories
// @desc    Get all categories for a restaurant
// @access  Private
router.get('/categories', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const categories = await MenuCategory.find({ restaurantId })
      .sort({ order: 1, createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/menu/categories
// @desc    Create a category
// @access  Private/Admin
router.post('/categories', protect, admin, async (req, res) => {
  try {
    const restaurantId = req.user.role === 'superadmin' 
      ? req.body.restaurantId 
      : req.user.restaurantId;

    const { name, description, order, isActive } = req.body;

    const category = await MenuCategory.create({
      restaurantId,
      name,
      description,
      order: order || 0,
      isActive: isActive !== false,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/menu/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put('/categories/:id', protect, admin, async (req, res) => {
  try {
    const category = await MenuCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updatedCategory = await MenuCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/menu/categories/:id
// @desc    Delete a category
// @access  Private/Admin
router.delete('/categories/:id', protect, admin, async (req, res) => {
  try {
    const category = await MenuCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has items
    const itemCount = await MenuItem.countDocuments({ categoryId: req.params.id });
    if (itemCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with menu items. Remove items first.' 
      });
    }

    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/menu/items
// @desc    Get all menu items for a restaurant
// @access  Private
router.get('/items', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { categoryId } = req.query;
    
    let query = { restaurantId };
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const items = await MenuItem.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/menu/items
// @desc    Create a menu item
// @access  Private/Admin
router.post('/items', protect, admin, async (req, res) => {
  try {
    const restaurantId = req.user.role === 'superadmin' 
      ? req.body.restaurantId 
      : req.user.restaurantId;

    const { name, description, price, image, categoryId, isAvailable, preparationTime } = req.body;

    // Validate inputs
    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ message: 'Name, category ID, and price are required' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    const item = await MenuItem.create({
      restaurantId,
      categoryId,
      name,
      description,
      price,
      image,
      isAvailable: isAvailable !== false,
      preparationTime: preparationTime || 15,
    });

    const populatedItem = await MenuItem.findById(item._id).populate('categoryId', 'name');
    res.status(201).json(populatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/menu/items/:id/availability
// @desc    Toggle item availability
// @access  Private/Admin
router.put('/items/:id/availability', protect, admin, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/menu/items/:id
// @desc    Get single menu item
// @access  Private
router.get('/items/:id', protect, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id)
      .populate('categoryId', 'name');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/menu/items/:id
// @desc    Update a menu item
// @access  Private/Admin
router.put('/items/:id', protect, admin, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Validate inputs
    if (req.body.price !== undefined && req.body.price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('categoryId', 'name');

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/menu/items/:id
// @desc    Delete a menu item
// @access  Private/Admin
router.delete('/items/:id', protect, admin, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

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

module.exports = router;
