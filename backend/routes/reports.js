const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const { protect, admin } = require('../middleware/auth');

// Get restaurant ID helper
const getRestaurantId = (req) => {
  return req.user.role === 'superadmin' 
    ? req.query.restaurantId || req.body.restaurantId 
    : req.user.restaurantId;
};

// Helper to get date range
const getDateRange = (type, customDate) => {
  const now = customDate ? new Date(customDate) : new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (type) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'annual':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// @route   GET /api/reports/daily
// @desc    Get daily sales report
// @access  Private
router.get('/daily', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { date } = req.query;
    const { start, end } = getDateRange('daily', date);

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid',
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);

    const byType = {
      dine_in: { orders: 0, revenue: 0 },
      take_away: { orders: 0, revenue: 0 },
      delivery: { orders: 0, revenue: 0 },
    };

    orders.forEach(order => {
      byType[order.orderType].orders++;
      byType[order.orderType].revenue += order.total;
    });

    const byStatus = {
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    res.json({
      date: start,
      totalOrders,
      totalRevenue,
      totalTax,
      totalDiscount,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      byType,
      byStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/weekly
// @desc    Get weekly sales report
// @access  Private
router.get('/weekly', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { startDate } = req.query;
    const { start, end } = getDateRange('weekly', startDate);

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid',
    });

    // Group by day
    const dailyData = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { orders: 0, revenue: 0 };
    }

    orders.forEach(order => {
      const key = order.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].orders++;
        dailyData[key].revenue += order.total;
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    res.json({
      startDate: start,
      endDate: end,
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      dailyData: Object.entries(dailyData).map(([date, data]) => ({
        date,
        ...data,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/monthly
// @desc    Get monthly sales report
// @access  Private
router.get('/monthly', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { year, month } = req.query;
    
    const now = new Date();
    const start = new Date(year || now.getFullYear(), month ? parseInt(month) - 1 : now.getMonth(), 1);
    const end = new Date(year || now.getFullYear(), month ? parseInt(month) : now.getMonth() + 1, 0, 23, 59, 59);

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid',
    });

    // Group by day
    const daysInMonth = end.getDate();
    const dailyData = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const key = `${i}`;
      dailyData[key] = { orders: 0, revenue: 0 };
    }

    orders.forEach(order => {
      const key = order.createdAt.getDate().toString();
      if (dailyData[key]) {
        dailyData[key].orders++;
        dailyData[key].revenue += order.total;
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);

    const byType = {
      dine_in: { orders: 0, revenue: 0 },
      take_away: { orders: 0, revenue: 0 },
      delivery: { orders: 0, revenue: 0 },
    };

    orders.forEach(order => {
      byType[order.orderType].orders++;
      byType[order.orderType].revenue += order.total;
    });

    res.json({
      month: start.toLocaleString('default', { month: 'long' }),
      year: start.getFullYear(),
      totalOrders,
      totalRevenue,
      totalTax,
      totalDiscount,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      byType,
      dailyData: Object.entries(dailyData).map(([day, data]) => ({
        day: parseInt(day),
        ...data,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/annual
// @desc    Get annual sales report
// @access  Private
router.get('/annual', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { year } = req.query;
    
    const now = new Date();
    const start = new Date(year || now.getFullYear(), 0, 1);
    const end = new Date(year || now.getFullYear(), 11, 31, 23, 59, 59);

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid',
    });

    // Group by month
    const monthlyData = {};
    for (let i = 0; i < 12; i++) {
      const key = i;
      monthlyData[key] = { orders: 0, revenue: 0 };
    }

    orders.forEach(order => {
      const key = order.createdAt.getMonth();
      if (monthlyData[key]) {
        monthlyData[key].orders++;
        monthlyData[key].revenue += order.total;
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalTax = orders.reduce((sum, o) => sum + o.tax, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    res.json({
      year: start.getFullYear(),
      totalOrders,
      totalRevenue,
      totalTax,
      totalDiscount,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month: monthNames[parseInt(month)],
        monthIndex: parseInt(month),
        ...data,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/top-items
// @desc    Get top selling items
// @access  Private
router.get('/top-items', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { type = 'weekly', limit = 10 } = req.query;
    
    let dateRange;
    if (type === 'daily') dateRange = getDateRange('daily');
    else if (type === 'weekly') dateRange = getDateRange('weekly');
    else if (type === 'monthly') dateRange = getDateRange('monthly');
    else dateRange = getDateRange('annual');

    const orders = await Order.find({
      restaurantId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      paymentStatus: 'paid',
    });

    // Aggregate item sales
    const itemSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (itemSales[item.name]) {
          itemSales[item.name].quantity += item.quantity;
          itemSales[item.name].revenue += item.total;
        } else {
          itemSales[item.name] = {
            name: item.name,
            quantity: item.quantity,
            revenue: item.total,
          };
        }
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit));

    res.json(topItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/summary
// @desc    Get comprehensive summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    const today = getDateRange('daily');

    // Today's stats
    const todayOrders = await Order.find({
      restaurantId,
      createdAt: { $gte: today.start, $lte: today.end },
      paymentStatus: 'paid',
    });

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const todayOrdersCount = todayOrders.length;

    // This month's stats
    const monthRange = getDateRange('monthly');
    const monthOrders = await Order.find({
      restaurantId,
      createdAt: { $gte: monthRange.start, $lte: monthRange.end },
      paymentStatus: 'paid',
    });

    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
    const monthOrdersCount = monthOrders.length;

    // Low stock items
    const lowStockItems = await Inventory.find({
      restaurantId,
      isActive: true,
      $expr: { $lte: ['$quantity', '$alertThreshold'] }
    });

    // Pending orders
    const pendingOrders = await Order.countDocuments({
      restaurantId,
      status: { $in: ['pending', 'preparing'] },
    });

    res.json({
      today: {
        orders: todayOrdersCount,
        revenue: todayRevenue,
        averageOrderValue: todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0,
      },
      thisMonth: {
        orders: monthOrdersCount,
        revenue: monthRevenue,
        averageOrderValue: monthOrdersCount > 0 ? monthRevenue / monthOrdersCount : 0,
      },
      lowStockCount: lowStockItems.length,
      pendingOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
