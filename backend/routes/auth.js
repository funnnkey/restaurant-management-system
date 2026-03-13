const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { protect, superadmin } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aapkirasoi2024', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new restaurant and admin
// @access  Private/Superadmin
router.post('/register', protect, superadmin, async (req, res) => {
  try {
    const { email, password, name, restaurantName, phone, address } = req.body;

    // Validate inputs
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create restaurant first
    const restaurant = await Restaurant.create({
      name: restaurantName || name + "'s Restaurant",
      phone,
      address,
    });

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: 'admin',
      restaurantId: restaurant._id,
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurant: restaurant,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Demo mode - use mock data
    if (global.demoMode) {
      const mockData = require('../mockData');
      const user = mockData.users.find(u => u.email === email);
      
      if (user) {
        let restaurant = null;
        if (user.restaurantId) {
          restaurant = mockData.restaurants.find(r => r._id === user.restaurantId);
        }

        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
          restaurant: restaurant,
          token: generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    // Normal mode - use MongoDB
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      let restaurant = null;
      if (user.restaurantId) {
        restaurant = await Restaurant.findById(user.restaurantId);
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurant: restaurant,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // Demo mode - use mock data
    if (global.demoMode) {
      const mockData = require('../mockData');
      const user = mockData.users.find(u => u._id === req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let restaurant = null;
      if (user.restaurantId) {
        restaurant = mockData.restaurants.find(r => r._id === user.restaurantId);
      }

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurant: restaurant,
      });
    }

    // Normal mode - use MongoDB
    const user = await User.findById(req.user._id).select('-password');
    let restaurant = null;
    if (user.restaurantId) {
      restaurant = await Restaurant.findById(user.restaurantId);
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurant: restaurant,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
