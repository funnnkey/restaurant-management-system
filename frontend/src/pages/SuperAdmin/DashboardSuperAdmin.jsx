import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, TrendingUp, Activity } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const DashboardSuperAdmin = () => {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalAdmins: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all restaurants
      const restaurantsRes = await api.get('/restaurants');
      const restaurants = restaurantsRes.data;
      
      setStats({
        totalRestaurants: restaurants.length,
        totalAdmins: restaurants.length, // One admin per restaurant in this setup
        totalOrders: Math.floor(Math.random() * 1000) + 500, // Mock data
        totalRevenue: Math.floor(Math.random() * 50000) + 10000, // Mock data
      });

      // Mock chart data
      setChartData([
        { name: 'Mon', orders: 240, revenue: 24000 },
        { name: 'Tue', orders: 321, revenue: 32100 },
        { name: 'Wed', orders: 289, revenue: 28900 },
        { name: 'Thu', orders: 200, revenue: 20000 },
        { name: 'Fri', orders: 278, revenue: 27800 },
        { name: 'Sat', orders: 189, revenue: 18900 },
        { name: 'Sun', orders: 239, revenue: 23900 },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <Icon size={40} color={color} className="opacity-20" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            title="Total Restaurants"
            value={stats.totalRestaurants}
            color="#FF6B35"
          />
          <StatCard
            icon={Users}
            title="Active Admins"
            value={stats.totalAdmins}
            color="#16C79A"
          />
          <StatCard
            icon={Activity}
            title="Total Orders (Today)"
            value={stats.totalOrders}
            color="#F59E0B"
          />
          <StatCard
            icon={TrendingUp}
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            color="#8B5CF6"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Orders Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#FF6B35" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#16C79A" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/superadmin/restaurants"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition text-center"
            >
              <Building2 className="inline mb-2" size={24} color="#FF6B35" />
              <p className="font-semibold text-gray-900">Manage Restaurants</p>
              <p className="text-gray-600 text-sm">Add, edit or manage restaurants</p>
            </a>
            <a
              href="/superadmin/users"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition text-center"
            >
              <Users className="inline mb-2" size={24} color="#16C79A" />
              <p className="font-semibold text-gray-900">Manage Users</p>
              <p className="text-gray-600 text-sm">Manage admins and permissions</p>
            </a>
            <a
              href="/superadmin/reports"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition text-center"
            >
              <TrendingUp className="inline mb-2" size={24} color="#F59E0B" />
              <p className="font-semibold text-gray-900">Platform Reports</p>
              <p className="text-gray-600 text-sm">View detailed analytics</p>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardSuperAdmin;
