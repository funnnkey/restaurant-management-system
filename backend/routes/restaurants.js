const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { protect, admin, superadmin } = require('../middleware/auth');

// @route   GET /api/restaurants
// @desc    Get all restaurants (superadmin only)
// @access  Private/Superadmin
router.get('/', protect, superadmin, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/restaurants/:id
// @desc    Get restaurant by ID
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/restaurants
// @desc    Create a restaurant
// @access  Private/Superadmin
router.post('/', protect, superadmin, async (req, res) => {
  try {
    const { name, address, phone, email, logo, taxRate } = req.body;

    const restaurant = await Restaurant.create({
      name,
      address,
      phone,
      email,
      logo,
      taxRate: taxRate || 18,
    });

    res.status(201).json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/restaurants/:id
// @desc    Update restaurant
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user owns this restaurant
    if (req.user.role !== 'superadmin' && req.user.restaurantId.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedRestaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/restaurants/:id
// @desc    Delete restaurant
// @access  Private/Superadmin
router.delete('/:id', protect, superadmin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    await restaurant.deleteOne();
    res.json({ message: 'Restaurant removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/restaurants/:id/users
// @desc    Get restaurant users
// @access  Private/Admin
router.get('/:id/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ restaurantId: req.params.id }).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
