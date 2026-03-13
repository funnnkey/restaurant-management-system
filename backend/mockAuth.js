// Mock authentication for demo mode
const jwt = require('jsonwebtoken');
const mockData = require('./mockData');

// Mock login - no password validation needed for demo
const mockLogin = async (email, password) => {
  const user = mockData.users.find(u => u.email === email);
  if (!user) {
    return null;
  }
  
  // For demo, accept any password
  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    restaurantId: user.restaurantId,
    phone: user.phone,
  };
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aapkirasoi2024', {
    expiresIn: '30d',
  });
};

// Mock user finder
const findUserById = (id) => {
  return mockData.users.find(u => u._id === id);
};

module.exports = {
  mockLogin,
  generateToken,
  findUserById,
};
