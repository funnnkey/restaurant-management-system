const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuCategory = require('./models/MenuCategory');
const MenuItem = require('./models/MenuItem');
const Inventory = require('./models/Inventory');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aapki-rasoi';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuCategory.deleteMany({});
    await MenuItem.deleteMany({});
    await Inventory.deleteMany({});
    console.log('Cleared existing data');

    // Create restaurant
    const restaurant = await Restaurant.create({
      name: 'Demo Restaurant',
      address: '123 Main Street, City',
      phone: '+91 9876543210',
      email: 'demo@restaurant.com',
      taxRate: 18,
      isActive: true,
    });
    console.log('Created restaurant');

    // Create admin user (plain password - will be hashed by User model pre-save hook)
    const adminUser = await User.create({
      email: 'admin@demo.com',
      password: 'demo123',
      name: 'Admin',
      role: 'admin',
      restaurantId: restaurant._id,
      phone: '+91 9876543210',
    });
    console.log('Created admin user: admin@demo.com / demo123');

    // Create superadmin user (plain password - will be hashed by User model pre-save hook)
    const superAdminUser = await User.create({
      email: 'superadmin@aapkirasoi.com',
      password: 'demo123',
      name: 'Super Admin',
      role: 'superadmin',
      phone: '+91 9876543210',
    });
    console.log('Created superadmin user: superadmin@aapkirasoi.com / demo123');

    // Create menu categories
    const categories = await MenuCategory.insertMany([
      { restaurantId: restaurant._id, name: 'Starters', description: 'Appetizers and starters', order: 1, isActive: true },
      { restaurantId: restaurant._id, name: 'Main Course', description: 'Main dishes', order: 2, isActive: true },
      { restaurantId: restaurant._id, name: 'Biryani', description: 'Rice dishes', order: 3, isActive: true },
      { restaurantId: restaurant._id, name: 'Beverages', description: 'Drinks and beverages', order: 4, isActive: true },
      { restaurantId: restaurant._id, name: 'Desserts', description: 'Sweet dishes', order: 5, isActive: true },
    ]);
    console.log('Created menu categories');

    // Create menu items
    const menuItems = [
      { restaurantId: restaurant._id, categoryId: categories[0]._id, name: 'Paneer Tikka', description: 'Grilled paneer cubes', price: 250, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[0]._id, name: 'Chicken Wings', description: 'Spicy chicken wings', price: 300, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[0]._id, name: 'Vegetable Soup', description: 'Fresh vegetable soup', price: 120, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[1]._id, name: 'Butter Chicken', description: 'Creamy tomato gravy chicken', price: 350, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[1]._id, name: 'Palak Paneer', description: 'Spinach and paneer curry', price: 280, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[1]._id, name: 'Dal Makhani', description: 'Black lentil curry', price: 250, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[2]._id, name: 'Chicken Biryani', description: 'Aromatic rice with chicken', price: 350, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[2]._id, name: 'Veg Biryani', description: 'Mixed vegetable biryani', price: 280, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[2]._id, name: 'Mutton Biryani', description: 'Lamb biryani', price: 450, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[3]._id, name: 'Cold Drink', description: 'Soft drinks', price: 40, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[3]._id, name: 'Lassi', description: 'Sweet yogurt drink', price: 60, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[3]._id, name: 'Masala Chai', description: 'Spiced Indian tea', price: 30, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[4]._id, name: 'Gulab Jamun', description: 'Sweet milk dumplings', price: 80, isAvailable: true },
      { restaurantId: restaurant._id, categoryId: categories[4]._id, name: 'Ice Cream', description: 'Vanilla ice cream', price: 100, isAvailable: true },
    ];
    await MenuItem.insertMany(menuItems);
    console.log('Created menu items');

    // Create inventory items
    const inventoryItems = [
      { restaurantId: restaurant._id, name: 'Rice', quantity: 50, unit: 'kg', alertThreshold: 10, category: 'grains', purchasePrice: 40, isActive: true },
      { restaurantId: restaurant._id, name: 'Wheat Flour', quantity: 30, unit: 'kg', alertThreshold: 5, category: 'grains', purchasePrice: 25, isActive: true },
      { restaurantId: restaurant._id, name: 'Chicken', quantity: 20, unit: 'kg', alertThreshold: 5, category: 'meat', purchasePrice: 180, isActive: true },
      { restaurantId: restaurant._id, name: 'Paneer', quantity: 8, unit: 'kg', alertThreshold: 3, category: 'dairy', purchasePrice: 300, isActive: true },
      { restaurantId: restaurant._id, name: 'Tomatoes', quantity: 15, unit: 'kg', alertThreshold: 5, category: 'vegetables', purchasePrice: 30, isActive: true },
      { restaurantId: restaurant._id, name: 'Onions', quantity: 20, unit: 'kg', alertThreshold: 5, category: 'vegetables', purchasePrice: 25, isActive: true },
      { restaurantId: restaurant._id, name: 'Milk', quantity: 25, unit: 'l', alertThreshold: 10, category: 'dairy', purchasePrice: 45, isActive: true },
      { restaurantId: restaurant._id, name: 'Cooking Oil', quantity: 10, unit: 'l', alertThreshold: 3, category: 'other', purchasePrice: 120, isActive: true },
    ];
    await Inventory.insertMany(inventoryItems);
    console.log('Created inventory items');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@demo.com / demo123');
    console.log('Super Admin: superadmin@aapkirasoi.com / demo123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
