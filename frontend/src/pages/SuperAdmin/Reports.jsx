import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import Layout from '../../components/Layout';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalRestaurants: 0,
    totalUsers: 0,
  });
  const [orderTrend, setOrderTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [restaurantPerformance, setRestaurantPerformance] = useState([]);
  const [orderCategories, setOrderCategories] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await api.get('/reports/stats');
      setStats(statsResponse.data);

      // Mock data for trends and performance
      setOrderTrend([
        { date: 'Mon', orders: 45 },
        { date: 'Tue', orders: 52 },
        { date: 'Wed', orders: 48 },
        { date: 'Thu', orders: 61 },
        { date: 'Fri', orders: 78 },
        { date: 'Sat', orders: 92 },
        { date: 'Sun', orders: 85 },
      ]);

      setRevenueTrend([
        { date: 'Mon', revenue: 4500 },
        { date: 'Tue', revenue: 5200 },
        { date: 'Wed', revenue: 4800 },
        { date: 'Thu', revenue: 6100 },
        { date: 'Fri', revenue: 7800 },
        { date: 'Sat', revenue: 9200 },
        { date: 'Sun', revenue: 8500 },
      ]);

      setRestaurantPerformance([
        { name: 'Restaurant A', revenue: 45000, orders: 250 },
        { name: 'Restaurant B', revenue: 38000, orders: 210 },
        { name: 'Restaurant C', revenue: 52000, orders: 280 },
        { name: 'Restaurant D', revenue: 41000, orders: 225 },
      ]);

      setOrderCategories([
        { name: 'Dine In', value: 45, fill: '#FF6B6B' },
        { name: 'Takeaway', value: 35, fill: '#4ECDC4' },
        { name: 'Delivery', value: 20, fill: '#FFE66D' },
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Reports</h1>
          <p className="text-gray-600 mt-2">System-wide analytics and insights</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.totalOrders, color: 'bg-blue-50', icon: '📦' },
            { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, color: 'bg-green-50', icon: '💰' },
            { label: 'Total Restaurants', value: stats.totalRestaurants, color: 'bg-orange-50', icon: '🏪' },
            { label: 'Total Users', value: stats.totalUsers, color: 'bg-purple-50', icon: '👥' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.color} rounded-lg p-6 border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className="text-4xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Orders Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={orderTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Categories Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Restaurant Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Restaurant Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={restaurantPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#FF6B35" />
                <Bar yAxisId="right" dataKey="orders" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Performance Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Detailed Restaurant Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Restaurant Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Orders</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Revenue</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Avg Order Value</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {restaurantPerformance.map((restaurant, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{restaurant.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{restaurant.orders}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">₹{restaurant.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">₹{Math.round(restaurant.revenue / restaurant.orders)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-green-600 font-medium">+12.5%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
