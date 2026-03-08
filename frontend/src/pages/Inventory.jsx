import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import Layout from '../components/Layout';
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  Search,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);

  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    alertThreshold: '10',
    category: 'other',
    purchasePrice: '',
    isActive: true,
  });

  const [adjustForm, setAdjustForm] = useState({
    adjustment: '',
    operation: 'add',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, lowStockRes, statsRes] = await Promise.all([
        inventoryAPI.getAll(),
        inventoryAPI.getLowStock(),
        inventoryAPI.getStats(),
      ]);
      setItems(itemsRes.data);
      setLowStockItems(lowStockRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        quantity: parseFloat(form.quantity),
        alertThreshold: parseFloat(form.alertThreshold),
        purchasePrice: parseFloat(form.purchasePrice) || 0,
      };
      if (editingItem) {
        await inventoryAPI.update(editingItem._id, data);
      } else {
        await inventoryAPI.create(data);
      }
      setShowModal(false);
      setEditingItem(null);
      setForm({
        name: '',
        quantity: '',
        unit: 'kg',
        alertThreshold: '10',
        category: 'other',
        purchasePrice: '',
        isActive: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.adjust(adjustingItem._id, {
        adjustment: parseFloat(adjustForm.adjustment),
        operation: adjustForm.operation,
      });
      setShowAdjustModal(false);
      setAdjustingItem(null);
      setAdjustForm({ adjustment: '', operation: 'add' });
      fetchData();
    } catch (error) {
      console.error('Error adjusting quantity:', error);
      alert('Failed to adjust quantity');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await inventoryAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLowStock = (item) => item.quantity <= item.alertThreshold;

  const units = ['kg', 'g', 'l', 'ml', 'pcs', 'pack', 'dozen'];
  const categories = ['vegetables', 'fruits', 'meat', 'dairy', 'grains', 'spices', 'beverages', 'packaging', 'other'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark">Inventory</h1>
            <p className="text-gray-500">Manage your inventory items</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setForm({
                name: '',
                quantity: '',
                unit: 'kg',
                alertThreshold: '10',
                category: 'other',
                purchasePrice: '',
                isActive: true,
              });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.lowStockItems || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats?.outOfStock || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalValue || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="card border-l-4 border-yellow-500">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" />
              Low Stock Alert
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockItems.slice(0, 6).map((item) => (
                <div key={item._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium text-yellow-700">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Inventory Table */}
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Alert At</th>
                <th>Purchase Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td className="font-medium">{item.name}</td>
                    <td className="capitalize">{item.category}</td>
                    <td className="font-medium">{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.alertThreshold}</td>
                    <td>{formatCurrency(item.purchasePrice)}</td>
                    <td>
                      {isLowStock(item) ? (
                        <span className="badge badge-pending">Low Stock</span>
                      ) : (
                        <span className="badge badge-delivered">In Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setAdjustingItem(item);
                            setAdjustForm({ adjustment: '', operation: 'add' });
                            setShowAdjustModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Adjust Quantity"
                        >
                          <PlusCircle size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setForm({
                              name: item.name,
                              quantity: item.quantity.toString(),
                              unit: item.unit,
                              alertThreshold: item.alertThreshold.toString(),
                              category: item.category,
                              purchasePrice: item.purchasePrice?.toString() || '',
                              isActive: item.isActive,
                            });
                            setShowModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1 hover:bg-gray-100 rounded text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Edit Item' : 'Add Item'}
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Unit</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="input"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Alert Threshold</label>
                    <input
                      type="number"
                      value={form.alertThreshold}
                      onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
                      className="input"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="input"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c} className="capitalize">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Purchase Price</label>
                  <input
                    type="number"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="p-4 border-t flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Quantity Modal */}
      {showAdjustModal && adjustingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Adjust Quantity</h2>
              <p className="text-sm text-gray-500">{adjustingItem.name}</p>
            </div>
            <form onSubmit={handleAdjust}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Operation</label>
                  <select
                    value={adjustForm.operation}
                    onChange={(e) => setAdjustForm({ ...adjustForm, operation: e.target.value })}
                    className="input"
                  >
                    <option value="add">Add</option>
                    <option value="subtract">Remove</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity ({adjustingItem.unit})</label>
                  <input
                    type="number"
                    value={adjustForm.adjustment}
                    onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: e.target.value })}
                    className="input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Current: {adjustingItem.quantity} {adjustingItem.unit}
                </p>
              </div>
              <div className="p-4 border-t flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Adjust
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Inventory;
