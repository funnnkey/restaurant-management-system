import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { restaurantsAPI } from '../services/api';
import Layout from '../components/Layout';
import { Save, Building, Phone, Mail, MapPin } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxRate: 18,
  });

  useEffect(() => {
    if (user?.restaurant) {
      setForm({
        name: user.restaurant.name || '',
        address: user.restaurant.address || '',
        phone: user.restaurant.phone || '',
        email: user.restaurant.email || '',
        taxRate: user.restaurant.taxRate || 18,
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await restaurantsAPI.update(user.restaurantId, form);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-dark">Settings</h1>
          <p className="text-gray-500">Manage your restaurant settings</p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Restaurant Information
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Restaurant Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
              <input
                type="number"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) })}
                className="input"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">GST rate for billing</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
