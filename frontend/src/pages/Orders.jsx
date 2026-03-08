import { useState, useEffect } from 'react';
import { ordersAPI, menuAPI, billsAPI } from '../services/api';
import Layout from '../components/Layout';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  Receipt,
} from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    orderType: '',
  });

  // New order form state
  const [newOrder, setNewOrder] = useState({
    orderType: 'dine_in',
    customerName: '',
    tableNumber: '',
    items: [],
    notes: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchMenu();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll(filters);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const [catRes, itemsRes] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getAllItems(),
      ]);
      setCategories(catRes.data);
      setMenuItems(itemsRes.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleGenerateBill = async (order) => {
    try {
      await billsAPI.create({
        orderId: order._id,
        paymentMethod: 'cash',
      });
      fetchOrders();
      alert('Bill generated successfully!');
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to generate bill');
    }
  };

  const addItemToOrder = (item) => {
    const existingItem = newOrder.items.find((i) => i.menuItemId === item._id);
    if (existingItem) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items.map((i) =>
          i.menuItemId === item._id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
            : i
        ),
      });
    } else {
      setNewOrder({
        ...newOrder,
        items: [
          ...newOrder.items,
          {
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: 1,
            total: item.price,
          },
        ],
      });
    }
  };

  const removeItemFromOrder = (itemId) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter((i) => i.menuItemId !== itemId),
    });
  };

  const handleCreateOrder = async () => {
    if (newOrder.items.length === 0) {
      alert('Please add items to the order');
      return;
    }

    try {
      await ordersAPI.create(newOrder);
      setShowNewOrderModal(false);
      setNewOrder({
        orderType: 'dine_in',
        customerName: '',
        tableNumber: '',
        items: [],
        notes: '',
      });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  const calculateOrderTotal = () => {
    const subtotal = newOrder.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18;
    return { subtotal, tax, total: subtotal + tax };
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      preparing: ChefHat,
      ready: CheckCircle,
      delivered: Truck,
      cancelled: XCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon size={16} />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const orderTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'dine_in', label: 'Dine In' },
    { value: 'take_away', label: 'Take Away' },
    { value: 'delivery', label: 'Delivery' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const filteredMenuItems = selectedCategory
    ? menuItems.filter((item) => item.categoryId?._id === selectedCategory)
    : menuItems;

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark">Orders</h1>
            <p className="text-gray-500">Manage all your restaurant orders</p>
          </div>
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            New Order
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.orderType}
              onChange={(e) => setFilters({ ...filters, orderType: e.target.value })}
              className="input max-w-xs"
            >
              {orderTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input max-w-xs"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No orders found
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">#{order._id.slice(-6).toUpperCase()}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {order.orderType.replace('_', ' ')}
                    </p>
                  </div>
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-gray-500">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-sm text-gray-500">+{order.items.length - 3} more items</p>
                  )}
                </div>

                <div className="border-t pt-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    )}
                    {!order.billId && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleGenerateBill(order)}
                        className="btn btn-primary py-1 px-2 text-sm"
                        title="Generate Bill"
                      >
                        <Receipt size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">New Order</h2>
            </div>
            <div className="flex h-[calc(90vh-140px)]">
              {/* Menu Items */}
              <div className="w-1/2 border-r p-4 overflow-y-auto">
                <div className="mb-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filteredMenuItems.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => addItemToOrder(item)}
                      disabled={!item.isAvailable}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        item.isAvailable
                          ? 'bg-gray-50 hover:bg-primary hover:text-white'
                          : 'bg-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs opacity-70">{formatCurrency(item.price)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Details */}
              <div className="w-1/2 p-4 flex flex-col">
                <div className="mb-4 space-y-3">
                  <select
                    value={newOrder.orderType}
                    onChange={(e) => setNewOrder({ ...newOrder, orderType: e.target.value })}
                    className="input"
                  >
                    <option value="dine_in">Dine In</option>
                    <option value="take_away">Take Away</option>
                    <option value="delivery">Delivery</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    className="input"
                  />
                  {newOrder.orderType === 'dine_in' && (
                    <input
                      type="text"
                      placeholder="Table Number"
                      value={newOrder.tableNumber}
                      onChange={(e) => setNewOrder({ ...newOrder, tableNumber: e.target.value })}
                      className="input"
                    />
                  )}
                </div>

                {/* Order Items */}
                <div className="flex-1 overflow-y-auto mb-4">
                  {newOrder.items.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No items added</p>
                  ) : (
                    <div className="space-y-2">
                      {newOrder.items.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} x {formatCurrency(item.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(item.total)}</span>
                            <button
                              onClick={() => removeItemFromOrder(item.menuItemId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateOrderTotal().subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%)</span>
                    <span>{formatCurrency(calculateOrderTotal().tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(calculateOrderTotal().total)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowNewOrderModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    className="btn btn-primary flex-1"
                  >
                    Create Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Orders;
