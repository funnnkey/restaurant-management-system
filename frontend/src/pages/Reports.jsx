import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import Layout from '../components/Layout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [annualData, setAnnualData] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [daily, weekly, monthly, annual, top] = await Promise.all([
        reportsAPI.getDaily(),
        reportsAPI.getWeekly(),
        reportsAPI.getMonthly(),
        reportsAPI.getAnnual(),
        reportsAPI.getTopItems({ type: 'monthly', limit: 10 }),
      ]);
      setDailyData(daily.data);
      setWeeklyData(weekly.data);
      setMonthlyData(monthly.data);
      setAnnualData(annual.data);
      setTopItems(top.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#FF6B35', '#16C79A', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

  const renderDailyReport = () => {
    if (!dailyData) return null;
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">{dailyData.totalOrders}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(dailyData.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(dailyData.averageOrderValue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tax Collected</p>
                <p className="text-2xl font-bold">{formatCurrency(dailyData.totalTax)}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Orders by Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Orders by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Dine In', value: dailyData.byType?.dine_in?.orders || 0 },
                    { name: 'Take Away', value: dailyData.byType?.take_away?.orders || 0 },
                    { name: 'Delivery', value: dailyData.byType?.delivery?.orders || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[0, 1, 2].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">Order Status</h3>
            <div className="space-y-3">
              {Object.entries(dailyData.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize">{status}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyReport = () => {
    if (!weeklyData) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{weeklyData.totalOrders}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(weeklyData.totalRevenue)}</p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Weekly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#FF6B35" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderMonthlyReport = () => {
    if (!monthlyData) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{monthlyData.totalOrders}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyData.totalRevenue)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Tax Collected</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyData.totalTax)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Avg Order</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyData.averageOrderValue)}</p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Monthly Sales - {monthlyData.month}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#FF6B35" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderAnnualReport = () => {
    if (!annualData) return null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{annualData.totalOrders}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Annual Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(annualData.totalRevenue)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Tax Collected</p>
            <p className="text-2xl font-bold">{formatCurrency(annualData.totalTax)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Avg Order</p>
            <p className="text-2xl font-bold">{formatCurrency(annualData.averageOrderValue)}</p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Annual Sales - {annualData.year}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={annualData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-dark">Sales Reports</h1>
          <p className="text-gray-500">View your restaurant performance</p>
        </div>

        {/* Report Type Tabs */}
        <div className="flex gap-2 border-b">
          {['daily', 'weekly', 'monthly', 'annual'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 font-medium capitalize ${
                reportType === type
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <>
            {reportType === 'daily' && renderDailyReport()}
            {reportType === 'weekly' && renderWeeklyReport()}
            {reportType === 'monthly' && renderMonthlyReport()}
            {reportType === 'annual' && renderAnnualReport()}
          </>
        )}

        {/* Top Selling Items */}
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Top Selling Items</h3>
          {topItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.revenue)}</p>
                    <p className="text-sm text-gray-500">{item.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
