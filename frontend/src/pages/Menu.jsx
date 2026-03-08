import { useState, useEffect } from 'react';
import { menuAPI } from '../services/api';
import Layout from '../components/Layout';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Utensils,
  Search,
} from 'lucide-react';

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, itemsRes] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getAllItems(),
      ]);
      setCategories(catRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await menuAPI.updateCategory(editingCategory._id, categoryForm);
      } else {
        await menuAPI.createCategory(categoryForm);
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', isActive: true });
      fetchData();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...itemForm,
        price: parseFloat(itemForm.price),
      };
      if (editingItem) {
        await menuAPI.updateItem(editingItem._id, data);
      } else {
        await menuAPI.createItem(data);
      }
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        isAvailable: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await menuAPI.deleteCategory(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await menuAPI.deleteItem(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await menuAPI.toggleAvailability(item._id);
      fetchData();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId?._id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <h1 className="text-2xl font-bold text-dark">Menu Management</h1>
            <p className="text-gray-500">Manage your restaurant menu</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', description: '', isActive: true });
                setShowCategoryModal(true);
              }}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Category
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setItemForm({
                  name: '',
                  description: '',
                  price: '',
                  categoryId: categories[0]?._id || '',
                  isAvailable: true,
                });
                setShowItemModal(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Item
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full ${
                !selectedCategory
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === cat._id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryForm({
                      name: cat.name,
                      description: cat.description || '',
                      isActive: cat.isActive,
                    });
                    setShowCategoryModal(true);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="p-1 hover:bg-gray-100 rounded text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`card ${!item.isAvailable ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{item.name}</h4>
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`p-1 rounded ${item.isAvailable ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {item.isAvailable ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {item.description || 'No description'}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {item.categoryId?.name || 'Uncategorized'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(item.price)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setItemForm({
                          name: item.name,
                          description: item.description || '',
                          price: item.price.toString(),
                          categoryId: item.categoryId?._id,
                          isAvailable: item.isAvailable,
                        });
                        setShowItemModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="p-1 hover:bg-gray-100 rounded text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="input"
                    rows="3"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="categoryActive"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="categoryActive">Active</label>
                </div>
              </div>
              <div className="p-4 border-t flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Edit Item' : 'Add Item'}
              </h2>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="input"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <input
                    type="number"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="itemAvailable"
                    checked={itemForm.isAvailable}
                    onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="itemAvailable">Available</label>
                </div>
              </div>
              <div className="p-4 border-t flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
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
    </Layout>
  );
};

export default Menu;
