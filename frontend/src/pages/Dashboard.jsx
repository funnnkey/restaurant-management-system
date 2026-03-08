import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, ordersAPI } from '../services/api';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Utensils,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, todayRes, ordersRes] = await Promise.all([
        reportsAPI.getSummary(),
        ordersAPI.getTodayStats(),
        ordersAPI.getAll({ limit: 5 }),
      ]);
      setStats(summaryRes.data);
      setTodayStats(todayRes.data);
      setRecentOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      preparing: 'badge-preparing',
      ready: 'badge-ready',
      delivered: 'badge-delivered',
      cancelled: 'badge-cancelled',
    };
    return badges[status] || 'badge-pending';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's your restaurant overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Orders */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Orders</p>
                <p className="text-2xl font-bold text-dark">{todayStats?.totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
              <TrendingUp size={16} />
              <span>{todayStats?.byType?.dine_in || 0} Dine In</span>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Revenue</p>
                <p className="text-2xl font-bold text-dark">{formatCurrency(todayStats?.totalRevenue || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Avg: {formatCurrency(todayStats?.averageOrderValue || 0)}/order
            </div>
          </div>

          {/* Pending Orders */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-dark">
                  {(todayStats?.pendingOrders || 0) + (todayStats?.preparingOrders || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {todayStats?.pendingOrders || 0} pending, {todayStats?.preparingOrders || 0} preparing
            </div>
          </div>

          {/* Low Stock */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-dark">{stats?.lowStockCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Needs attention
            </div>
          </div>
        </div>

        {/* Orders by Type & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Orders by Type */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Orders by Type</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Utensils className="w-5 h-5 text-primary" />
                  <span>Dine In</span>
                </div>
                <span className="font-semibold">{todayStats?.byType?.dine_in || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <span>Take Away</span>
                </div>
                <span className="font-semibold">{todayStats?.byType?.take_away || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span>Delivery</span>
                </div>
                <span className="font-semibold">{todayStats?.byType?.delivery || 0}</span>
              </div>
            </div>
          </div>

          {/* Orders by Status */}
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Order Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span>Pending</span>
                </div>
                <span className="font-semibold">{todayStats?.byStatus?.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Preparing</span>
                </div>
                <span className="font-semibold">{todayStats?.byStatus?.preparing || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Delivered</span>
                </div>
                <span className="font-semibold">{todayStats?.byStatus?.delivered || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>Cancelled</span>
                </div>
                <span className="font-semibold">{todayStats?.byStatus?.cancelled || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Recent Orders</h3>
            <Link to="/admin/orders" className="text-primary hover:underline text-sm">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="font-medium">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="capitalize">{order.orderType.replace('_', ' ')}</td>
                      <td>{order.customerName || '-'}</td>
                      <td className="font-medium">{formatCurrency(order.total)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
